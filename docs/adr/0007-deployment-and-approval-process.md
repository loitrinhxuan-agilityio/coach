---
status: proposed
---

# The deployment and approval process: OIDC instead of a stored key, one environment gate, and a diff that cannot quietly destroy data

This is the last architecture document item 1 of
[`development-preparation.md`](../agents/development-preparation.md) named and nobody wrote. It
describes how a change in this repository becomes a change in AWS, and how D-016's requirement — the
Owner approves *that specific change, shown as the infrastructure diff, never a blanket approval* —
is enforced by something other than good intentions.

**It decides seven things and deliberately leaves six to the Owner.** The six are listed under
*What the Owner still has to decide*. **Two of them are already on record as open** — the deploy
cadence (D-016, "not decided") and whether a staging environment exists (`mvp-scope.md`'s "Not decided
here" list). **The other four are raised for the first time by this document**, including who runs
`cdk bootstrap` and which GitHub identity the Dev Lead acts under, neither of which anything in the
decision log or the scope documents had thought to ask.
Writing this document approves nothing (D-022).

**One finding reorders the whole problem, so it is stated first.** D-016 exists partly because "an
infrastructure change can replace a stateful resource and lose data." For this stack that threat is
almost absent and a different one has taken its place. `AWS::DSQL::Cluster` has **five properties and
every one of them is `Update requires: No interruption`** (CloudFormation template reference, read
2026-11-26). There is no property you can change that makes CloudFormation replace the cluster. The
ways to lose the database are renaming its logical ID, removing it from the template, deleting the
stack — and **running a schema migration**, which `cdk diff` never sees at all. A gate built only
around the infrastructure diff would therefore guard the safe half of the problem. This document
says so rather than letting the Owner infer that an approved diff means an approved change.

## The shape of a deploy

One pipeline, two jobs, one approval between them.

```
merge to main
   │
   ├─ job "plan"      no environment.  Assumes the plan role by OIDC.
   │                  cdk deploy --method=prepare-change-set --change-set-name <run>
   │                  publishes assets, creates the change set, deploys nothing
   │                  destructive-change gate reads describe-change-set, can fail the job
   │                  posts the diff; uploads cdk.out as the run's artifact
   │
   └─ job "deploy"    environment: production.  WAITS for the Owner.
                      Assumes the deploy role by OIDC.
                      aws cloudformation execute-change-set  — the change set
                      the Owner saw, by ARN.  No second synthesis, no cdk deploy.
```

One `concurrency` group covers the whole workflow, so only one plan-and-deploy run is ever in flight.

**The change set has to be a lasting one, which rules out the obvious way of producing it.** An
earlier draft had the plan job run `cdk diff --method=change-set` and the deploy job execute that
change set. It cannot: the CDK treats a diff change set as scratch. In `aws/aws-cdk-cli`,
`createDiffChangeSet` calls `createChangeSetAndCleanup`, which names the change set
`cdk-diff-change-set-<uuid>` and, in a cleanup block that runs "whether or not creation succeeded",
calls `cleanupOldChangeset` on it — and, when the stack did not exist before, `deleteStack` on the
`REVIEW_IN_PROGRESS` shell the `CREATE` change set left behind (source read 2026-11-26). The CLI's own
message calls it "a read-only change set". So the object the Owner was meant to approve would be gone
before they saw it, **and the first run would have failed anyway**, because section 1 denies the plan
role `DeleteStack`.

The CDK has a first-class flow for this, and its documentation names the use case: `cdk deploy`'s
`--method=prepare-change-set` — "Create change set but don't perform deployment. This is useful if you
have external tools that will inspect the change set **or if you have an approval process for change
sets**" — with `execute-change-set` as its counterpart. The plan job uses the first; the deploy job
calls `ExecuteChangeSet` through the AWS API rather than the CDK's counterpart, so that it needs
neither the CDK nor a bootstrap role. `prepare-change-set` creates no `cdk diff` scratch change set,
so nothing is cleaned up and nothing needs `DeleteStack`.

**The gate reads the change set, not a diff.** Layer 1 and the Owner both work from
`describe-change-set` on the prepared change set, which carries real `Replacement` values. That
removes a problem the earlier draft had to argue around: `cdk diff --method=template` reports that
"Any change detected to properties that require resource replacement is displayed as a resource
replacement, even if the change is purely cosmetic", and `--method=auto` silently falls back to it, so
a diff-based gate could show phantom replacements or quietly change how it computed its answer. A
prepared change set has one answer and it is CloudFormation's.

**One consequence of `CREATE` to know before the first deploy.** A prepared change set for a stack
that does not yet exist leaves that stack in `REVIEW_IN_PROGRESS` until the change set is executed or
deleted, and the CDK's own source notes that a leftover one "blocks subsequent change set creation".
If the Owner rejects the very first deploy, clearing the shell needs `DeleteStack`, which the plan
role does not have — so that one cleanup falls to whoever holds the bootstrap credential in section 6.
It is a first-deploy-only wrinkle, and it is better known than discovered.

**`--require-approval` cannot be the gate, which is why the deploy step is not a `cdk deploy` at all.**
The CDK's own option takes `any-change`, `broadening` or `never` and prompts at a terminal. In a GitHub
Actions job there is no terminal to prompt, so it could only ever be `never`, and the approval has to
come from somewhere else. That "somewhere else" is section 2 — and section 2 ends up executing the
change set directly, so the option never appears in the workflow.

## 1. Credentials: OIDC, and what the trust policy must pin

D-016 forbids a long-lived deploy credential in the repository or on a laptop. GitHub's OpenID
Connect provider removes the need for one: the workflow asks GitHub for a short-lived JWT and trades
it for AWS credentials through `sts:AssumeRoleWithWebIdentity`.

- **Provider URL** `https://token.actions.githubusercontent.com`, **audience** `sts.amazonaws.com`
  "if you are using the official action" (`aws-actions/configure-aws-credentials`).
- The job needs `permissions: id-token: write`, which GitHub notes "does not give the workflow
  permission to modify or write to any resources."
- There is no secret in the repository, nothing to rotate, and nothing to leak in a log.

**The trust policy is the whole security boundary, and the `sub` claim is the only part of it that
distinguishes this repository's `main` from anybody else's anything.** GitHub's own prerequisite is
blunt: "To control how your cloud provider issues access tokens, you **must** define at least one
condition", and "IAM recommends that users evaluate the IAM condition key,
`token.actions.githubusercontent.com:sub`, in the trust policy of any role that trusts GitHub's OIDC
identity provider."

The `sub` GitHub issues depends on what the job is, which is what makes two roles clean rather than
fussy (documented subject formats, read 2026-11-26):

| What the job is | `sub` |
|---|---|
| references an environment | `repo:ORG-NAME/REPO-NAME:environment:ENVIRONMENT-NAME` |
| triggered by a pull request, no environment | `repo:ORG-NAME/REPO-NAME:pull_request` |
| a branch, no environment, not a pull request | `repo:ORG-NAME/REPO-NAME:ref:refs/heads/BRANCH-NAME` |

So:

- **`coach-gh-plan`** trusts exactly `repo:loitrinhxuan-agilityio/coach:ref:refs/heads/main` with
  `StringEquals`, and holds read access, the ability to create a change set, and the ability to
  publish an asset — and nothing else. The constraints below are what make "and nothing else" true,
  and the asset half of it carries its own hazard, treated separately.
- **`coach-gh-deploy`** trusts exactly
  `repo:loitrinhxuan-agilityio/coach:environment:production` with `StringEquals`, and is the only
  role from which anything can be executed.

Both pin `token.actions.githubusercontent.com:aud` to `sts.amazonaws.com` with `StringEquals` as
well, because a trust policy that checks only `sub` and not `aud` is weaker than it looks.

**The split is worthless unless the plan role is kept away from the CDK bootstrap deploy role, and
by default it is not.** There is no such thing as a read-only change set: creating one and executing
one are two permissions on the same role, and the CDK's bootstrap template puts them together. Read
from the bootstrap template on `aws/aws-cdk-cli@main` on 2026-11-26, `DeploymentActionRole`:

- its trust policy's principal is `AWS: Ref: AWS::AccountId` — **the account root**, so it delegates
  to identity policies and is assumable by any principal in the account that is allowed to;
- its `DeployPermissions` statement allows `cloudformation:CreateChangeSet`, `DeleteChangeSet`,
  **`ExecuteChangeSet`**, `CreateStack`, `UpdateStack`, `RollbackStack` and
  `ContinueUpdateRollback` on `Resource: "*"`;
- its `CliPermissions` statement adds **`cloudformation:DeleteStack`** and
  `UpdateTerminationProtection`, under a comment that says in as many words "Our CI/CD does not need
  DeleteStack, but we also want to use this role from the CLI, and there you can call `cdk destroy`";
- and it holds `iam:PassRole` on the CloudFormation execution role.

`cdk diff --method=change-set` "Uses the deploy role", and so does `cdk deploy` in any method, so a
plan job left on the default path assumes
exactly that role. Since `coach-gh-plan`'s subject is `ref:refs/heads/main` and names no environment,
**anything that can run a job on `main` — a step added to the plan job, a workflow merged later, a
`workflow_dispatch` — could assume it and execute or delete the stack without the Owner's approval
ever being asked for.** That is D-016 defeated by the default configuration of the tool, not by an
attacker.

**Three controls, the first two required because neither is sufficient alone.**

1. **An explicit `Deny` on `sts:AssumeRole`** in `coach-gh-plan`'s identity policy, for
   `arn:aws:iam::<account>:role/cdk-<qualifier>-deploy-role-*` and `...-cfn-exec-role-*`. An explicit
   deny beats every allow, which is what makes it hold against a bootstrap role that trusts the
   account root. On its own it does not work, because it also stops the plan job diffing at all.
2. **A change-set-only role for the plan job** — `cloudformation:CreateChangeSet`,
   `DescribeChangeSet`, `DescribeStacks`, `GetTemplate`, `DeleteChangeSet`, read on the staging
   bucket, and `iam:PassRole` on the CloudFormation execution role (creating a change set requires
   passing it), with an explicit `Deny` on `ExecuteChangeSet`, `CreateStack`, `UpdateStack`,
   `DeleteStack`, `RollbackStack`, `ContinueUpdateRollback` and `UpdateTerminationProtection`.
   Creating a change set changes no resource; executing one does, and the plan job cannot.
3. **A narrowed copy of the bootstrap `FilePublishingRole` for assets.** Section 2 has the deploy job
   only execute a change set, which means the Lambda bundle must already be in the staging bucket
   when the Owner is asked — so the plan job has to be able to write one, and an earlier draft of
   this ADR gave it read access only, which would have failed on the very first plan run with an
   asset. `DefaultStackSynthesizer` publishes file assets through the bootstrap
   `cdk-<qualifier>-file-publishing-role-*`, whose default policy allows `s3:PutObject*`,
   **`s3:DeleteObject*`**, `s3:Abort*`, Get and List on the staging bucket plus KMS encrypt and
   decrypt, and whose trust principal is again `AWS: Ref: AWS::AccountId` (bootstrap template, read
   2026-11-26). The plan job gets a copy **without `DeleteObject*`**: publishing an asset is not a
   licence to remove one.

The role the CDK assumes is a property of the stack's synthesizer (`DefaultStackSynthesizer`, which
the CDK guide documents as the configuration point), and the custom bootstrap template section 6
already contemplates is where the extra role is declared.

