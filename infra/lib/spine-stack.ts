import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  CfnOutput,
  CustomResource,
  Duration,
  Fn,
  RemovalPolicy,
  Stack,
  type StackProps,
} from 'aws-cdk-lib'
import { HttpApi, HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2'
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations'
import {
  AllowedMethods,
  CachePolicy,
  Distribution,
  OriginProtocolPolicy,
  OriginRequestCookieBehavior,
  OriginRequestHeaderBehavior,
  OriginRequestPolicy,
  OriginRequestQueryStringBehavior,
  PriceClass,
  ViewerProtocolPolicy,
} from 'aws-cdk-lib/aws-cloudfront'
import { HttpOrigin } from 'aws-cdk-lib/aws-cloudfront-origins'
import { CfnCluster } from 'aws-cdk-lib/aws-dsql'
import { PolicyStatement } from 'aws-cdk-lib/aws-iam'
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda'
import { type BundlingOptions, NodejsFunction, OutputFormat } from 'aws-cdk-lib/aws-lambda-nodejs'
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs'
import type { Construct } from 'constructs'

// ADR 0005's spine, as code. Nothing deploys from this file: it makes a template, and change 9017
// deploys it.

export const REGION = 'ap-southeast-1'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '../..')

// Where the API Lambdas get their database role from. It is a stack constant and not a default
// inside the Lambda: the Lambda refuses to start without DSQL_DB_ROLE (R14), so the choice is made
// here, in one place, where it can be read and reviewed.
//
// OPEN, FOR THE OWNER AND CHANGE 9017: this is `admin`, because no other database role exists. The
// first migration creates tables and nothing else, so a narrower role would need its own migration
// (CREATE ROLE, AWS IAM GRANT to this stack's Lambda role, GRANT on the tables). Until then the API
// Lambdas hold dsql:DbConnectAdmin, which is more than they need.
export const API_DB_ROLE = 'admin'
// A test pins this to the literal 'admin'. Changing it, which the least-privilege follow-up must,
// needs a migration that creates the role first, and the test is there to say so.

// The IAM action that lets a Lambda mint the SigV4 auth token for a database role. The `admin` role
// takes the admin action and any other role the ordinary one, which is how api/src/db/connection.ts
// chooses which token to mint. This must say the same thing, or every connection is refused.
export const connectAction = (role: string): string =>
  role === 'admin' ? 'dsql:DbConnectAdmin' : 'dsql:DbConnect'

// Lambda's ceiling for a request is API Gateway's: 30 seconds. R15 and connection.ts work out that
// the worst case of a stuck connection is 25 s, so this sits just under the gateway's, and a Lambda
// that is cut off reports as a timeout, not as the gateway's blank 503.
const API_TIMEOUT = Duration.seconds(29)

// R17: the API Lambda's bundle is under 1 MB, measured on this output, minified. Unminified the
// bundle is about 1.28 MB, so `minify` is what keeps it inside the budget and the test reads what
// this produces. The R17 1 MB figure is index.js alone, the code. The source map beside it
// (index.js.map, about 1.9 MB) also ships: it is left out of the 1 MB figure because Node reads it
// only to make a stack trace legible, and every function carries NODE_OPTIONS=--enable-source-maps
// for that. A second, provisional 3 MB limit in the tests covers code and map together.
//
// CommonJS, because `pg` is CommonJS and an ES module bundle of it needs a `require` shim. `pg-native`
// is not bundled: `pg` only loads it if asked for `pg.native`, which nothing here does, and it is not
// installed. The AWS SDK is bundled, and not left to the runtime's copy: `@aws-sdk/dsql-signer` is
// not something the Node 22 runtime is known to ship, and a copy of a given version is what was
// tested. Naming `externalModules` replaces CDK's default of leaving `@aws-sdk/*` out.
const BUNDLING: BundlingOptions = {
  minify: true,
  target: 'node22',
  format: OutputFormat.CJS,
  externalModules: ['pg-native'],
  sourceMap: true,
}

// A hash of every migration file, so that adding or editing one changes the custom resource's
// properties and CloudFormation runs the runner again.
export function digestOf(directory: string): string {
  const hash = createHash('sha256')
  for (const name of readdirSync(directory)
    .filter((file) => file.endsWith('.sql'))
    .sort()) {
    hash.update(name)
    hash.update('\0')
    hash.update(readFileSync(join(directory, name)))
    hash.update('\0')
  }
  return hash.digest('hex')
}

