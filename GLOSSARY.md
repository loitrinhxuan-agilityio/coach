# AI Lift Coach

An agent-first training log and dashboard: the Lifter's own AI assistant logs what they do and coaches from the history, and the website shows the result. A personal product with its own identity, built as the Owner's practice ground for AI-assisted development.

## Language

### The product

**AI Lift Coach**:
The product's name, chosen by the Owner on 2026-11-23. It names the product and nothing else.
_Avoid_: Coach App (the working title until 2026-11-18), Rung (chosen on 2026-11-18 and replaced on 2026-11-23; see D-018 and D-023)

### People and access

**Lifter**:
The person who trains and uses AI Lift Coach.
_Avoid_: User, customer, client

**Account**:
Everything one Lifter owns in AI Lift Coach: their data, their Keys and their settings.
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
The AI agents that build AI Lift Coach (Design Agent, Dev Lead, Builders, Reviewer). They are not part of the product.
_Avoid_: Agents (unqualified)

**ADLC**:
The AI-assisted Development Lifecycle: the way the Team agents and the Owner build AI Lift Coach, from issue to design approval, pull request, review and deploy. AI agents contribute to defined tasks; the Owner retains decision authority.
_Avoid_: Agentic Development Lifecycle (it implies the agents own the lifecycle), Agent Development Lifecycle

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
An exercise from AI Lift Coach's own built-in catalogue. Only its training settings can be edited.
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
The instructions AI Lift Coach gives an Agent about how to behave: the MCP server's instructions and a Markdown page.
_Avoid_: Docs, prompt

**Sample account**:
A built-in Account, named Sam, with about eight weeks of invented history, used by tests, design boards and demos.
_Avoid_: Demo data, fixtures, dummy account
