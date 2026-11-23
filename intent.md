# Intent — AI Lift Coach

Author: Owner. Status: draft.

## Problem

I want to get good at directing, evaluating and governing AI-assisted software work: turning an idea
into a clear vision, requirements and a scope that can actually be finished; using AI deliberately
for discovery, research, design, planning and implementation; making technical decisions explicit
and evidence-based; and keeping the decisions, and the accountability for them, with me rather than
with the tools. I have not taken a project through that end to end, so I do not yet know where my
own judgement is weak.

The product has a problem of its own, and it has to be a real one or it teaches me nothing. An
assistant forgets between chats. Workout apps want manual entry that nobody does with chalk on their
hands. The apps that do track well ignore the assistant the person already talks to every day. There
is nowhere for that assistant to put what happens in the gym, and no rulebook for it to coach from.

## Proposed outcome

I can lead an AI-assisted project from intent to working, maintainable software: delegating with
enough context to get useful work back, telling evidence apart from assumption and from output that
merely reads well, applying real engineering practice instead of accepting the plausible, holding
scope, architecture, security and cost under control, and making every decision and approval
explicit. What I learn is reusable on the next project, which is the point of doing it on this one.

The product that proves it: I log a real leg session by talking to my own assistant, which writes it
over MCP with a Key; the session appears on a calm, desktop-first dashboard; and I get a next-time
weight suggestion together with the rule that produced it.

The dashboard reports and the agent acts. Training data is written only by the agent, account access
is mine, and nothing else on any page is editable — where another product would put a button, this
one puts the sentence to say to the agent. Coaching is deterministic rules, never a model inside the
product, and every figure on the page names its source: logged, told, computed or estimated.

## Affected users and systems

**Me, in both roles this project gives me.** The Owner, who sets requirements and approves designs,
architecture and deploys; and the Lifter, who is the only user. Nothing is built for a second person.

**The Team agents who build it** — Design Agent, Dev Lead, Builders, Independent Reviewer. Their
boundaries are mine to set and mine to enforce, and they are the part of this I am actually
practising on.

**My own AI assistant,** connected over MCP or REST with a Key. It is the only writer of training
data, which is what makes "is it still connected" a first-class question rather than a detail.

**AWS,** as the planned home for the dashboard and the API, and **the ShredPace research in this
repository,** which is evidence for how a feature should behave — never a design, a wording or an
API to copy.

## Constraints

About **$10 a month on AWS**, with infrastructure as code only.

**No AI inside the product.** Every coaching target is a deterministic rule and arrives with its
reason, because a product that explains itself is the only kind I can verify.

**Phase 1 is the only committed scope.** Every other feature is a candidate, decided when Phase 1 is
in daily use and I know what I actually miss rather than what I imagine I will.

## Open questions

**The architecture is undecided.** Hosting and data store; how a person and an Agent's Key are each
authorised; how one account's data is kept from another's when the planned database has no
row-level security; the Phase 1 API contracts; and the deploy and approval process. No ADR is
written yet, and the identity provider they all depend on is unchosen.

**Two of the three quality gates cannot be enforced.** There is no CI to run the tests the first
gate requires, and no directory for the screenshots the second one names.

**About a dozen decisions were accepted by a "yes" and never revalidated** — the stall constant, the
project's whole vocabulary, metric-only units, the sixty-exercise starter catalogue, the
Monday-to-Sunday Week, and the rest. They stand until I change them, which is not the same as
having chosen them.