export type SpineStackProps = {
  // Where the migration files are. A parameter so that a test can add a file and see the digest move.
  migrationsDir?: string
}

export class SpineStack extends Stack {
  constructor(scope: Construct, id: string, props: SpineStackProps = {}) {
    // `StackProps` is not offered: the region is not a thing a caller picks (D-012 fixed it).
    super(scope, id, {
      env: { region: REGION },
      terminationProtection: true,
      description: 'AI Lift Coach spine: the API, its database and the CDN in front of both',
    } satisfies StackProps)

    const migrationsDir = props.migrationsDir ?? join(repoRoot, 'api/migrations')

    // ---- the database ---------------------------------------------------------------------------
    // No VPC, no NAT gateway: DSQL is reached over its public endpoint with a SigV4 auth token (ADR
    // 0005). Deletion protection and a retained resource: this is the Lifter's data.
    const cluster = new CfnCluster(this, 'Cluster', { deletionProtectionEnabled: true })
    cluster.applyRemovalPolicy(RemovalPolicy.RETAIN)

    // ---- the Lambdas ----------------------------------------------------------------------------
    // Every function names its own log group, so that no group exists with the CDK's default of
    // never expiring. 14 days, set explicitly (R16, ADR 0005's CloudWatch budget).
    const logGroup = (name: string): LogGroup =>
      new LogGroup(this, `${name}Logs`, {
        retention: RetentionDays.TWO_WEEKS,
        removalPolicy: RemovalPolicy.DESTROY,
      })

    const apiEntry = join(repoRoot, 'api/src/handlers.ts')
    const common = {
      runtime: Runtime.NODEJS_22_X,
      architecture: Architecture.ARM_64,
      projectRoot: repoRoot,
      depsLockFilePath: join(repoRoot, 'package-lock.json'),
      memorySize: 512,
    }
    const databaseEnvironment = (role: string) => ({
      DSQL_ENDPOINT: cluster.attrEndpoint,
      DSQL_DB_ROLE: role,
      // The bundle is minified, so a stack trace is unreadable without its map. Node reads the map
      // only when a stack is formatted.
      NODE_OPTIONS: '--enable-source-maps',
    })
    const mayConnect = (role: string) =>
      new PolicyStatement({ actions: [connectAction(role)], resources: [cluster.attrResourceArn] })

    // `handlers.ts` exports both `handler` and `mcpHandler`, so each function bundles both surfaces.
    // That is deliberate: one wiring module, ruled to be the only place the product meets its
    // database, and a few hundred kilobytes of unused surface.
    const httpFunction = new NodejsFunction(this, 'HttpFunction', {
      ...common,
      entry: apiEntry,
      handler: 'handler',
      timeout: API_TIMEOUT,
      bundling: BUNDLING,
      logGroup: logGroup('HttpFunction'),
      environment: databaseEnvironment(API_DB_ROLE),
    })
    const mcpFunction = new NodejsFunction(this, 'McpFunction', {
      ...common,
      entry: apiEntry,
      handler: 'mcpHandler',
      timeout: API_TIMEOUT,
      bundling: BUNDLING,
      logGroup: logGroup('McpFunction'),
      environment: databaseEnvironment(API_DB_ROLE),
    })
    httpFunction.addToRolePolicy(mayConnect(API_DB_ROLE))
    mcpFunction.addToRolePolicy(mayConnect(API_DB_ROLE))

    // The migration runner. Its own entry, and the migration files copied in beside it. It runs as
    // `admin` because it creates tables.
    const migrationFunction = new NodejsFunction(this, 'MigrationFunction', {
      ...common,
      memorySize: 256,
      entry: join(repoRoot, 'api/src/migrate-handler.ts'),
      handler: 'handler',
      // Long enough for an index build on a table that is nearly empty, with room. The runner
      // answers CloudFormation 10 s before this ends.
      timeout: Duration.minutes(5),
      bundling: {
        ...BUNDLING,
        commandHooks: {
          beforeBundling: () => [],
          beforeInstall: () => [],
          afterBundling: (_inputDir: string, outputDir: string) => [
            `mkdir -p "${outputDir}/migrations"`,
            `cp "${migrationsDir}"/*.sql "${outputDir}/migrations/"`,
          ],
        },
      },
      logGroup: logGroup('MigrationFunction'),
      environment: databaseEnvironment('admin'),
    })
    migrationFunction.addToRolePolicy(mayConnect('admin'))

    // ---- the migration custom resource ----------------------------------------------------------
    // The function answers CloudFormation itself, so there is no framework function between them.
    const migrations = new CustomResource(this, 'Migrations', {
      serviceToken: migrationFunction.functionArn,
      resourceType: 'Custom::Migrations',
      properties: { MigrationsDigest: digestOf(migrationsDir) },
    })
    migrations.node.addDependency(cluster)
    // A bad migration fails the deployment before new API code goes live against the old schema.
    httpFunction.node.addDependency(migrations)
    mcpFunction.node.addDependency(migrations)

    // ---- the HTTP API ---------------------------------------------------------------------------
    // The `$default` stage, which HttpApi creates and which is asserted in the tests. The router
    // matches on `event.rawPath`, and API Gateway prefixes that with the stage name on every stage
    // but `$default`: a named stage would make the router answer not_found to everything, with
    // nothing in the application to say why.
    const api = new HttpApi(this, 'Api', { apiName: 'ai-lift-coach' })
    api.addRoutes({
      path: '/api/{proxy+}',
      methods: [HttpMethod.ANY],
      integration: new HttpLambdaIntegration('HttpIntegration', httpFunction),
    })
    api.addRoutes({
      path: '/mcp',
      methods: [HttpMethod.ANY],
      integration: new HttpLambdaIntegration('McpIntegration', mcpFunction),
    })

    // ---- the CDN --------------------------------------------------------------------------------
    // ADR 0005: `/api` must never be cached, and that is a confidentiality requirement. A cached
    // authenticated GET served to an unauthenticated requester would hand over the Lifter's data
    // inside the CDN, before any application code runs. So: CachingDisabled, and credentials reach
    // the origin through an origin-request policy and never through the cache key.
    //
    // CloudFront refuses `Authorization` in an origin request policy's allow list (CDK refuses it
    // before CloudFront is asked), so the policy forwards every viewer header except `Host`. `Host`
    // is excluded because API Gateway routes on its own host name. Authorization is therefore
    // forwarded, and nothing names it.
    //
    // Not proven by synthesis: that the header arrives. ShredPace's CDN drops it on GET (ADR 0005),
    // and change 9017 asserts after deploying that it survived.
    const originRequestPolicy = new OriginRequestPolicy(this, 'ApiOriginRequestPolicy', {
      comment: 'Viewer headers, including the credential, to the API. Never part of a cache key.',
      headerBehavior: OriginRequestHeaderBehavior.denyList('Host'),
      queryStringBehavior: OriginRequestQueryStringBehavior.all(),
      cookieBehavior: OriginRequestCookieBehavior.none(),
    })
    const apiOrigin = new HttpOrigin(Fn.select(2, Fn.split('/', api.apiEndpoint)), {
      protocolPolicy: OriginProtocolPolicy.HTTPS_ONLY,
    })
    // Every behaviour is uncached, the default one too, because this stack has no static origin yet:
    // the dashboard arrives with change 0142, and its behaviour is the first that may cache.
    const uncached = {
      origin: apiOrigin,
      allowedMethods: AllowedMethods.ALLOW_ALL,
      cachePolicy: CachePolicy.CACHING_DISABLED,
      originRequestPolicy,
      // Never HTTP: a credential sent in the clear is the thing this refuses.
      viewerProtocolPolicy: ViewerProtocolPolicy.HTTPS_ONLY,
    }
    const distribution = new Distribution(this, 'Distribution', {
      comment: 'AI Lift Coach',
      priceClass: PriceClass.PRICE_CLASS_100,
      defaultBehavior: uncached,
      additionalBehaviors: { '/api/*': uncached, '/mcp': uncached },
    })

    new CfnOutput(this, 'DistributionDomainName', { value: distribution.distributionDomainName })
    new CfnOutput(this, 'ClusterEndpoint', { value: cluster.attrEndpoint })
  }
}
