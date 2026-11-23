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

- [Intent](intent.md): why this project exists and what it is for. It wins over every other document here.
- [Team and permissions](docs/agents/team.md): your role and what it may do. Read this first on every task.
- [Decision boundaries](docs/agents/decision-boundaries.md): what you may decide, and what you must stop and ask about.
- [Workflow](docs/agents/workflow.md): where issues live, the before-starting and before-completing steps, PR review and quality gates.
- [The lifecycle](docs/agents/lifecycle.md): the seven stages, how AI is used within them, and how progress is measured.
- [Development preparation](docs/agents/development-preparation.md): what is not ready yet. Application development has not started.
- [Design handoff](docs/agents/design-handoff.md): who owns the design folder, and how development asks design for a change.
