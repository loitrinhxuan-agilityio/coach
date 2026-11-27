import { execFileSync } from 'node:child_process'
import { cpSync, mkdtempSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { App } from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { API_DB_ROLE, connectAction, digestOf, REGION, SpineStack } from '../lib/spine-stack.js'

// These assertions read the synthesized template, so each one proves what the template says and
// nothing about whether AWS does what it says. What they cannot reach is named at the foot of the
// file. Nothing here deploys.

const repoRoot = resolve(fileURLToPath(import.meta.url), '../../..')
const migrationsDir = join(repoRoot, 'api/migrations')

// A parsed CloudFormation template is untyped JSON, and these tests walk it by shape.
// biome-ignore lint/suspicious/noExplicitAny: that is the point of the helper
type Json = Record<string, any>

function synth(dir?: string) {
  const outdir = mkdtempSync(join(tmpdir(), 'spine-synth-'))
  const app = new App({ outdir })
  const stack = new SpineStack(app, 'Spine', dir ? { migrationsDir: dir } : {})
  const template = Template.fromStack(stack)
  return { outdir, stack, template, json: template.toJSON() as Json }
}

const { outdir, stack, template, json } = synth()
const resources = json.Resources as Record<string, Json>
const ofType = (type: string): [string, Json][] =>
  Object.entries(resources).filter(([, resource]) => resource.Type === type)

const functionNamed = (prefix: string): [string, Json] => {
  const found = ofType('AWS::Lambda::Function').filter(([id]) => id.startsWith(prefix))
  expect(found, `exactly one function is named ${prefix}`).toHaveLength(1)
  return found[0] as [string, Json]
}
const logicalIdOf = (value: Json): string => (value.Ref ?? value['Fn::GetAtt']?.[0]) as string

// The directory CloudFormation would be given for a function: the template names a file by hash,
// and the asset manifest, which is what the deployer reads, says where that file is.
function assetDirectory(outputDir: string, fn: Json): string {
  const stackName = readdirSync(outputDir).find((file) => file.endsWith('.assets.json')) as string
  const manifest = JSON.parse(readFileSync(join(outputDir, stackName), 'utf8'))
  const hash = String(fn.Properties.Code.S3Key).replace(/\.zip$/, '')
  const entry = manifest.files[hash]
  expect(entry, `the asset manifest lists ${hash}`).toBeDefined()
  return join(outputDir, entry.source.path)
}

const totalBytes = (directory: string): number =>
  readdirSync(directory, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .reduce((sum, entry) => sum + statSync(join(entry.parentPath, entry.name)).size, 0)

describe('the region and the stack', () => {
  test(`is in ${REGION}, and the stack cannot be given another`, () => {
    expect(REGION).toBe('ap-southeast-1')
    expect(stack.region).toBe('ap-southeast-1')
  })

  test('the entry point builds the stack, in that region', () => {
    // The template tests above cannot see bin/app.ts: a bin that built nothing would pass them all.
    const out = mkdtempSync(join(tmpdir(), 'spine-bin-'))
    execFileSync(join(repoRoot, 'node_modules/.bin/tsx'), [join(repoRoot, 'infra/bin/app.ts')], {
      cwd: out,
      env: { PATH: process.env.PATH, CDK_OUTDIR: out },
      stdio: 'pipe',
      timeout: 120_000,
    })
    const manifest = JSON.parse(readFileSync(join(out, 'manifest.json'), 'utf8'))
    const stacks = Object.values(manifest.artifacts as Record<string, Json>).filter(
      (artifact) => artifact.type === 'aws:cloudformation:stack',
    )
    expect(stacks).toHaveLength(1)
    expect(stacks[0]?.environment).toBe('aws://unknown-account/ap-southeast-1')
  }, 130_000)

  test('is protected against deletion, and so is the database', () => {
    expect(stack.terminationProtection).toBe(true)
    template.hasResource('AWS::DSQL::Cluster', {
      Properties: { DeletionProtectionEnabled: true },
      DeletionPolicy: 'Retain',
      UpdateReplacePolicy: 'Retain',
    })
  })
})

describe('the Lambdas', () => {
  test('there are exactly three, and every one is arm64 on nodejs22.x', () => {
    const all = ofType('AWS::Lambda::Function')
    // Three and no more: a function the CDK adds for itself (a log-retention or custom-resource
    // helper) would default to x86_64 and its own never-expiring log group.
    expect(all).toHaveLength(3)
    for (const [id, fn] of all) {
      expect(fn.Properties.Architectures, id).toEqual(['arm64'])
      expect(fn.Properties.Runtime, id).toBe('nodejs22.x')
    }
  })

  test('none is in a VPC, and nothing in the stack is a network resource', () => {
    for (const [id, fn] of ofType('AWS::Lambda::Function')) {
      expect(fn.Properties.VpcConfig, id).toBeUndefined()
    }
    expect(Object.values(resources).filter((r) => r.Type.startsWith('AWS::EC2::'))).toEqual([])
  })

  test('the HTTP and MCP functions run the two handlers handlers.ts exports', () => {
    expect(functionNamed('HttpFunction')[1].Properties.Handler).toBe('index.handler')
    expect(functionNamed('McpFunction')[1].Properties.Handler).toBe('index.mcpHandler')
    expect(functionNamed('MigrationFunction')[1].Properties.Handler).toBe('index.handler')
  })

  test('the timeout is under the gateway ceiling of 30 s, so a Lambda timeout is the one reported', () => {
    for (const name of ['HttpFunction', 'McpFunction']) {
      const timeout = functionNamed(name)[1].Properties.Timeout
      expect(timeout).toBeLessThan(30)
      expect(timeout).toBeGreaterThanOrEqual(25) // connection.ts's worst case is 25 s
    }
  })
})

describe('log groups', () => {
  test('every log group sets a 14-day retention', () => {
    const groups = ofType('AWS::Logs::LogGroup')
    expect(groups).toHaveLength(3)
    for (const [id, group] of groups) expect(group.Properties.RetentionInDays, id).toBe(14)
  })

  test('every function writes to one of them, so none falls back to the default group', () => {
    // The retention test above sees only the groups the stack declares. A function with no group of
    // its own gets one from Lambda with no expiry at all, and no template assertion on groups would
    // show it. So each function must name a declared group, and no two may share one.
    const groupIds = ofType('AWS::Logs::LogGroup').map(([id]) => id)
    const used = ofType('AWS::Lambda::Function').map(([id, fn]) => {
      const group = fn.Properties.LoggingConfig?.LogGroup
      expect(group, `${id} names a log group`).toBeDefined()
      return logicalIdOf(group)
    })
    expect([...used].sort()).toEqual([...groupIds].sort())
  })

  test('the API has no access log of its own to leave unbounded', () => {
    for (const [, stage] of ofType('AWS::ApiGatewayV2::Stage')) {
      expect(stage.Properties.AccessLogSettings).toBeUndefined()
    }
  })
})

describe('the HTTP API', () => {
  test('is deployed on the $default stage, and only that stage', () => {
    // The router matches on event.rawPath. API Gateway prefixes it with the stage name on any stage
    // but $default, so a named stage makes the router answer not_found to everything.
    const stages = ofType('AWS::ApiGatewayV2::Stage')
    expect(stages).toHaveLength(1)
    expect(stages[0]?.[1].Properties.StageName).toBe('$default')
    expect(stages[0]?.[1].Properties.AutoDeploy).toBe(true)
    const [apiId] = ofType('AWS::ApiGatewayV2::Api')[0] as [string, Json]
    expect(logicalIdOf(stages[0]?.[1].Properties.ApiId)).toBe(apiId)
  })

  test('routes /api/* to the HTTP function and /mcp to the MCP function, and nothing else', () => {
    const routes = ofType('AWS::ApiGatewayV2::Route')
    expect(routes.map(([, r]) => r.Properties.RouteKey).sort()).toEqual([
      'ANY /api/{proxy+}',
      'ANY /mcp',
    ])
    const target = (routeKey: string): string => {
      const route = routes.find(([, r]) => r.Properties.RouteKey === routeKey)?.[1] as Json
      // "integrations/<id>" is a Fn::Join over a Ref to the integration.
      const integrationId = logicalIdOf(route.Properties.Target['Fn::Join'][1][1])
      const integration = resources[integrationId] as Json
      expect(integration.Properties.PayloadFormatVersion).toBe('2.0')
      return logicalIdOf(integration.Properties.IntegrationUri)
    }
    expect(target('ANY /api/{proxy+}')).toBe(functionNamed('HttpFunction')[0])
    expect(target('ANY /mcp')).toBe(functionNamed('McpFunction')[0])
  })

  test('each function lets API Gateway invoke it', () => {
    const permissions = ofType('AWS::Lambda::Permission').map(([, p]) => p.Properties)
    for (const name of ['HttpFunction', 'McpFunction']) {
      const [id] = functionNamed(name)
      const granted = permissions.filter((p) => logicalIdOf(p.FunctionName) === id)
      expect(granted, name).toHaveLength(1)
      expect(granted[0]?.Principal).toBe('apigateway.amazonaws.com')
    }
  })
})

describe('the distribution', () => {
  const [, distribution] = ofType('AWS::CloudFront::Distribution')[0] as [string, Json]
  const config = distribution.Properties.DistributionConfig as Json
  const behaviours: [string, Json][] = [
    ['default', config.DefaultCacheBehavior],
    ...(config.CacheBehaviors as Json[]).map((b): [string, Json] => [b.PathPattern, b]),
  ]
  const CACHING_DISABLED = '4135ea2d-6df8-44a3-9df3-4b5a84be39ad'

  test('serves /api/* and /mcp as behaviours of their own', () => {
    expect(behaviours.map(([path]) => path).sort()).toEqual(['/api/*', '/mcp', 'default'])
  })

  test('the /api and /mcp behaviours use CachingDisabled, and so does every other', () => {
    // A cached authenticated GET served to an unauthenticated requester leaks the Lifter's data in
    // the CDN, before any application code runs (ADR 0005). The default behaviour is held to the same
    // rule: until the dashboard's origin exists (0142) there is nothing a CDN may cache.
    for (const [path, behaviour] of behaviours) {
      expect(behaviour.CachePolicyId, path).toBe(CACHING_DISABLED)
    }
  })

  test('there is no cache policy of our own, so no credential can be in a cache key', () => {
    expect(ofType('AWS::CloudFront::CachePolicy')).toEqual([])
  })

  test('an origin-request policy forwards the Authorization header, and no cache key sees it', () => {
    const policies = ofType('AWS::CloudFront::OriginRequestPolicy')
    expect(policies).toHaveLength(1)
    const [policyId, policy] = policies[0] as [string, Json]
    const headers = policy.Properties.OriginRequestPolicyConfig.HeadersConfig as Json
    // CloudFront will not take Authorization in an allow list, so the policy forwards every viewer
    // header except the ones it names, and Authorization is forwarded because nothing names it.
    // Host is the one that must not reach API Gateway: it routes on its own host name.
    expect(headers.HeaderBehavior).toBe('allExcept')
    const named = ((headers.Headers ?? []) as string[]).map((h) => h.toLowerCase())
    expect(named).toEqual(['host'])
    // And it is the policy on every behaviour.
    for (const [path, behaviour] of behaviours) {
      expect(behaviour.OriginRequestPolicyId, path).toEqual({ Ref: policyId })
    }
  })

  test('only HTTPS reaches it, so a credential is never sent in the clear', () => {
    for (const [path, behaviour] of behaviours) {
      expect(behaviour.ViewerProtocolPolicy, path).toBe('https-only')
    }
  })

  test('every method reaches the API, so a 405 comes from the application and not the CDN', () => {
    for (const [path, behaviour] of behaviours) {
      expect(behaviour.AllowedMethods, path).toContain('DELETE')
      expect(behaviour.AllowedMethods, path).toContain('POST')
    }
  })

  test('the origin is the HTTP API itself, with no path added', () => {
    // An origin path would be prefixed to rawPath, and the router would not find its routes.
    const [apiId] = ofType('AWS::ApiGatewayV2::Api')[0] as [string, Json]
    const origins = config.Origins as Json[]
    expect(origins).toHaveLength(1)
    expect(origins[0]?.OriginPath).toBeUndefined()
    expect(JSON.stringify(origins[0]?.DomainName)).toContain(apiId)
    expect(origins[0]?.CustomOriginConfig.OriginProtocolPolicy).toBe('https-only')
    for (const [path, behaviour] of behaviours) {
      expect(behaviour.TargetOriginId, path).toBe(origins[0]?.Id)
    }
  })
})

describe('the database settings', () => {
  const clusterId = ofType('AWS::DSQL::Cluster')[0]?.[0] as string
  const statementsOf = (name: string): Json[] => {
    const role = (functionNamed(name)[1].Properties.Role['Fn::GetAtt'] as string[])[0] as string
    return ofType('AWS::IAM::Policy')
      .filter(([, p]) => (p.Properties.Roles as Json[]).some((r) => r.Ref === role))
      .flatMap(([, p]) => p.Properties.PolicyDocument.Statement as Json[])
  }

  test.each(['HttpFunction', 'McpFunction'])(
    '%s is told where the database is and which role to use, and nothing else',
    (name) => {
      const environment = functionNamed(name)[1].Properties.Environment.Variables as Json
      // DSQL_DB_ROLE has no default in the Lambda: it fails to start without it (R14), so the stack
      // has to say. AWS_REGION is set by Lambda itself.
      expect(Object.keys(environment).sort()).toEqual(['DSQL_DB_ROLE', 'DSQL_ENDPOINT'])
      expect(environment.DSQL_DB_ROLE).toBe(API_DB_ROLE)
      expect(environment.DSQL_DB_ROLE).toMatch(/\S/)
      expect(environment.DSQL_ENDPOINT).toEqual({ 'Fn::GetAtt': [clusterId, 'Endpoint'] })
    },
  )

  test.each(['HttpFunction', 'McpFunction'])(
    '%s may mint the auth token for exactly the role it connects as',
    (name) => {
      // connection.ts mints the admin token for `admin` and the ordinary one for any other role. If
      // the IAM action does not match, every connection is refused and nothing in the template says.
      const statements = statementsOf(name)
      expect(statements).toHaveLength(1)
      expect(statements[0]).toEqual({
        Action: connectAction(API_DB_ROLE),
        Effect: 'Allow',
        Resource: { 'Fn::GetAtt': [clusterId, 'ResourceArn'] },
      })
    },
  )

  test('the migration runner connects as admin, to this cluster only', () => {
    const environment = functionNamed('MigrationFunction')[1].Properties.Environment.Variables
    expect(environment.DSQL_DB_ROLE).toBe('admin')
    expect(environment.DSQL_ENDPOINT).toEqual({ 'Fn::GetAtt': [clusterId, 'Endpoint'] })
    expect(statementsOf('MigrationFunction')).toEqual([
      {
        Action: 'dsql:DbConnectAdmin',
        Effect: 'Allow',
        Resource: { 'Fn::GetAtt': [clusterId, 'ResourceArn'] },
      },
    ])
  })

  test('connectAction pairs admin with the admin action and any other role with the ordinary one', () => {
    expect(connectAction('admin')).toBe('dsql:DbConnectAdmin')
    expect(connectAction('app')).toBe('dsql:DbConnect')
  })
})

describe('the migration custom resource', () => {
  const [migrationsId, migrations] = ofType('Custom::Migrations')[0] as [string, Json]

  test('is served by the runner itself, with no framework function between them', () => {
    expect(logicalIdOf(migrations.Properties.ServiceToken)).toBe(
      functionNamed('MigrationFunction')[0],
    )
  })

  test('runs after the cluster exists, and before new API code goes live', () => {
    const clusterId = ofType('AWS::DSQL::Cluster')[0]?.[0] as string
    expect(migrations.DependsOn).toContain(clusterId)
    for (const name of ['HttpFunction', 'McpFunction']) {
      expect(functionNamed(name)[1].DependsOn, name).toContain(migrationsId)
    }
  })

  test('carries a digest of the migration files, and the digest moves when a file is added', () => {
    expect(migrations.Properties.MigrationsDigest).toBe(digestOf(migrationsDir))
    expect(migrations.Properties.MigrationsDigest).toMatch(/^[0-9a-f]{64}$/)

    const extra = mkdtempSync(join(tmpdir(), 'migrations-'))
    cpSync(migrationsDir, extra, { recursive: true })
    writeFileSync(
      join(extra, '0002_next.sql'),
      'CREATE TABLE IF NOT EXISTS later (id uuid PRIMARY KEY);',
    )
    const next = synth(extra)
    const [, custom] = Object.entries(next.json.Resources as Record<string, Json>).find(
      ([, r]) => r.Type === 'Custom::Migrations',
    ) as [string, Json]
    expect(custom.Properties.MigrationsDigest).not.toBe(migrations.Properties.MigrationsDigest)
  }, 60_000)

  test('the digest reads names and contents, in order', () => {
    const a = mkdtempSync(join(tmpdir(), 'digest-a-'))
    writeFileSync(join(a, '0001_x.sql'), 'SELECT 1;')
    const same = digestOf(a)
    writeFileSync(join(a, '0001_x.sql'), 'SELECT 2;')
    expect(digestOf(a)).not.toBe(same)
    const b = mkdtempSync(join(tmpdir(), 'digest-b-'))
    writeFileSync(join(b, '0001_y.sql'), 'SELECT 2;')
    expect(digestOf(b)).not.toBe(digestOf(a))
    writeFileSync(join(b, 'notes.txt'), 'ignored')
    expect(digestOf(b)).toBe(digestOf(b))
  })
})

describe('no stored secret', () => {
  // An allow list, not a deny list: a resource type nobody has thought about is refused until
  // someone adds it here on purpose. Nothing below can hold a secret or a long-lived credential.
  const ALLOWED = new Set([
    'AWS::DSQL::Cluster',
    'AWS::Logs::LogGroup',
    'AWS::IAM::Role',
    'AWS::IAM::Policy',
    'AWS::Lambda::Function',
    'AWS::Lambda::Permission',
    'Custom::Migrations',
    'AWS::ApiGatewayV2::Api',
    'AWS::ApiGatewayV2::Stage',
    'AWS::ApiGatewayV2::Integration',
    'AWS::ApiGatewayV2::Route',
    'AWS::CloudFront::OriginRequestPolicy',
    'AWS::CloudFront::Distribution',
    'AWS::CDK::Metadata',
  ])

  test('every resource is of a type that cannot hold a secret', () => {
    const types = new Set(Object.values(resources).map((r) => r.Type))
    expect([...types].filter((type) => !ALLOWED.has(type))).toEqual([])
  })

  test('nothing is resolved from a secret store or a parameter at deploy time', () => {
    const text = JSON.stringify(json)
    expect(text).not.toContain('{{resolve:')
    // The CDK's own bootstrap-version lookup is the one parameter, and it is a plain String read
    // from the bootstrap stack, not a SecureString.
    expect(Object.keys(json.Parameters ?? {})).toEqual(['BootstrapVersion'])
    expect(json.Parameters.BootstrapVersion.Type).toBe('AWS::SSM::Parameter::Value<String>')
  })

  test('the only environment variables are the two that name the database', () => {
    for (const [id, fn] of ofType('AWS::Lambda::Function')) {
      const names = Object.keys(fn.Properties.Environment?.Variables ?? {}).sort()
      expect(names, id).toEqual(['DSQL_DB_ROLE', 'DSQL_ENDPOINT'])
    }
  })

  test('the roles are assumed by Lambda only, and attach nothing but basic execution', () => {
    for (const [id, role] of ofType('AWS::IAM::Role')) {
      const principals = (role.Properties.AssumeRolePolicyDocument.Statement as Json[]).map(
        (s) => s.Principal,
      )
      expect(principals, id).toEqual([{ Service: 'lambda.amazonaws.com' }])
      const managed = JSON.stringify(role.Properties.ManagedPolicyArns)
      expect(managed, id).toContain('AWSLambdaBasicExecutionRole')
    }
  })
})

describe('the bundle budget (R17)', () => {
  const BUDGET_BYTES = 1_000_000

  for (const name of ['HttpFunction', 'McpFunction']) {
    describe(name, () => {
      const directory = assetDirectory(outdir, functionNamed(name)[1])
      const bundle = readFileSync(join(directory, 'index.js'), 'utf8')

      test('what would be deployed is under 1 MB', () => {
        // Measured on the asset directory the deployer uploads, minified, and not on a rebuild of
        // our own: this is the output the stack's esbuild configuration made. Unminified it is about
        // 1.28 MB, so the minify option is what keeps it under.
        const bytes = totalBytes(directory)
        expect(bytes).toBeLessThan(BUDGET_BYTES)
      })

      test('and it is the real thing, so that "under 1 MB" is not met by an empty bundle', () => {
        expect(totalBytes(directory)).toBeGreaterThan(200_000)
        expect(bundle).toContain('DSQL_DB_ROLE')
        expect(bundle).toContain('mcpHandler')
        expect(readdirSync(directory)).toEqual(['index.js'])
      })

      test('is minified: a line is not one statement', () => {
        // The budget catches a bundle that grows past 1 MB; this catches the option being dropped
        // while the bundle still happens to fit.
        const lines = bundle.split('\n').length
        expect(bundle.length / lines).toBeGreaterThan(200)
      })

      test('bundles the SigV4 signer and leaves only pg-native external', () => {
        // Naming externalModules replaces CDK's default of leaving @aws-sdk/* to the runtime, and
        // @aws-sdk/dsql-signer is not known to be in the Node 22 runtime. (The signer's own
        // optional "signature-v4-crt" appears in the bundle only inside an error message.)
        expect(bundle).toContain('getDbConnectAdminAuthToken')
        expect(bundle).not.toMatch(/require\(["']@aws-sdk\/dsql-signer["']\)/)
        expect(bundle).not.toMatch(/require\(["']@aws-sdk\/(client|credential|util)[a-z-]*["']\)/)
        expect(bundle).toMatch(/require\(["']pg-native["']\)/)
      })

      test('loads under node, exports both handlers, and fails at load naming DSQL_DB_ROLE without it', () => {
        // The deployed file itself, run: the CommonJS output holds `pg` without a require shim, and
        // pg-native being absent does not stop it.
        const run = (env: Record<string, string>) =>
          execFileSync(
            process.execPath,
            [
              '-e',
              `(async () => {
                 const m = require(process.argv[1])
                 const event = (rawPath) => ({ rawPath, headers: {}, requestContext: { requestId: 'fake-id', http: { method: 'GET' } } })
                 const out = { exports: Object.keys(m).sort() }
                 out.unprefixed = (await m.handler(event('/api/account'))).statusCode
                 out.stagePrefixed = (await m.handler(event('/prod/api/account'))).statusCode
                 console.log('RESULT ' + JSON.stringify(out))
               })()`,
              join(directory, 'index.js'),
            ],
            { env: { PATH: process.env.PATH, ...env }, encoding: 'utf8', stdio: 'pipe' },
          )
        const result = JSON.parse(
          run({
            DSQL_ENDPOINT: 'fake-cluster.dsql.invalid',
            AWS_REGION: 'fake-region-1',
            DSQL_DB_ROLE: 'fake-role',
          })
            .split('\n')
            .find((line) => line.startsWith('RESULT '))
            ?.slice('RESULT '.length) ?? '{}',
        )
        expect(result.exports).toEqual(['handler', 'mcpHandler'])
        // The route is found on /api/account, and not once a stage name is put in front of it:
        // which is why the stack deploys on $default.
        expect(result.unprefixed).toBe(401)
        expect(result.stagePrefixed).toBe(404)

        expect(() =>
          run({ DSQL_ENDPOINT: 'fake-cluster.dsql.invalid', AWS_REGION: 'fake-region-1' }),
        ).toThrow(/DSQL_DB_ROLE is not set/)
      })
    })
  }

  test('the migration runner carries the migration files, and the API functions do not', () => {
    const runner = assetDirectory(outdir, functionNamed('MigrationFunction')[1])
    const source = readFileSync(join(migrationsDir, '0001_init.sql'), 'utf8')
    expect(readFileSync(join(runner, 'migrations/0001_init.sql'), 'utf8')).toBe(source)
    expect(readdirSync(join(runner, 'migrations')).sort()).toEqual(
      readdirSync(migrationsDir).filter((file) => file.endsWith('.sql')),
    )
    for (const name of ['HttpFunction', 'McpFunction']) {
      const api = assetDirectory(outdir, functionNamed(name)[1])
      expect(readdirSync(api)).not.toContain('migrations')
    }
  })

  test('the migration runner loads under node and exports its handler', () => {
    const runner = assetDirectory(outdir, functionNamed('MigrationFunction')[1])
    const out = execFileSync(
      process.execPath,
      ['-e', 'console.log(typeof require(process.argv[1]).handler)', join(runner, 'index.js')],
      { env: { PATH: process.env.PATH }, encoding: 'utf8', stdio: 'pipe' },
    )
    expect(out.trim()).toBe('function')
  })
})

// WHAT THESE TESTS CANNOT REACH, so that a green run is not mistaken for a working stack:
//   - That CloudFront forwards Authorization to API Gateway. The template says the policy does; only
//     a deployed request shows the header arriving. Change 9017 asserts it.
//   - That the migration runs against Aurora DSQL: that `sys.wait_for_job` is spelt as the runner
//     spells it, that CREATE INDEX ASYNC returns a `job_id`, that pg_index is readable.
//   - That IAM lets the Lambdas connect: the policy is asserted to match the role the code asks for,
//     not that DSQL accepts the role or that `admin` is what the Owner wants the API to hold.
//   - That a 512 MB arm64 Lambda cold-starts in a time anyone will accept. The 1 MB budget is a
//     starting line (R17) that 9017 reviews against the measured cold start.
//   - That the template deploys at all. CloudFormation's own validation and the account's quotas
//     are not consulted by synthesis.