**A collision this created has since dissolved, and the reason is worth keeping.** A synthesized cloud
assembly records which role the CDK should assume, so while an earlier draft had the deploy job replay
the plan job's `cdk.out` with `cdk deploy`, one assembly could not have recorded two different roles.
Section 2 now has the deploy job call `ExecuteChangeSet` directly, so **the plan job is the only job
that runs the CDK CLI at all** and only its role is ever recorded. The deploy job needs no CDK
configuration and no bootstrap role — `cloudformation:ExecuteChangeSet` and `DescribeStacks` on the one
stack, plus read on the staging bucket for the asset check section 2 ends with. **What is still unread
on a documentation page is the synthesizer property that sets the role the plan job uses**; only
`DefaultStackSynthesizer`'s existence as the configuration point was verified, so whoever writes
`infra/` should confirm the property name rather than take it from here.

**Why a repo-wide trust policy is a hazard here specifically.** AWS's documentation shows a wildcard
form, `StringLike` on `repo:octo-org/octo-repo:*`, as the way to allow "any branch, pull request merge
branch, or environment" — and it does not label it unsafe, because for most repositories it is not.
**This repository is public.** Anyone can fork it and open a pull request, and a pull-request job
that references no environment presents `sub: repo:ORG/REPO:pull_request`, which `repo:ORG/REPO:*`
matches. A repo-wide trust policy would therefore hand an AWS role in the Owner's account to a
subject that any stranger can cause to exist. The role would be scoped, and "scoped read access to
the account holding the Owner's training data, obtainable by opening a pull request" is still the
wrong sentence to have written.

GitHub documents that secrets are not passed to a workflow triggered from a forked repository and
that `GITHUB_TOKEN` is read-only there. **It does not say, on the pages read on 2026-11-26, whether a
fork pull request can be granted `id-token: write`.** This ADR therefore does not rely on it: no role
trusts a `pull_request` subject at all, the plan job runs on `main` after merge rather than on the
pull request, and the pull request gets a `cdk synth` with no AWS credentials. The cost is real and
named — **the Owner sees the diff after the merge, not before it** — and section 2 explains why that
is the right way round under D-016 rather than a compromise.

