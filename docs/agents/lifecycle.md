# The lifecycle

The Owner's own words, lifted from the intent document so that agents read them where they work.
See [`intent.md`](../../intent.md) for why the project exists.

ADLC is the **AI-assisted Development Lifecycle**. AI agents contribute to defined tasks; humans
retain decision authority. It organises and governs the work: individual tools and skills support
particular activities, and they do not replace the lifecycle or its approval responsibilities.

## The seven stages

1. **Discovery and intent** — establish the problem, users, product vision, constraints and success
   criteria.
2. **Research and reverse engineering** — investigate reference-product behaviour and capture
   evidence, without copying its identity or implementation.
3. **Requirements and scope** — turn findings into explicit requirements, user stories, acceptance
   criteria and deferred items.
4. **Design validation** — create an independent visual identity, design system and prototypes, and
   validate the design assumptions that matter.
5. **Architecture and preparation** — document technical decisions, quality expectations, workflows
   and implementation readiness.
6. **Development** — implement approved work in small, reviewable increments.
7. **Verification and delivery** — demonstrate that the result meets requirements, design, security
   and quality expectations.

## How AI is used

AI is a collaborator for specific, bounded activities, not an authority whose output is
automatically correct. The current practice includes **Grill Me** to expose missing information and
challenge assumptions, **REA** to investigate reference-product behaviour and organise evidence,
**Claude Design** for the independent identity and prototypes, and **Superpowers** for engineering
workflows — brainstorming, planning, test-driven development, systematic debugging, verification
and code review. Other tools join when they clearly help a defined task.

For any meaningful piece of AI-assisted work, the Owner should be able to say what was delegated,
what context and constraints were supplied, how the result was evaluated, and what was accepted or
changed.

## How progress is measured

Progress is validated learning and working evidence, not the volume of AI-generated output.

Work should leave inspectable artifacts: clarified decisions and documented assumptions; research
notes and evidence; requirements and acceptance criteria; design tokens, prototypes and validation
results; approved ADRs and implementation plans; tests, review findings and verified working
software.

Every implementation should trace back to an approved requirement and design, the reason for each
key technical choice should be recoverable, and how the result was verified should be on the record.
