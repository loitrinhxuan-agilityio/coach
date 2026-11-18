# Rung

An agent-first training log and dashboard: the Lifter's own AI assistant logs what they do and coaches from the history, and the website shows the result. A personal product that clones ShredPace's behaviour with its own identity.

## Language

### The product

**Rung**:
The product's name. It names the product and nothing else: a step on a skill ladder is a step, never a rung.
_Avoid_: Coach App (the working title until 2026-11-18)

### People and access

**Lifter**:
The person who trains and uses Rung.
_Avoid_: User, customer, client

**Account**:
Everything one Lifter owns in Rung: their data, their Keys and their settings.
_Avoid_: Profile, user

**Agent**:
The Lifter's own AI assistant, connected to their Account with a Key, which logs and reads on their behalf.
_Avoid_: Bot, assistant, coach (for the assistant)

**Key**:
A credential that names one Agent and lets it act on one Account.
_Avoid_: Token, API key

**Owner**:
The project's product owner, who defines requirements and approves designs. Never the holder of an Account.
_Avoid_: Account owner, admin

**Team agents**:
The AI agents that build Rung (Design Agent, Dev Lead, Builders, Reviewer). They are not part of the product.
_Avoid_: Agents (unqualified)

**ADLC**:
The Agentic Development Lifecycle: the way the Team agents and the Owner build Rung, from issue to design approval, pull request, review and deploy. It is how the product is built, not what it is.
_Avoid_: Agent Development Lifecycle

### Coaching

**Insights**:
The rule-based checks on a Lifter's logged data (stalls, push-to-pull imbalance, training load, the weekly recap) and the page that shows them. There is no AI in them.
_Avoid_: Coach (for this module), alerts

**Stall**:
A lift whose top set has stopped beating its best across a run of recent sessions while effort is rising or already at the top.
_Avoid_: Plateau

**Check-in**:
The question asked before a session about sleep, soreness and energy.
_Avoid_: Readiness survey

**First-week review**:
The question asked a week after a Lifter's first session: was it too hard, about right or too easy.
_Avoid_: Week-after check-in

### Notes

**Standing note**:
A rule or preference the Lifter wants every Agent to follow, such as "dumbbell weights are per hand".
_Avoid_: Note, memory

**Session note**:
The Lifter's own words about one finished session, kept so the Agent remembers them next time.
_Avoid_: Workout note, comment

**Exercise cue**:
A short instruction attached to an exercise and read out with its first set.
_Avoid_: Trainer note, tip

### Exercises

**Starter exercise**:
An exercise from Rung's own built-in catalogue. Only its training settings can be edited.
_Avoid_: Default exercise, standard exercise

**Custom exercise**:
An exercise a Lifter creates for themselves.
_Avoid_: User exercise

### Time

**Week**:
Monday to Sunday in the Lifter's time zone. Weekly totals, streaks, the plan and recaps all use it.
_Avoid_: Rolling week, seven-day window

### The build

**Agent guide**:
The instructions Rung gives an Agent about how to behave: the MCP server's instructions and a Markdown page.
_Avoid_: Docs, prompt

**Sample account**:
A built-in Account, named Sam, with about eight weeks of invented history, used by tests, design boards and demos.
_Avoid_: Demo data, fixtures, dummy account