The same documentation warns that `pull_request_target` and `workflow_run`, used with a checkout of
an untrusted pull request, "expose the repository to security compromises" and are "privileged,
which means they share the same cache of the main branch with other privileged workflow triggers, and
may have repository write access and access to referenced secrets." Neither trigger is used.

## 2. Showing the diff, and making the approved thing the deployed thing

A **GitHub Environment** named `production`, with the Owner as required reviewer, is the gate. What
it gives, in GitHub's words (read 2026-11-26):

- "A job that references an environment must follow any protection rules for the environment before
  running or accessing the environment's secrets." The job does not start; it sits and waits.
- "Enter up to 6 people or teams. Only one of the required reviewers needs to approve the job for it
  to proceed."
- "Optionally, to prevent users from approving workflows runs that they triggered, select **Prevent
  self-review**." On, but it is a backstop rather than the control, and it is sharp in both directions
  — see *Which identity merges* below.
- Deployment branches restricted to `main`.
- "Allow administrators to bypass configured protection rules" must be **deselected**.
- "To reject the job, click **Reject**. If a job is rejected, the workflow will fail."

**Which identity merges, because the gate deadlocks or does nothing depending on the answer.**
Prevent self-review blocks *whoever triggered the run*, and on a `push` to `main` that is whoever
merged. With the Owner as the only required reviewer, the two cases are both bad:

- **If the Dev Lead merges under the Owner's account**, every merge makes the Owner the triggering
  actor, Prevent self-review stops the Owner approving, nobody else can, and **every deploy waits
  until it expires.** This is not hypothetical here: the pull requests on this repository are authored
  by the Owner's login and driven by an agent, which is exactly that arrangement.
- **If the Dev Lead merges under its own identity**, the setting adds nothing, because that identity
  was never a reviewer and so could never have approved.

**So the control is the identity split, not the setting.** The Dev Lead needs its own GitHub identity
— a bot account or a GitHub App — distinct from the Owner's, which `team.md` already implies by making
them different roles with different powers. With that in place, Prevent self-review earns its keep in
exactly one case: a run the **Owner** triggers by merging or dispatching by hand, which they then
cannot approve. That is the right outcome under D-016 — the person approving a deploy should not be
the person who initiated it — but it means such a run has to be re-triggered by the Dev Lead's
identity rather than approved, and anyone who does not know that will read it as the gate being
broken. Which identity the Dev Lead acts under is the Owner's to set up, so it is listed with the
other open questions.

**What it does not give, and each of these is a real limit, not a caveat.**

- **It gates the job, not the reading.** GitHub shows the reviewer a run and a button. Whether the
  Owner reads the diff before pressing it is outside any mechanism. That is exactly why section 3
  exists: the classes of change that must not be approved casually are refused *before* the button
  appears, so the button is never the only thing standing between a skim and a lost database.
