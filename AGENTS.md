# AI Lift Coach

AI Lift Coach is built by a team of AI agents following the AI-assisted Development Lifecycle (ADLC), with GitHub as the persistent source of truth.

## Always

- Never push to the main branch.
- Infrastructure as code only.
- Design approval is required before implementation.
- Architecture approval is required before implementation.
- The design folder has one owner: `docs/design/ailiftcoach/` is the Design Agent's.
- Design and application code never share a pull request.

## Read before you start

- [Intent](docs/product/intent.md): why this project exists and what it is for. It wins over every other document here.
- [Team and permissions](docs/agents/team.md): your role and what it may do. Read this first on every task.
- [Decision boundaries](docs/agents/decision-boundaries.md): what you may decide, and what you must stop and ask about.
- [Workflow](docs/agents/workflow.md): where issues live, the before-starting and before-completing steps, PR review and quality gates.
- [The lifecycle](docs/agents/lifecycle.md): the seven stages, how AI is used within them, and how progress is measured.
- [Development preparation](docs/agents/development-preparation.md): what is not ready yet. Application development has not started.
- [Design handoff](docs/agents/design-handoff.md): who owns the design folder, and how development asks design for a change.

## Commands

The application has a test suite and a type check, and the design has two checks of its own. All
exit non-zero on a failure, so any can gate a change. Run them from the repository root.

- **Tests.** `npm test` (Vitest).
- **Types.** `npm run typecheck` (`api`, `infra` and `scripts`).
- **Lint.** `npm run lint` (Biome).
- **Infrastructure.** `npx cdk synth --app "npx tsx infra/bin/app.ts"` builds the stack's template
  and fails if it cannot.

The two design checks:

- **Palette contrast.** No dependencies.
  `node docs/design/ailiftcoach/tools/check-contrast.mjs`
  Healthy output: `50 pairs checked across 2 themes, 0 failing`
- **Rendered contrast.** Needs `npm install --prefix docs/design/ailiftcoach/tools` once, and takes
  the prototypes directory as an argument.
  `node docs/design/ailiftcoach/tools/audit-rendered.mjs docs/design/ailiftcoach/prototypes`
  Healthy output: `34 screen renders audited, 0 text elements below contrast`

**Run both before reporting any design task complete, and paste the output.** If a check fails, fix
the page, not the check.

## Architecture

The spine of the application exists: `api/` (the Lambda handlers, the database layer and the two
surfaces, HTTP and MCP) and `infra/` (the CDK stack) are npm workspaces, and `scripts/` holds what an
operator runs, such as `mint-key`. Beside them this repository holds product discovery, design and the
process that builds it. Design sources are at `docs/design/ailiftcoach/` — prototypes as
self-contained HTML, the token system under `system/`, which is authoritative on anything visual.
`docs/product/shredpace/` is reverse-engineered reference material about a different product:
evidence for how a feature should behave when it is built, never a scope commitment.

Four recurring mistakes are recorded in `.claude/rules/design-system.md`, which loads by itself
when you open a file under `docs/design/ailiftcoach/`.