- **It is a repository setting, not a file.** Like making the checks required on `main` — still
  outstanding since change 9010 — the environment, its reviewer, the self-review ban and the admin
  bypass cannot be expressed in this repository. `AGENTS.md` says infrastructure as code only, and
  this is the second control that cannot be. The ADR records it as the Owner's to configure; a
  workflow that merely *names* an unconfigured environment silently creates one with no protection
  at all ("Running a workflow that references an environment that does not exist will create an
  environment with the referenced name"), so an unconfigured environment is worse than no gate,
  because the pipeline looks gated.
- **No documented timeout.** The pages read state a maximum *wait timer* of "an integer between 1 and
  43,200 (30 days)" but say nothing about how long a job may sit waiting for a reviewer. A pending
  deploy is therefore of unknown lifetime and should be assumed to expire eventually.

**Making the approved change the deployed change** is the half of D-016 that the environment does not
solve, because an approval of run #41 is an approval of a button, not of bytes.

**Pinning the assembly is not enough, and an earlier draft of this ADR thought it was.** A cloud
assembly pins the *end state*, not the *delta*. Had the deploy job run `cdk deploy --app cdk.out`, it
would have built a **second** change set against whatever was running at deploy time, and the change
set the Owner read would never have been executed. With a per-merge cadence and no documented limit on
how long an approval may sit, that goes wrong like this: runs A and B both diff against stack S0; the
Owner approves A, so the stack becomes S1; the Owner then approves B, whose template was never built
on top of A. The deploy converges the stack to B's end state and silently undoes A, and **the Owner
approved a diff against S0 that showed none of it.** This is the same objection this ADR raises
against approving on the pull request — "it stops being true the moment another change merges" — and
it applied just as well to the design's own post-merge half.

**So the deploy job executes the change set itself, and does not deploy.** Three things close it:

1. The plan job creates a named, lasting change set with `--method=prepare-change-set`, and the deploy
   job runs `ExecuteChangeSet` on **that ARN**. What the Owner read and what CloudFormation applies are
   then the same object, not two objects computed from the same source at different times. It has to be
   a prepared change set rather than a diff one, for the reason given under *The shape of a deploy*.
2. **CloudFormation makes the stale case fail loudly rather than quietly.** "After you execute a change
   set, CloudFormation deletes any additional change sets that are associated with the stack because
   they're no longer valid for the updated stack" (read 2026-11-26). So approving A destroys B's change
   set, and B's deploy job fails with nothing to execute instead of applying a delta nobody reviewed.
   **This holds only if every mutation goes through a change set**, which is why the deploy role gets
   `ExecuteChangeSet` and is explicitly denied `UpdateStack` and `CreateStack`: a direct stack update
   would move the stack without invalidating anything, and the guarantee would evaporate.
3. A `concurrency` group on the workflow, so two runs cannot be pending at once in the first place.
   Point 2 is the backstop for when one is cancelled or re-run anyway.

The plan job still uploads `cdk.out` as the run's artifact — the CDK CLI accepts "the command for
running your app or cloud assembly directory" for `--app` — but it is now evidence of what was
synthesized rather than the thing that gets deployed. The diff comment records the **commit SHA** and
the change-set ARN, which is the record the decision log's open questions ask for when they list "how
each approval is recorded" as undecided (section D; `mvp-scope.md`'s own list does not mention it).

**What this costs, stated rather than discovered.** The deploy step is an AWS API call, not a CDK
command, so the CDK CLI never runs with mutating credentials — a gain — but asset publishing has to
have happened in the plan job. It does: `--method=prepare-change-set` is a `cdk deploy`, which publishes
the stack's assets before it creates the change set, so the Lambda bundle is in the staging bucket
before the Owner is asked. The price is that `cdk deploy`'s conveniences are unavailable on this path,
including `--revert-drift`, which therefore becomes its own deliberate, separately approved deploy
rather than a flag on an ordinary one.

**And it moves the integrity question rather than removing it.** A change set references an asset by
its S3 key, and that key is a fingerprint of the asset's source — but nothing in S3 checks that the
bytes at a key still match the fingerprint that names it. So between the Owner reading the diff and pressing the button, anything
with write access to the staging bucket could replace the zip and the change set would execute
unchanged, deploying code nobody approved. Section 1 keeps that access down to one narrowed role on
`main`; what closes the window itself is three things, two of them already true:

**First, a correction to what the key means, because the obvious check does not work.** An asset's key
carries the staging fingerprint, not a digest of the object in S3: `AssetHashType.SOURCE` bases the
hash "on the contents of the source path" and `OUTPUT` "on the contents of the bundling output" (CDK
API reference, read 2026-11-26). S3's own stored checksum is a third value again — `CRC64NVME` is "the
default checksum algorithm used for checksum calculations" — so **"the stored checksum equals the hash
in the key" is never true for a Lambda zip**, and a deploy job that refused when they differed would
refuse every deploy. An earlier draft of this ADR specified exactly that. Two builds of identical
source can also produce different zip bytes under the same key, so "the only legitimate re-publish is
byte-identical" was wrong too.

What works is pinning a value recorded **at publish time**:

- **The plan job records each published object's `VersionId`** beside the change-set ARN in the diff
  comment, and the deploy job refuses to execute unless the key's current version is still that one.
  Versioning is already on — the bootstrap template creates `StagingBucket` with
  `VersioningConfiguration: Status: Enabled` and a 30-day noncurrent-version expiry (read 2026-11-26) —
  and a `VersionId` needs no cooperation from whatever did the upload, which is why it is the primary
  control rather than a checksum. A SHA-256 supplied at upload with `x-amz-checksum-sha256` would do
  the same job, but only if the CDK's publisher sends one, which was not verified.
- **Write-once asset keys** remain worth having, with the rationale corrected. S3 conditional writes let
  a `PUT` carry `If-None-Match`, which "prevents overwrites of existing data by validating that there's
  not an object with the same key name already in your bucket" and otherwise fails with
  `412 Precondition Failed`; "Bucket owners can use bucket policies to enforce conditional writes for
  uploaded objects", through the `s3:if-none-match` condition key. That stops a swap happening at all,
  rather than detecting it. **Worth confirming when `infra/` is built**: whether the CDK skips
  publishing an asset whose key already exists, or re-puts it and takes the `412`.
- **Versioning is recovery, not prevention.** The change set names the key and not the version, so a
  swap would still deploy; what versioning buys is that the original object is still there for 30 days
  and the substitution is visible afterwards.

**Why the diff comes after the merge, not before it.** D-016 already separates them: "A merge is not a
deploy: merged changes can wait and be deployed together, each deploy with its own approval"
(`workflow.md`). The Owner approves the *deploy*, and the thing they must see is the diff between
what is running and what will run — which is not knowable from a pull request that has not merged, and
is wrong the moment another change merges first. Diffing after merge is the only point at which the
diff is true.

## 3. Refusing a destructive change rather than hoping it is read

The gate has three layers, in increasing order of how little they trust a human.

**Layer 1 — the plan job fails on a destructive change set.** Between preparing the change set and the
approval, the plan job inspects it with `describe-change-set` and fails if it finds any of three
things:

- a resource whose `Replacement` is `True` **or `Conditional`**. CloudFormation's own API reference
  gives the valid values as `True | False | Conditional`, and `Conditional` is what you get when
  `RequiresRecreation` is `Always` but the `Evaluation` is `Dynamic` — that is, CloudFormation cannot
  tell until it executes. A gate that waved `Conditional` through would be offering the Owner a button
  on a change that *might* replace the resource, and layer 2 would not catch it for the Cognito user
  pool, which has no deletion protection, no `RETAIN` and no execution-role deny. Under ADR 0006 that
  pool is the only record of who the Lifter is. An unresolvable answer is treated as the bad one;
- the **removal** of a resource on a short protected list — the DSQL cluster, the Cognito user pool,
  the S3 site bucket, and D-044's scheduler and keep-warm Lambda;
- **any change to a protected resource's own protections**: `DeletionProtectionEnabled`, the
  `DeletionPolicy` attribute, or the `protected` tag.

The third is there because the first two would not catch it. Turning `DeletionProtectionEnabled` off is
`Update requires: No interruption`, and moving `RemovalPolicy` from `RETAIN` to `DESTROY` changes an
attribute rather than a resource — so a change that disarms layer 2 is neither a replacement nor a
removal, and a gate watching only for those would wave through the step that makes the next deploy
destructive. Section 5 relies on this, since that is how an ephemeral stack is allowed to set the
protections off while production cannot have them turned off unnoticed.

A failed plan job means the deploy job never becomes available, so the Owner is not offered a button at
all. The protected list is in the repository, which makes it reviewable and makes extending it a pull
request.

**Layer 2 — AWS refuses even if layer 1 is wrong.** `DeletionProtectionEnabled: true` on the cluster;
`RemovalPolicy.RETAIN` on the cluster and the site bucket; and an explicit `Deny` on
`dsql:DeleteCluster` in the CloudFormation execution role — **conditioned on
`aws:ResourceTag/protected`, not blanket**, so that a throwaway stack can still be torn down, with
`dsql:UntagResource` denied on a tagged cluster so the condition cannot be removed first (section 5
explains why the blanket form does not work). It is expressible in code because `cdk bootstrap`
accepts a custom execution policy. A CloudFormation **stack policy** denying
`Update:Replace` and `Update:Delete` on the cluster's logical ID is the textbook control here, and
AWS describes it precisely as what layer 2 is for: "Use a stack policy only as a fail-safe mechanism
to prevent accidental updates to specific stack resources." It suits section 2's deploy path
particularly well, because on that path it cannot be waved away: "If you execute a change set on a
stack that has a stack policy associated with it, CloudFormation enforces the policy when it updates
the stack. You can't specify a temporary stack policy that overrides the existing policy when you
execute a change set." It is recorded as an option rather than adopted, for one reason: a stack policy
is set on the stack through the API, not declared in the template, so it is a third control that
cannot live in this repository.

**One correction to the mental model, because the obvious guard does not do what it looks like.**
`DeletionPolicy: Retain` does not protect against replacement. AWS is explicit: the attribute "doesn't
apply to resources whose physical instance is replaced during stack update operations." Retain
protects a resource that leaves the template. It does nothing about one that CloudFormation decides
to recreate. For `AWS::DSQL::Cluster` that distinction happens to be free — no property triggers
replacement — but the habit of treating `RETAIN` as a replacement guard is wrong and would be wrong
for the next stateful thing added.

**Layer 3 — the one `cdk diff` cannot see, and the reason this section is not finished.** Aurora DSQL
will not let a bad schema change be undone. A primary key "can't be changed or added later"; `ALTER
TABLE` supports `DROP NOT NULL` but there is no `SET NOT NULL`, no `ALTER COLUMN ... TYPE` and no
`ADD PRIMARY KEY` in the supported syntax; `TRUNCATE` is unsupported and `DROP TABLE` is not (all read
2026-11-26). So the irreversible operations are a `DROP COLUMN`, a `DROP TABLE`, and a `DELETE` with a
wrong predicate — none of which appear in a CloudFormation change set, because the schema is not
CloudFormation's. **If migrations are run outside this gate, D-016's "stateless and stateful changes
alike" is satisfied in letter and not in substance.** The options are set out under *What the Owner
still has to decide*; this ADR does not pick one, because picking it decides how the application is
built and that is not this document's to decide.

## 4. Rollback, when the stateful part is Aurora DSQL

Rolling back splits cleanly in two, and only one half is a rollback.

**The stateless half is easy and is not special.** The dashboard is files in S3 and the API is a
Lambda; reverting to the previous commit and deploying it is an ordinary deploy, which means it needs
its own Owner approval like any other (D-016, no blanket approvals). The practical consequence is
worth stating: **a rollback is as slow as the Owner is available.** If that is unacceptable for some
future incident, the remedy is a decision the Owner makes in advance, not an exception an agent takes
during one.

**The stateful half is not a rollback at all.** Verified against the AWS Backup and Aurora DSQL
documentation on 2026-11-26:

- **AWS Backup is the only mechanism** — ADR 0005 already says this, and the Aurora DSQL user guide's
  backup page describes AWS Backup and nothing else.
- **A restore never happens in place.** "When you restore Aurora DSQL clusters, AWS Backup always
  creates new clusters to preserve your source data." A new cluster has a new identifier and a new
  endpoint, so recovery is: restore, then a stack change to point the Lambda at the new cluster, then
  an approval, then a deploy. The restore is the quick part.
- **There is no point-in-time recovery.** AWS Backup's feature-availability table marks Aurora DSQL
  with cross-Region backup, cross-account backup, full management, lifecycle to cold storage and
  logically air-gapped vault — and **leaves "Continuous backup and point-in-time restore" blank**, as
  it leaves incremental backup and restore testing blank. So the recovery point is the last scheduled
  snapshot, the loss window is the backup interval, and AWS Backup's restore-testing feature cannot
  be used to prove the restore works. **Someone has to test a restore by hand, once, before the
  Owner's real training data is the only copy.** That is a Phase 1 obligation this ADR adds, in the
  same spirit as ADR 0005's latency measurement.
- **And the backup only exists if D-044's ping is running.** A backup of an `Idle` or `Inactive`
  cluster fails: `"Code": "FailedPrecondition"`, `"Message": "Cluster 'cluster-id' is in state 'IDLE'
  and can't be backed up..."`. ADR 0005 already treats the ping as what makes backups work. The
  deployment consequence is new: **the keep-warm ping is a recovery control, so a deploy that breaks
  it silently removes the ability to recover,** and the plan job should treat the scheduler and its
  Lambda as protected resources on the same list as the cluster.

The honest summary, which the Owner should read as a limit of the chosen architecture rather than of
this process: for the stateless half, rollback is a redeploy of the previous commit. For the data,
there is no rollback — there is a restore to a new cluster, losing everything since the last snapshot,
and the restore has never been tried.

## 5. Is there a staging environment? Priced, not asserted

`mvp-scope.md` lists this as undecided, and D-014's ceiling is the reason it was never obvious. Rates
read from the AWS pricing pages on **2026-11-26**, for **Europe (Ireland)** where the page publishes a
regional figure.

| What a second environment adds | Monthly | How firm |
|---|---|---|
| A second DSQL cluster, storage | **$0.36 per GB-month** beyond the allowance | Ireland rate, read from the page's own Region selector |
| A second DSQL cluster, activity | **$9.50 per million DPUs** beyond the allowance | Ireland rate, same selector |
| ...but the free tier is shared | **$0.00 while it lasts** | "Each month, your first 100,000 DPUs and 1 GB of storage are free and automatically applied to your monthly bill" — *your bill*, so one allowance for the account, not one per cluster. The page does not use the words "per account"; this is read from "your monthly bill" |
| A second hosted zone, **if** staging gets its own domain | **$0.50** | "$0.50 per hosted zone per month for the first 25 hosted zones", not prorated |
| A staging host as records in the **existing** zone | **$0.00** | No per-record charge; queries are $0.40 per million, and alias records pointing at CloudFront distributions "do not incur a charge" |
| A second CloudFront distribution, S3 bucket, API Gateway, Lambda set, Cognito pool | **$0.00** | All inside the same always-free and indefinite allowances ADR 0005 already relies on |

**So the bill is between $0.00 and about $0.50 a month, and the honest total is "under a dollar".**
D-014's ceiling does not decide this, which means the argument has to be made on something else, and
there are three somethings:

- **Against.** A second environment is a second thing to bootstrap, a second set of OIDC roles and
  trust policies to get right, and — if its deploys are gated too — a second approval the Owner gives.
  If its deploys are *not* gated, it is a path into the same AWS account that D-016 does not cover.
- **Against, specific to this stack.** The free DSQL allowance is shared, and ADR 0005 records the
  production DPU figure as the one line nobody can predict. A staging cluster consumes an allowance of
  unknown remaining size, which makes the Phase 1 DPU measurement harder to read, not easier.
- **For.** It is the only place a restore can be tested, a destructive migration can be rehearsed, and
  the plan-and-approve pipeline itself can be exercised before it is pointed at the Owner's real
  training data. Sections 3 and 4 both end in obligations that have nowhere else to run.

A middle option exists and is cheaper than either: **an ephemeral environment** — the same CDK app
deployed to a second stack, used for a restore test or a migration rehearsal, and destroyed the same
day. Route 53 charges no hosted zone at all if it reuses the production zone, and AWS notes "a hosted
zone that is deleted within 12 hours of creation is not charged" if it needs its own. The cost is
hours of DSQL storage and whatever DPUs the rehearsal burns.

**"Destroyed the same day" is not free, because section 3's layer 2 would prevent it.** A second
stack of the same app in the same account inherits all three protections — `DeletionProtectionEnabled:
true`, `RemovalPolicy.RETAIN`, and the `dsql:DeleteCluster` deny in the CloudFormation execution role,
which section 6 makes a permanent property of the account. `cdk destroy` would leave the ephemeral
cluster running. So **the protections have to distinguish production from a throwaway, and the
distinction has to be one the plan job can see:**

- `DeletionProtectionEnabled` and `RemovalPolicy` are per-stack properties, set from CDK context, so
  the ephemeral stack sets them to `false` and `DESTROY`. Turning them off on *production* is a
  property change that appears in the diff, and the protected-resource list in layer 1 is where it is
  caught.
- The execution-role deny is account-wide and cannot be per-stack, so it is conditioned on a tag —
  deny `dsql:DeleteCluster` where `aws:ResourceTag/protected` is `true` — and the production cluster
  carries the tag. **The weakness of that is worth stating rather than discovering: a tag-conditioned
  deny is only as strong as control over the tag**, so the same role must also be denied
  `dsql:UntagResource` on a cluster carrying it.

If the ephemeral cluster is left behind anyway, it costs **$0.36 per GB-month** in Ireland — below a
cent at this size — but it keeps drawing on the account's shared 1 GB and 100,000 DPU allowance,
which is the same objection raised against a permanent staging cluster above.

## 6. Bootstrap, and what to do about drift

**Bootstrapping is the one step this process cannot gate, because it creates the thing that does the
gating.** `cdk bootstrap` deploys a CloudFormation stack named `CDKToolkit` holding an S3 asset
bucket, an ECR repository and five IAM roles — `CloudFormationExecutionRole`, `DeploymentActionRole`,
`FilePublishingRole`, `ImagePublishingRole`, `LookupRole`. AWS states the identity doing it "must have
at least the following permissions": `cloudformation:*`, `ecr:*`, `ssm:*`, `s3:*` and `iam:*`, on
`*` (read 2026-11-26). That is administrator-grade, and it has to happen **before** any GitHub
workflow can assume anything, along with creating the OIDC identity provider and the two roles
themselves.

This collides with D-015 and D-016 at the same point: the agent deploys and the Owner does not use the
console, yet the first act requires credentials no workflow can hold and the repository may not store.
Three ways out, all of which the Owner has to choose between:

- **The Owner runs it.** `cdk bootstrap --show-template` emits the template, so the bootstrap can be
  reviewed as code in a pull request and then applied by the Owner from a terminal with short-lived
  credentials. Running a CLI is not "using the console" in D-015's sense — the Owner is executing a
  reviewed artifact, not clicking. This keeps the admin credential with the person accountable for the
  account.
- **The Dev Lead runs it with a credential the Owner mints and revokes.** Short-lived, so D-016's
  prohibition is respected in substance. The Owner still has to create and hand over a credential,
  which is the step they were trying to avoid.
- **Bootstrap, then narrow.** Bootstrap with the default policies, then re-run with
  `--cloudformation-execution-policies` pointing at a least-privilege policy that denies
  `dsql:DeleteCluster` on a cluster tagged `protected`, **and `dsql:UntagResource` on the same
  cluster** — without the second, the role can drop the tag and the first deny stops applying — so the
  permanent state of the account is narrower than the state it was created from.

**Narrowing is not optional, because of what the default bootstrap leaves behind.** Section 1 sets
out the `DeploymentActionRole` hole in full: the role trusts the account root and holds
`ExecuteChangeSet`, `CreateStack`, `UpdateStack` and `DeleteStack`. Whoever bootstraps therefore also
has to create the change-set-only role the plan job uses and the explicit `sts:AssumeRole` deny that
keeps `coach-gh-plan` away from the bootstrap roles — in the same act, before the first pipeline run,
since until then a job on `main` can deploy without an approval. `cdk bootstrap --show-template` emits
the default so the modified version can be reviewed as a diff against it rather than written blind.

**Drift.** `cdk drift` "calls CloudFormation's drift detection operation to compare the actual state of
resources in AWS ("reality") against their expected configuration in CloudFormation", and `--fail`
"Return with exit code 1 if drift is detected". Run it in the plan job: a diff computed against a
drifted stack is a diff of the wrong thing, and the Owner would be approving a change relative to a
baseline that is not what is running. `cdk deploy --revert-drift` exists and uses CloudFormation's
`REVERT_DRIFT` deployment mode to put drifted resources back — but reverting drift *is* a change, so it
goes through the same approval as any other, and since section 2's deploy path executes a change set
rather than running `cdk deploy`, a drift revert is a deliberate, separately planned and approved run
rather than a flag added to an ordinary one.

**Two things make drift detection less reassuring than it sounds, and both are verified.**

- **Not every resource supports it.** `AWS::DSQL::Cluster` does. **`AWS::Cognito::UserPool` does
  not** — CloudFormation's resource-type support table marks it `Yes` for import and IaC generator and
  **`No` for drift detection** (read 2026-11-26). Under ADR 0006 the user pool is the only record of
  who the Lifter is, and the `cognito_sub` pinned in the `settings` row is derived from it. So the one
  resource whose hand-editing would lock the Owner out of their own data is the one resource
  drift detection cannot see. ADR 0006's remedy still stands and is the right one: re-running the
  provisioning script is the documented recovery.
- **Drift is only out-of-band change.** It says nothing about the database contents, for the same
  reason section 3's layer 3 exists.

## 7. Where the runtime configuration comes from

ADR 0005 observed ShredPace serving `GET /config.json` from the CDN with `region`, `userPoolId`,
`clientId` and `cognitoDomain`, and recorded it as "a pattern worth considering separately and is not
decided here". This is that separately.

**Start by naming what is actually secret: nothing.** A Cognito user-pool id and app-client id are sent
to the browser by any Cognito sign-in flow; ShredPace serves them as static JSON on the public
internet. The single permitted `cognito_sub` from ADR 0006 is not a deploy-time input at all — it is a
row that the provisioning script writes after reading the `sub` back from the pool, precisely so the
two cannot drift. Nothing in this stack needs a secret store, and saying so is the decision.

| Option | Monthly | What it is actually for |
|---|---|---|
| **AWS Secrets Manager** | **$0.40 per secret per month**, plus $0.05 per 10,000 API calls | Secrets that rotate. Paying $0.40 a month to store a public identifier is paying for the wrong property |
| **SSM Parameter Store, standard** | **$0.00** — "Standard parameters are available at no additional charge", and standard-throughput API interactions are too | A fine place for a non-secret value the Lambda reads. Costs a runtime API call on a cold start, which lands on the delay ADR 0005 spent a section on |
| **CDK context / stack outputs into the build (chosen for the API side)** | $0.00 | The Lambda gets the pool id as an environment variable set by CDK at deploy time. No runtime lookup, nothing on the cold-start path |
| **`config.json` written by the deploy, served from the CDN (chosen for the dashboard)** | $0.00 | The dashboard is static files with no build-time knowledge of the stack. CDK writes `config.json` as part of the S3 deployment, so the pool the dashboard talks to is always the pool the stack just created |

Prices read 2026-11-26.

**The one trap in the chosen pair**, and it is the mirror image of ADR 0005's `/api` cache rule:
`/config.json` is a static asset, so CloudFront *will* cache it, and a deploy that rebuilds the user
pool while a stale `config.json` is cached leaves the dashboard pointing at a pool that no longer
exists. `/api` must not be cached for confidentiality; `/config.json` may be cached but must be
invalidated on every deploy that changes it. Both are CloudFront behaviours and both belong in the
same review, alongside the `Authorization`-header check ADR 0005 already flags.

## Costs this process adds

| Component | Monthly | How firm |
|---|---|---|
| GitHub Actions, standard runners | **$0.00** | "The use of standard GitHub-hosted runners is free: ... In public repositories." Larger runners are billed even in public repositories, so the workflow must not request one |
| CloudFormation change sets and drift detection | **$0.00** | "There is no additional charge for using AWS CloudFormation with resource providers in the following namespaces: AWS::* and Alexa::*." Nothing here uses a third-party resource type |
| IAM OIDC provider and roles | **$0.00** | IAM is not charged |
| CDK bootstrap: S3 asset bucket, ECR repository | **rounds below a cent** | A few MB of assets. The ECR repository is created and unused, since the Lambda is a zip rather than a container |
| A staging environment, if the Owner wants one | **$0.00 to ~$0.50** | Section 5 |
| | **~$0.00, or up to ~$0.50 with staging** | against about $10 (D-014), on top of ADR 0005's ~$1.67 |

Read 2026-11-26. The process is free; what it costs is the Owner's attention, once per deploy, which
is what D-016 bought on purpose.

## Considered options

- **A long-lived IAM access key in a GitHub secret.** Rejected: D-016 forbids it outright. Recorded
  because it is the thing most repositories do, and because it is worth being explicit that "a GitHub
  Actions secret" is a long-lived deploy credential stored in the repository's settings — the
  prohibition is not satisfied by the key being out of the working tree.
- **A repo-wide OIDC trust policy (`StringLike` on `repo:ORG/REPO:*`).** Rejected for the reason in
  section 1: this repository is public, so a subject any stranger can cause to exist falls inside the
  wildcard.
- **Approving the diff on the pull request instead of after the merge.** Rejected. The diff that
  matters is between what is running and what will run; before the merge that diff is not yet true,
  and it stops being true the moment another change merges. It would also require AWS credentials in a
  pull-request context on a public repository, which section 1 refuses.
- **`cdk deploy --require-approval any-change` as the gate.** Rejected: it prompts at a terminal and
  there is no terminal. The option does not appear in the workflow at all, because the deploy step
  executes a change set rather than running `cdk deploy`.
- **Deploying the approved assembly with `cdk deploy --app cdk.out`.** This is what an earlier draft of
  this ADR specified, and the Independent Reviewer was right that it does not deliver D-016. It pins
  the end state and recomputes the delta at deploy time, so with two approvals pending the second can
  silently undo the first. Replaced by executing the reviewed change set; see section 2.
- **CDK Pipelines (a self-mutating CodePipeline in AWS).** Rejected for Phase 1. It is the AWS-native
  answer and it puts the approval in CodePipeline rather than GitHub, but it adds an always-on
  pipeline, CodeBuild projects and an artifact bucket to a stack whose whole argument is that nothing
  is paid while idle, and it moves the approval into the console that D-015 says the Owner does not
  use. Worth reopening if deploys ever become frequent enough that GitHub Actions' coupling to the
  repository is the limiting factor.
- **No gate on staging, if staging exists.** Open, not rejected — see below. D-016 is about production,
  and requiring an approval to deploy a throwaway environment is how a gate gets routed around.

## What the Owner still has to decide

1. **Deploy cadence.** D-016 left it open: per merge, or batched per release. Per merge means the diff
   is small enough to read and the approvals are frequent; batched means fewer interruptions and a
   larger diff each time, which is the condition under which skim-approval happens. The Dev Lead's
   view, offered as a view: per merge while `infra/` is small, revisit if it becomes tiresome.
2. **Whether a staging environment exists**, and if so whether its deploys are gated. Section 5 prices
   it at under a dollar; the argument is about approval surface, not money.
3. **Who runs `cdk bootstrap` the first time**, from section 6's three options.
4. **Whether a refusal by the destructive-change gate can be overridden, and how.** A gate with no
   override will one day block a legitimate change; a gate with a convenient override is the
   skim-approval it was built to prevent. One middle course: an override exists, requires a commit to
   the protected list in a reviewed pull request, and therefore leaves a record.
5. **Which GitHub identity the Dev Lead merges and deploys under.** A bot account or a GitHub App,
   distinct from the Owner's. Section 2 shows why it is not cosmetic: with the Owner as the only
   required reviewer, an identity shared with the Owner makes Prevent self-review deadlock every
   deploy, and an identity that is not a reviewer makes the setting redundant. It needs an account
   created, which is the Owner's to do.
6. **Whether schema migrations go through this gate.** If they do, the migration has to be expressed
   as something reviewable and the plan job has to render it beside the infrastructure diff. If they
   do not, D-016's "stateful changes alike" does not reach the only operations on this stack that
   cannot be undone. This is the question with the most consequence and the least AWS documentation.

## Consequences

- **Three controls in this design cannot be expressed in this repository**, which is a real exception
  to `AGENTS.md`'s infrastructure-as-code rule rather than a technicality: the GitHub Environment and
  its reviewer; making the checks required on `main` (outstanding since change 9010); and, if adopted,
  the CloudFormation stack policy. All three are the Owner's to set, and a pipeline that names an
  unconfigured environment is *less* safe than one with no gate, because it looks gated.
- **ADR 0005's keep-warm ping becomes a recovery control, not only a latency one.** It already made
  backups possible; it now also means a deploy that breaks it removes the ability to back up, silently.
  The ping, its schedule and its Lambda join the protected-resource list.
- **A Phase 1 obligation is added: test a restore once, by hand, before the Owner's data is the only
  copy.** AWS Backup's restore-testing feature is not available for Aurora DSQL, so nothing else will
  do it.
- **Rollback of the application is a deploy, so it needs an approval, so it is as fast as the Owner is
  available.** Anyone who expects a one-command rollback should read this sentence first.
- **ADR 0005's Aurora DSQL cost row is out of date in one respect.** It records "$8/million DPU and
  $0.33/GB-month ... US East figures; no Ireland rate published". The pricing page's Region selector
  now publishes **Europe (Ireland) at $9.50 per million DPUs and $0.36 per GB-month** (read
  2026-11-26). **The $1.67 total does not change**, because that row is recorded as expected-zero
  inside the free allowance either way, and D-012 leaves the region free. What changes is that the
  caveat is false, and a false caveat invites the next person to repeat it. The decision log's
  architecture notes are corrected in this change; amending an accepted ADR is the Owner's call and is
  raised in the pull request rather than taken here.
- **Item 5 of `development-preparation.md` is answerable once this is approved**, and item 1 has no
  unwritten ADR left. Neither row is marked closed here; closing one is the Owner's.

## Evidence

Everything below was read on **2026-11-26**. Where a page publishes no figure, that is recorded rather
than filled in.

- **GitHub OIDC**: provider URL, `sts.amazonaws.com` audience, `id-token: write`, the "must define at
  least one condition" prerequisite, the IAM recommendation to evaluate `:sub`, the `StringLike`
  `repo:org/repo:*` wildcard example, and the subject formats for environment, pull request and ref.
  Note: repositories created after 15 July 2026 use an immutable subject format carrying owner and
  repository IDs (`repo:octo-org@123456/octo-repo@456789:ref:refs/heads/main`), so the exact string
  the trust policy pins must be read from a real token rather than assumed.
- **GitHub Environments**: up to six reviewers and one approval sufficient, Prevent self-review,
  branch restrictions, admin bypass, "must follow any protection rules ... before running", the
  create-on-reference behaviour, "If a job is rejected, the workflow will fail", and the wait timer's
  1–43,200 minute range. **No page read states a timeout for a job waiting on a reviewer.**
- **GitHub Actions billing**: standard GitHub-hosted runners are free in public repositories; larger
  runners are billed even there.
- **CDK CLI**: `cdk deploy --method`'s four values, with `prepare-change-set` documented as "Create
  change set but don't perform deployment ... if you have an approval process for change sets" and
  `execute-change-set` as its counterpart, plus `--change-set-name`; `cdk diff --method` semantics
  including the template-only inaccuracy; `--fail`; `cdk drift` versus `cdk diff`, and `cdk drift --fail`;
  `cdk deploy --require-approval` values and `--revert-drift`; `--app` accepting a cloud assembly
  directory.
- **CDK source** (`aws/aws-cdk-cli@main`, `packages/@aws-cdk/toolkit-lib/lib/api/deployments/cfn-api.ts`):
  `createDiffChangeSet` names its change set `cdk-diff-change-set-<uuid>` and `createChangeSetAndCleanup`
  removes it in a cleanup block that runs "whether or not creation succeeded", also calling `deleteStack`
  on the `REVIEW_IN_PROGRESS` shell when the stack did not exist before, with a comment that a leftover
  one "blocks subsequent change set creation". This is why the plan job does not use `cdk diff` to make
  the change set the Owner approves.
- **CDK asset hashes**: `AssetHashType.SOURCE` bases the hash "on the contents of the source path" and
  `OUTPUT` "on the contents of the bundling output" — neither is a digest of the uploaded object.
- **S3**: `CRC64NVME` as "the default checksum algorithm used for checksum calculations", with SHA-256
  available as `x-amz-checksum-sha256`; conditional writes with `If-None-Match` preventing overwrites and returning
  `412 Precondition Failed`, that "Bucket owners can use bucket policies to enforce conditional writes
  for uploaded objects", and the existence of the `s3:if-none-match` condition key in the S3 service
  authorization reference.
- **CDK bootstrapping**: the `CDKToolkit` stack, the five IAM roles, the
  `cloudformation:* ecr:* ssm:* s3:* iam:*` permission set required of the bootstrapping identity, and
  `--show-template`. The `DeploymentActionRole`'s trust principal (`AWS: Ref: AWS::AccountId`) and its
  `DeployPermissions` and `CliPermissions` statements were read from `bootstrap-template.yaml` on
  `aws/aws-cdk-cli@main`, not inferred from the guide, because section 1's whole argument rests on
  them. From the same file: `FilePublishingRole` has the same account-root trust and a default policy
  allowing `s3:PutObject*`, `s3:DeleteObject*`, `s3:Abort*`, Get, List and KMS encrypt/decrypt on the
  staging bucket; and `StagingBucket` is created with `VersioningConfiguration: Status: Enabled` and a
  30-day noncurrent-version expiry. **Not read on a documentation page**: the synthesizer property that
  sets the role the plan job uses to create the change set. Section 1 marks that as the one thing to
  check before the first deploy rather than claiming a resolution. *(Whether the CLI can override the
  role recorded in a synthesized assembly was listed here while the deploy job still ran `cdk deploy`;
  the question went away when it stopped, since only the plan job runs the CDK CLI now.)*
- **CloudFormation**: update behaviours and what Replacement means; `DeletionPolicy` and the explicit
  statement that it "doesn't apply to resources whose physical instance is replaced"; stack policies
  as a fail-safe that is not access control, and that a stack policy is enforced on the change-set path
  with no temporary override ("You can't specify a temporary stack policy that overrides the existing
  policy when you execute a change set"); that executing a change set "deletes any additional change
  sets that are associated with the stack because they're no longer valid for the updated stack",
  which is what makes section 2's stale-approval case fail closed; resource-type support showing `AWS::DSQL::Cluster`
  supporting drift detection and `AWS::Cognito::UserPool` **not** supporting it; and
  `AWS::DSQL::Cluster`'s five properties, every one `Update requires: No interruption`.
- **Aurora DSQL**: `ALTER TABLE` supported syntax (no `ALTER COLUMN ... TYPE`, no `SET NOT NULL`, no
  `ADD PRIMARY KEY`; "Dropping of primary key columns is not supported"); "You can't change this key
  or add a new primary key later"; `DELETE FROM` instead of `TRUNCATE`; the cluster lifecycle table
  and the `FailedPrecondition` backup error, with **no duration published for either the
  `Active -> Idle` or the `Idle -> Inactive` transition**; and "Aurora DSQL does not currently support
  row-level security" on the `CREATE VIEW` page.
- **AWS Backup**: "AWS Backup always creates new clusters to preserve your source data", and the
  feature-availability table leaving continuous backup / point-in-time restore, incremental backup and
  restore testing **blank** for Aurora DSQL.
- **Prices**: Aurora DSQL Europe (Ireland) $9.50 per million DPUs and $0.36 per GB-month, against US
  East (Ohio) $8.00 and $0.33, read from the page's own Region selector; the free tier of 100,000 DPUs
  and 1 GB a month applied to the bill; Route 53 $0.50 per hosted zone per month for the first 25, not
  prorated, no charge for a zone deleted within 12 hours of creation, $0.40 per million standard
  queries, and no query charge for alias records pointing at CloudFront; Secrets Manager $0.40 per
  secret per month plus $0.05 per 10,000 API calls, from the page's own worked examples; SSM Parameter
  Store standard parameters and standard-throughput interactions at no additional charge; and no
  additional CloudFormation charge for `AWS::*` resource providers.
- **Not read.** AWS Backup's per-GB storage rate for Aurora DSQL is published behind a Region selector
  that did not render; at the few MB this database will hold it rounds below a cent, so no figure is
  claimed here and ADR 0005's "~$0.00, unpriced" stands.
