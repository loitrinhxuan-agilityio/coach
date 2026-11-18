# PRD: Rung

> **Precedence.** This PRD is the single place for the text of every user story. Where it disagrees with
> `docs/product/decision-log.md`, `docs/product/requirements.md` or `docs/product/mvp-scope.md`, those win: the PRD
> is being brought into line (see "Pending" in the decision log) and is not yet.

> **Phasing: desktop first.** The Owner decided to build the desktop dashboard first. Phone layouts (story 153) come in a later phase, as a PWA (D-019), and the phone boards in the prototype are not needed for Phase 1.
>
> **Status: draft for the Owner's review.** Written from the ShredPace research in
> `docs/product/shredpace/` (features, product rules, signed-in observations). The Owner decided that
> Rung is **a personal product that clones every ShredPace feature, built in phases** (decisions D-005 and D-006).
> Each story is tagged **[Phase 1]** or **[Phase 2]**; an untagged story belongs to a later phase that the
> Owner has not yet ordered. **Nothing here has been approved.**

## Problem Statement

A person who trains regularly, and who already talks to an AI assistant, has nowhere good for that
assistant to put what they do. The assistant forgets between chats. Generic workout apps want manual
entry, which is the thing nobody wants to do with chalk on their hands. Apps that do track well ignore
the assistant the person already has, so the person ends up copying numbers between two places.

When they do keep a log, it rarely coaches. It does not know what weight they should try next, that they
are returning from a week off, that their knee hurts, or that a plan they wrote last month no longer fits
how they actually train. The person wants a trainer who remembers everything, speaks in one line while
they are mid-set, and never makes them open an app to enter data.

## Solution

Rung is a training log and dashboard whose input is **the person's own AI assistant**. The
assistant logs sets as the person trains, over an API and an MCP server, and coaches from the history.
The website is where the person sees the result: a calm, mostly read-only dashboard.

The coaching itself is **rule-based, with no AI inside the product**. Rung supplies deterministic
rules and complete data: which weight comes next, how to ease someone back after a break, what a goal's
projected date is, what to eat. The person's assistant supplies the conversation.

It covers lifting and the surrounding life of a lifter: a plan with a focus, goals, habits and tests,
food, body measurements, aches, time away, and weekly Insights. It clones ShredPace's behaviour and
domain rules in full, built in phases, with its own name, wording, visual identity and API.

## User Stories

Each story is tagged **[Phase 1]** or **[Phase 2]**; an untagged story belongs to a later phase that the Owner
has not yet ordered (see `docs/product/mvp-scope.md` and `requirements.md`).

### Account and agents

1. As a new lifter, I want to sign up with an email or a Google account, so that I can start in a minute. **[later phase: Phase 1 Accounts are created by a script]**
2. As a lifter, I want to create an API key named after my agent and see it exactly once with a Copy
   button, so that I can connect the agent without the key being stored anywhere readable. **[Phase 2]**
3. As a lifter, I want a warning before I leave the key screen without copying the key, so that I don't
   lose it by accident. **[Phase 2]**
4. As a lifter, I want to connect any assistant through an MCP server or a plain REST API using that key,
   so that I can use whichever assistant I already talk to. **[Phase 1]**
5. As a lifter, I want to see which agents are connected and when each last called, so that I know the
   connection works. **[Phase 2]**
6. As a lifter, I want to revoke a key immediately and keep the history it wrote, so that a lost key
   stops working and nothing I logged disappears. **[Phase 2]**
7. As a lifter with several agents, I want every change attributed to the key, or to me, that made it,
   so that I can tell which agent did what. **[Phase 2]**
8. As a lifter, I want standing rules such as "dumbbell weights are per hand" stored as standing notes that every
   agent reads, so that I don't repeat myself to each one.
9. As an agent, I want one call that tells me who I am, the account's settings and the person's standing notes, so
   that I can begin a conversation correctly. **[Phase 1]**
10. As a lifter, I want keys stored only as hashes, so that a database leak does not hand out working keys. **[Phase 1]**
11. As a lifter, I want an agent's key to be unable to manage keys, export my data, delete my account or
    give consent for me, so that a leaked key cannot do the most damaging things. **[Phase 1]**

### Sessions and sets: the core loop

12. As a lifter, I want my agent to start a session only when I say I'm at the gym, so that asking about
    the plan doesn't open one. **[Phase 1]**
13. As an agent, I want to resume an open session from today and end a stale one first, so that sets never
    land in the wrong session. **[Phase 1]**
14. As a lifter, I want to say "squat 100 kg for 5, 5, 5" and have each set logged straight away, so that
    I never type in the gym. **[Phase 1]**
15. As a lifter, I want every logged set to come back as one short line saying what was logged and what is
    next, so that I never wonder whether it worked. **[Phase 1]**
16. As a lifter, I want to name exercises naturally ("OHP", "incline bench") and see the name that was
    actually logged, so that a wrong match is caught before the next set. **[Phase 1]**
17. As a lifter, I want "again" or "same" to repeat my last set, so that I don't re-say the numbers. **[Phase 1]**
18. As a lifter, I want a set that looks wrong ("14 × 10" after "40 × 10") held with one clarifying
    question, so that a slip of the tongue doesn't corrupt my history. **[Phase 1]**
19. As a lifter, I want weights I say per side ("15 a side") understood on barbells, so that I speak the
    way I load the bar. **[Phase 1]**
20. As a lifter, I want a barbell weight lighter than the bar to be checked, so that a missing "a side"
    is caught. **[Phase 1]**
21. As a lifter, I want to describe a set's effort as Easy, Good, Hard or All out, so that I don't have to
    think in effort numbers. **[Phase 1]**
22. As a lifter, I want a set called a warm-up only when I say so, so that light working sets are not
    silently excluded from my progress. **[Phase 1]**
23. As a lifter, I want to correct or delete any set, and to delete a whole session, so that mistakes are
    recoverable. **[Phase 1]**
24. As a lifter, I want to end a session with two separate ratings, how hard it was and how it felt, so
    that effort and enjoyment are never mixed up. **[Phase 1]**
25. As a lifter, I want to keep a session note in my own words, so that my agent remembers it next time. **[Phase 1]**
26. As a lifter, I want a session left open for hours to be ended where it stopped, so that a forgotten
    session doesn't distort my week. **[Phase 1]**
27. As a lifter, I want a new best mentioned in the same line as the set that earned it, so that the
    moment isn't buried. **[Phase 1]**
28. As a lifter, I want a retry after a timeout never to log the same set twice, so that a flaky
    connection is safe. **[Phase 1]**
29. As a lifter, I want to undo any change for seven days, so that "undo that" is a single step. **[Phase 2]**
30. As a lifter, I want a past workout recorded after the fact, with its sets attached, so that I can log
    a session I forgot to log live.

### Exercises, load types, bar and gyms

31. As a lifter, I want a starter catalogue of exercises with muscles, a rep range and a weight increment,
    so that I can begin without building a list. **[Phase 1]**
32. As a lifter, I want to create my own exercises and edit them, while starter exercises accept only
    training settings, so that the shared catalogue stays consistent. **[Phase 1]**
33. As a lifter, I want to hide an exercise without losing its history, so that retired lifts don't clutter
    the list.
34. As a lifter, I want every lift to know what its number means (barbell total, dumbbell per hand, one
    side, stack, added weight, assistance), so that volume and progress are counted correctly. **[Phase 1]**
35. As a lifter, I want an assisted lift to count less assistance as progress, so that the chart goes the
    right way.
36. As a lifter, I want the bar's weight asked once, with its scope (just today, this lift, or from now
    on), so that I'm never quizzed on it in the gym. **[Phase 1]**
37. As a lifter, I want barbell targets to be loadable with my plates and never below the bar, with the
    plates per side shown, so that I never do the arithmetic. **[Phase 1]**
38. As a lifter, I want to save my gyms with their bar, plates, dumbbells, kettlebells and machines, up to
    twenty, so that targets fit where I am.
39. As a lifter, I want to say "home today" and have that session use that gym's weights, so that a trip
    or a different gym doesn't break my targets.
40. As a lifter, I want an exercise my gym cannot support swapped for one it can, for that session only,
    and told once, so that I don't hit a wall.
41. As a lifter, I want an exercise with no sensible swap left out without counting as missed, so that
    travelling doesn't hurt my record.
42. As a lifter, I want only weights I can actually pick up suggested, and a request for more reps once I
    reach my heaviest, so that targets are never impossible.
43. As a lifter, I want to see an exercise's history, top set, volume and estimated one-rep maximum, so
    that I can judge my progress on a lift. **[Phase 1]**

### Coaching: before, during and after

44. As a lifter, I want to be asked about sleep, soreness and energy in one line before a session, so that
    my training reflects how I feel.
45. As a lifter, I want a poor check-in to lighten that one day only, so that a bad night doesn't change my
    long-term plan.
46. As a lifter, I want today's targets for each planned exercise with the reason for the number, so that I
    trust them. **[Phase 1]**
47. As a lifter, I want the next set, its plates and its rest, adjusted when my last set was harder than
    planned, so that I'm never working off a stale plan. **[Phase 1]**
48. As a lifter, I want a rest time with its reason after every set, so that I know why I'm waiting. **[Phase 1]**
49. As a lifter in my first week, I want no weight targets at all, only a rule to work up to a set that
    leaves two or three reps, so that my starting weights are found rather than guessed.
50. As a lifter, I want to be asked how many more reps I could have done on an exercise's last set in the
    first week, so that my effort is recorded without jargon.
51. As a lifter, I want a lift that stopped short of hard worked up again next time, so that my first
    weights are honest.
52. As a lifter, I want next time's weight to build on the heaviest weight where I reached the rep range,
    not on my heaviest set, so that one lucky set doesn't inflate my targets. **[Phase 1]**
53. As a lifter, I want the weight to rise only when every working set reached the top of the range at a
    manageable effort, so that I add reps before I add weight. **[Phase 1]**
54. As a lifter, I want a step back of about ten percent after two sessions short of the range, so that I
    recover from a stall instead of grinding. **[Phase 1]**
55. As a lifter, I want warm-up sets suggested for my first heavy lift, rounded to my plates, so that I
    warm up properly.
56. As a lifter, I want a brand-new lift to start from a related lift I've done, and to be told so, so that
    I don't begin from nothing.
57. As a lifter, I want a summary when I finish: plan against done, records, what to do next time, so that
    every session ends with a conclusion. **[Phase 1]**
58. As a lifter, I want a record celebrated once, with the best it beat, so that a milestone feels like one. **[Phase 1]**
59. As a lifter, I want a first-week review a week after my first session, so that "too hard" or "too easy" adjusts the next
    week by about ten percent or one step.
60. As a lifter, I want a retest of my main lifts every six weeks, so that my plan tracks my real strength.
61. As a lifter, I want a lighter deload week on a cadence that depends on my experience (about every
    eight, six or four weeks), so that fatigue doesn't pile up.
62. As a lifter, I want to ask "how am I doing today?" mid-session and get one line, so that I don't have to
    leave the workout to find out.
63. As a lifter, I want what is still recovering shown on a rest day, so that I know whether to train.

### Plan, intake and programs

64. As a new lifter, I want a trainer-style intake (experience, injuries and limitations, a health
    questionnaire, body type, focus, starting weights, dislikes, home equipment), so that the plan starts
    from me.
65. As a lifter, I want one plan holding my focus, pace and time, with food, goals and the weekly count all
    following it, so that I make each decision once.
66. As a lifter, I want to choose from five focuses (lose fat, lose fat and build muscle, build muscle,
    maintain, perform), so that the product matches what I'm actually after.
67. As a lifter, I want to preview what switching focus would change before anything moves, so that I'm
    not surprised by my food targets or goals.
68. As a lifter, I want goals that work against my new focus listed once with a ready replacement, never
    removed silently, so that I stay in control of my goals.
69. As a lifter, I want a health flag to cap my targets at a moderate effort and avoid loading a flagged
    area until a professional clears it, so that the product is careful with me.
70. As a lifter, I want to be told plainly that the product is coaching and not medical advice, so that I
    seek a professional for a medical issue.
71. As a lifter with an injury, I want its limitation set to "avoid" or "easy", and re-asked every four
    weeks whether it still bothers me, so that exercises return when I'm ready.
72. As a lifter, I want to plan a single day, or have my coming week filled from last week, so that planning
    is a few seconds.
73. As a lifter, I want the week filled to keep a swapped exercise's slot and tell me what it replaced, so
    that substitutions persist sensibly.
74. As a lifter, I want cardio added to my plan only if I asked for it, so that I'm never given conditioning
    I didn't choose.
75. As a lifter, I want to be asked which to change when my program's days and my available days disagree,
    so that the product never silently overrides my time.
76. As a lifter, I want multi-week programs with named blocks, one running at a time, ended early with a
    result when I stop, so that a program is a real thing with a history.
77. As a lifter, I want a first-steps list on a new account's Today (connect an agent, set up the plan,
    first weigh-in), so that I know what to do next.
78. As a lifter, I want the health check repeated yearly and when I add an injury, so that my safety
    settings don't go stale.

### Time away, missed days and coming back

79. As a lifter, I want to tell my agent I'm going away, so that those days never count against my plan or
    my streak.
80. As a lifter who will train while away, I want a lighter plan written for those days and my habits
    offered a pause, so that travel is handled.
81. As a lifter who missed a planned day, I want to be asked once whether to move the week or keep today's
    session, with the outcome of each shown, so that I decide with the facts.
82. As a lifter, I want the move done in one step and undone in one step, so that a mistake costs nothing.
83. As a lifter who disappeared for days without saying why, I want to be asked whether I was away, ill or
    busy, so that the right easing applies.
84. As a lifter returning from a break, I want to be asked once, together with my check-in, whether to use
    the same weights or ease in, so that today matches how I feel.
85. As a lifter returning after more than three weeks, I want easing in offered first, so that a long break
    is treated with respect.
86. As a lifter returning from illness, I want to be asked whether I'm fully recovered and to be eased in
    more gently, so that I don't overdo it.
87. As a lifter, I want the first session back to be an easy effort for lifts only, so that runs and swims
    aren't needlessly cut.
88. As a lifter, I want to be asked whether to pick up this week's plan from its first missed session or
    carry on from today, so that my week still makes sense.

### Goals, habits, benchmarks and skills

89. As a lifter, I want goals named for their target, never for the focus or the reason, so that a goal
    reads as a number I can chase.
90. As a lifter, I want goals of several kinds (a lift to hit, a run time, a weekly count, a body number,
    a food target, a guard that warns, or anything custom), so that I can track what I actually want.
91. As a lifter, I want only one active goal per measure, so that two goals never fight over the same
    number.
92. As a lifter, I want a goal whose date needs an unsafe pace to ask first and offer a safe date, so that I
    am not nudged into something harmful.
93. As a lifter, I want a goal to say where I started, where I am, my pace and a projected date in plain
    words, so that I know if I'm on track.
94. As a lifter, I want "early days" instead of "on track" when there isn't enough data, so that the product
    never claims more than it knows.
95. As a lifter, I want a guard goal that warns when a lift's strength slips or a body measure leaves a
    band, so that I notice a problem while cutting.
96. As a lifter, I want a skill goal such as a first pull-up as a ladder of testable steps, with the next
    step tried first, so that a big goal becomes small ones.
97. As a lifter, I want to be told when I'm stuck on a step for four weeks and offered an in-between step,
    so that I don't stall indefinitely.
98. As a lifter, I want daily habits as a tick or a count with chosen days and streaks, so that small
    daily things are tracked.
99. As a lifter, I want a habit limit such as "at most 300 mg" to turn the day amber and never red, so that
    going over doesn't feel like failure.
100. As a lifter, I want a habit offered only after I've mentioned the same thing three times, and not
     again for thirty days after I say no, so that the product never nags.
101. As a lifter, I want benchmarks, tests repeated every few weeks, placed into my plan and compared with
     last time, so that I measure progress on purpose.

### Food

102. As a lifter, I want to log a meal from a sentence or a photo estimate, confirmed in one line before it
     is saved, so that logging is fast but never wrong without my say.
103. As a lifter, I want a photo estimate marked as an estimate, and never stored as an image, so that my
     photos stay mine.
104. As a lifter, I want to correct a meal by portion ("half") and then by individual numbers, so that fixing
     is quick.
105. As a lifter, I want saved meals and a "log again" row of my usuals, so that repeat meals take one phrase.
106. As a lifter, I want a supplement logged with a meal to count toward its habit and add no calories, so
     that creatine in my shake isn't a fake meal.
107. As a lifter, I want daily targets worked out from my focus, my weight and my training days, and shown
     with how they were worked out, so that I trust them.
108. As a lifter, I want calories to lead when I'm cutting and protein to lead when I'm building, so that
     the most important number is the biggest.
109. As a lifter, I want targets to use my seven-day average weight, so that one heavy morning doesn't move
     them.
110. As a lifter, I want training days a little higher than rest days, so that my food follows my effort.
111. As a lifter, I want my protein to follow lean mass when I have a proper scan, so that a high body
     weight doesn't inflate my target.
112. As a lifter, I want the day summed up in one line, such as calories eaten of the target and protein
     still to go, so that I can check in a glance.
113. As a lifter, I want weekly averages to matter and a single day over target never to be shown as bad or
     in red, so that food tracking doesn't punish me.
114. As a lifter, I want to hide the numbers and see only "on track" or not, so that I can track without
     fixating.
115. As a lifter, I want my targets adjusted gently, no more than a capped amount, when my weight trend
     doesn't match my pace, so that the plan corrects itself safely.

### Body, metrics and aches

116. As a lifter, I want weigh-ins, scans and tape measurements in one place, with the newest weight as my
     bodyweight, so that there is one source of truth.
117. As a lifter, I want to send a screenshot of my scale or scan and have every number on it logged after I
     confirm, so that I don't re-type a report.
118. As a lifter, I want a screenshot never stored, only its numbers, so that my images stay private.
119. As a lifter, I want devices recognised loosely, with a model number counting as a different machine and
     a near-duplicate name checked first, so that my readings group correctly.
120. As a lifter, I want a change compared with my last reading from any device, with a warning when it
     probably came from switching device, so that I don't chase measurement noise.
121. As a lifter, I want values the numbers imply but don't hold, such as fat mass, worked out and compared,
     so that my report is complete.
122. As a lifter, I want a scan whose numbers don't agree, such as a percentage sent as kilograms, checked
     before it is saved, so that bad data doesn't get in.
123. As a lifter, I want each body metric to have its own history with ranges, rate of change and the date
     I'd reach my goal, so that I see where I'm heading.
124. As a lifter, I want a typical range shown only where a published adult reference exists, in careful
     wording, so that I'm informed without being labelled.
125. As a lifter, I want to track any number I choose, with the right chart for its kind, so that resting
     heart rate or steps have a home.
126. As a lifter, I want the product to search before it creates a metric, so that two agents don't make
     duplicates.
127. As a lifter, I want to log an ache in my own words, so that it is tracked over time.
128. As a lifter, I want exercises that load an ache made lighter when it is five or more or rising, and
     left out at seven or more until I say it's better, so that training respects pain.
129. As a lifter, I want the product never to diagnose or name what an ache might be, so that I'm sent to a
     professional.

### Insights

130. As a lifter, I want to be told when a lift has stalled, with a suggested step back I can accept in one
     tap, so that I act on a plateau.
131. As a lifter, I want to be told when I press far more than I pull, with the least-trained regions named,
     so that I can balance my plan.
132. As a lifter, I want my recent load compared with my four-week average and shown as detraining,
     building, pushing or risky, so that I notice a spike.
133. As a lifter, I want a dismissed insight to stay away until next week and return only if it still
     holds, so that I'm not nagged.
134. As a lifter, I want a weekly recap of sessions, records and streak, so that each week closes.
135. As a lifter, I want to switch off the morning check, the Monday recap and stall alerts separately, so
     that Insights speak only when I want.

### Endurance (runs, rides, swims)

136. As a lifter, I want to log a run, ride or swim from my words, a screenshot or a file, with distance,
     time, climb, heart rate and power, so that cardio counts.
137. As a lifter, I want a hard 5 km, a 20-minute ride or a 400 and 200 swim to set my zones, so that
     targets are in my own pace, watts or per-100 m.
138. As a lifter, I want each rep compared with my zone after an interval session, so that I know how I did.
139. As a lifter, I want my endurance week shown against its plan, so that I see running 13 of 22 km at a
     glance.

### The dashboard

140. As a lifter, I want a Today page that follows where I am, before, during or after training, so that it
     always shows what matters. **[Phase 1]**
141. As a lifter, I want Today to show a body figure of what I trained this week, six tiles for the week, a
     timeline of today's sessions and meals, and recent insights, so that I see my week in one place.
142. As a lifter, I want the dashboard to be read-only, with a short sentence to copy wherever I'd
     otherwise edit, so that my agent makes the change. **[Phase 1]**
143. As a lifter, I want each copyable sentence to include everything my agent needs, so that pasting it
     into any chat works.
144. As a lifter, I want a Training area with sessions, progress and exercises, so that history is easy to
     browse. **[Phase 1]**
145. As a lifter, I want Food, Body and Goals areas, so that each domain has a home.
146. As a lifter, I want an activity feed showing who changed what, filterable by agent and by kind, with
     undo, so that I can audit my log.
147. As a lifter, I want what an agent logged since my last visit shown with a "looks right" button, so that
     I can confirm an agent's work.
148. As a lifter, I want a Settings area that separates what is mine to change from what my agent sets, so
     that it is clear who owns each choice.
149. As a lifter, I want to see every standing note my agents keep and forget any one, so that I control what they
     remember.
150. As a lifter, I want to edit directly on this device for an hour when my agent can't help, so that I'm
     never stuck. **[later phase: Phase 1's dashboard is read-only for training data]**
151. As a lifter, I want a live page during a session that updates as my agent logs, so that I can glance at
     my phone between sets.
152. As a lifter, I want empty screens to tell me exactly what to say to my agent, so that a blank page
     teaches me how to start. **[Phase 1]**
153. As a lifter, I want the dashboard to work on a phone with a tab bar and an account menu, so that I can
     check it at the gym.
154. As a lifter, I want a light and a dark mode that follow my device, so that it is comfortable day and
     night. **[Phase 1]**

### Privacy, consent and trust

155. As a lifter, I want my health details (body readings, meals, check-ins, injuries, tracked numbers,
     aches, and what I tell my agent about a session) kept only after I agree myself, so that I decide who
     holds them.
156. As a lifter, I want an agent to be unable to agree to health consent for me, so that consent is real.
157. As a lifter, I want workouts to keep logging without consent, with the health fields left out and
     named, so that declining doesn't break the product.
158. As a lifter, I want turning consent off to delete every health detail at once, including the copies in
     the activity log, so that withdrawal is real.
159. As a lifter, I want to be asked again, with a deadline, when the consent wording changes, so that I
     never agree to words I haven't seen.
160. As a lifter, I want a record of what I agreed to and when, so that consent is auditable.
161. As a lifter, I want to export all my data as JSON, so that I can take it with me.
162. As a lifter, I want to delete my account and everything in it at once, so that leaving is complete.
163. As a lifter, I want no analytics, trackers or ads, so that my training isn't a product.
164. As an agent, I want to report an API problem and check on it later, so that failures reach the people
     who can fix them.
165. As a lifter, I want my agent to send support a message only after I confirm it in one line, so that
     nothing is sent in my name without my yes.
166. As an agent, I want a clear error with the fix in one sentence on every bad request, so that I can
     correct myself without guessing. **[Phase 1]**
167. As an operator, I want each key rate-limited, so that one runaway agent can't degrade the product. **[Phase 2]**

### Added by the desktop audit (2026-11-18)

Found by walking every desktop screen and every API operation against this list; see `docs/product/shredpace/review/coverage-audit.md`. Each closes a feature that the first 167 stories covered only partly or not at all.

168. As a visitor, I want a public page that says what the product is, how it works in three steps, which assistants it works with and what it costs, with a sign-up button, so that I can decide before I register. **[later phase]**
169. As a lifter, I want a Contact us page with a topic (something's broken, an idea, plan or billing, a privacy request, other), a subject, a message and my account email as the reply address, so that I can reach a person.
170. As a lifter, I want the contact form to say what it sends along (the page I came from, the app version, my browser) and let me remove it, so that I know what is shared.
171. As a lifter, I want privacy requests (a copy of my data, a correction, deletion or restriction) to go through a path only a person can use, never an agent key, so that nobody can make one for me.
172. As a lifter, I want Privacy and Terms pages reachable from every page, each with its last-updated date, so that I can read what I agreed to.
173. As a lifter, I want to filter my sessions by strength, cardio and outdoors, so that I can find one kind of session.
174. As a lifter, I want a finished session's page to show, for each exercise, every set today against last time and my all-time best with the estimated one-rep maximum, so that I can see exactly how it went. **[Phase 1]**
175. As a lifter, I want that page to show the muscles worked, split into primary sets and helping muscles, so that I understand what the session did.
176. As a lifter, I want previous and next links between sessions, so that I can page through my history.
177. As a lifter, I want the After page to show this week's sets per muscle with a note when one is under 10, when each muscle will be recovered, and the next target for each lift, so that planning the next session is easy.
178. As a lifter, I want effort and feel on a session to show which agent set each, so that I know who rated it.
179. As a lifter, I want an exercise cue for each exercise, with the first cue read out with that exercise's first set, so that a cue reaches me when I need it.
180. As a lifter, I want to set my own food targets (calories, protein, carbs, fat, fibre) and switch fibre on or off, with manual targets never moved by the product, so that I can override the worked-out numbers.
181. As a lifter, I want to browse my food by past day with a day navigator, so that I can review earlier days.
182. As a lifter, I want short tips on the Food page, such as weighing in a few mornings a week, so that I know what to do next.
183. As a lifter, I want to fix a value in a body reading, delete a reading or scan, fix or delete a metric reading, fix or delete an ache entry, delete a meal and delete one of my own exercises that no session uses, correct a miscounted benchmark result, and rename a body device so its readings merge, so that every logged item can be corrected.
184. As a lifter, I want to stop tracking a metric, a habit or a benchmark and keep its history, so that retired items don't clutter and nothing is lost.
185. As a lifter, I want to mark a goal done or remove it, so that finished or dropped goals leave the active list.
186. As a lifter, I want a page for any week of my plan listing each day's exercises with sets, rep ranges and weights, and a copyable "move a day" sentence, so that I can see ahead.
187. As a lifter, I want a Progress page with a range selector, first marks after my first session, estimated-1RM trends per lift, bests by lift and by run, a year grid of trained weeks, and a switch between lifts and runs, so that I can see my long-term direction.
188. As a lifter, I want Progress to show what I trained by muscle, with a scope switch (last session, this week, 90 days, 1 year, all time), so that I can see my balance.
189. As a lifter, I want Progress to show a recomp card with waist, main-lift and body-fat trends and a weight band, judged from week four, so that the scale doesn't mislead me.
190. As a lifter, I want a "to check" view of everything my agent logged that is waiting for my yes, with confirm and discard, so that held items don't get lost.
191. As a lifter, I want to set my display name, time zone, height, year of birth and body type, so that the product speaks in my terms.
192. As a lifter, I want to sign out from Settings, so that I can leave a shared device. **[Phase 1]**
193. As a lifter, I want a button that copies an example sentence to say to my agent, so that I always know how to start.
194. As a lifter, I want the side rail to show my agent's connection status and when it last logged, so that I know it's working.
195. As a lifter, I want a keys page that shows each agent key's name, connection state and last use, with Revoke and Make a key, and a note that only I can connect, make or revoke, so that managing agents is clear. **[Phase 2]**
196. As a lifter, I want my exercise list ordered by what I used most recently and then alphabetically, so that my own lifts come first.
197. As a lifter, I want a saved meal's page to show its numbers per serving and its extras, with a copyable sentence to log it, so that I can inspect a usual.

### Added after the first grilling (2026-11-18)

198. As an agent, I want a guide, served as the MCP server's instructions and as a Markdown page, that tells me how to behave (ask the check-in first, answer in one line, never work out a barbell total myself, ask at most one question per reply), so that I coach well without being told each time. **[Phase 1]**
199. As a maintainer, I want scripted conversations ("log a leg workout", "I'm going away", "what's next?") run against a real assistant as acceptance tests, so that a change to the guide or the rules that breaks the gym experience is caught. **[Phase 1]**
200. As a lifter, I want my week to run Monday to Sunday in my time zone, so that this week's totals, my streak and the recap agree.
201. As the team, I want a Sample account with about eight weeks of history, including a stalled lift, a missed day, an away period and a few scans, so that populated screens can be designed, tested and demonstrated. **[Phase 1]**

### Added for Phase 1: signing in (2026-11-18)

The first 201 stories covered sign-up (story 1) and sign-out (story 192) but never signing in. With Accounts created by a script (decision D-003), Phase 1 needs these instead of sign-up.

202. As a lifter, I want to sign in with my email and password, so that only I can see my dashboard. **[Phase 1]**
203. As a lifter whose Account was created for me, I want to replace my temporary password at my first sign-in, so that nobody else knows my password. **[Phase 1]**
204. As a lifter, I want an expired session to say "Please sign in again" and then bring me back to the page I was on, so that an expiry costs me one step. **[Phase 1]**
205. As a lifter, I want to change my password in Settings, so that I can rotate it when I choose. **[Phase 1]**

## Implementation Decisions

**Product shape**
- Rung is an agent-first product: a REST API and an MCP server expose one operation for each
  capability, and a web dashboard presents the result. Every capability the dashboard shows must also be
  reachable by an agent.
- The dashboard is read-only for training data. Edits go through the agent; the dashboard offers
  sentences to copy. A short list of choices stays with the person directly: appearance, agents and keys,
  consent, export, sign-out and deleting the account.
- The product contains no AI. Coaching is a set of deterministic rules over the person's data.
- Everything is described to the agent as a short sentence to say, so replies are usable in a gym.

**Build order.** The first slice is the core loop on desktop: an Account and a Key, start a session, log
sets over REST and MCP, get the next-set suggestion, and see Today and the session page. It builds the
progression engine, load calculator and set sanity checker with their tests. Everything else (food, body,
goals, plan, Insights) builds on it. The Sample account is built early so populated screens can be designed
and checked.

**Agent guide.** ShredPace's behaviour in the gym depends on a long guide that tells the assistant how to
act, and the rule engine alone does not provide that. Rung ships its own, in its own words, as the MCP
server's instructions and as a Markdown page at a fixed address. It is checked by scripted conversations
run against a real assistant (stories 198 and 199).

**Deep modules.** Each of these hides a large amount of rule logic behind a small, stable interface and
is testable without a database, a network or a clock.

1. **Progression engine.** Given an exercise's history, its settings and the person's state, it returns
   the next target and the reason: base weight selection, double progression, step-back, first-week
   finding, related-lift seeding, assisted-lift handling and warm-up sets.
2. **Load calculator.** Given a bar, a set of plates and a target, it returns what is loadable, the
   plates per side, and whether the target needed adjusting. It owns the per-side versus total reading.
3. **Set sanity checker.** Given a proposed set and recent history, it decides whether to accept it or
   hold it with a question (far from the previous set, half or double the weight, lighter than the bar,
   mixed units).
4. **Readiness adjuster.** Combines check-in, time away, illness, a comeback answer and health flags
   into the day's adjustment to targets.
5. **Plan engine.** Fills a week, moves a missed day in either of the two ways, carries days after time
   away, and reports program-versus-time mismatches. Moves are single, undoable writes.
6. **Goal tracker.** Computes status, pace, projected date and the safe-pace check for each goal kind,
   including guards and the Riegel prediction for performance goals.
7. **Nutrition targets calculator.** Works out maintenance, the focus's offset, training and rest days,
   protein basis (weight, lean mass or reference weight), floors and the capped weekly adjustment.
8. **Body readings normaliser.** Validates ranges, matches devices loosely, merges a scan logged in parts,
   works out derived values and compares against the last reading from any device.
9. **Insight rules.** Detects stalls (four sessions without a better top set while effort rises or reaches 9; the number is one named constant), push-to-pull imbalance and load, with insight identities that
   carry the week so dismissal lasts until next week.
10. **Habit and streak rules.** Streak counting over a habit's own days with pauses, limits and amber, not
    red, states.
11. **Consent gate.** The single place that decides whether a health detail may be read or written, what a
    request returns when it may not, and what is deleted when consent is withdrawn.
12. **Event log and undo.** Every write is recorded with who made it; any write can be undone for seven
    days; deletes are soft. This module is the basis of attribution, the activity feed and "undo that".
13. **Conversation formatter.** Produces the `say` line for each write and the `show` object (spoken
    line, table, sparkline, chart series, link) for each review read.
14. **Operation registry.** A single definition of each operation produces the REST route, the MCP tool and
    the published API description, so the three cannot drift.

15. **Progress aggregator.** Builds the Progress page from the history: first marks, the weekly best estimated one-rep maximum per lift, bests by lift and by run, the year grid, the muscle balance for a chosen scope, and the recomp card's trend inputs. Pure and range-parameterised.

**Architectural decisions**
- All weights are stored in kilograms. v1 accepts and shows kilograms and kilometres only; pounds and miles can be added later without a data change.
- Dates are local days in the person's time zone; "today" is accepted anywhere a date is.
- A Week runs Monday to Sunday. Each Account has one IANA time zone, detected at sign-up and editable;
  every "today" and "this week" is computed in it. There is no per-person week-start setting.
- Insights, the weekly recap and the morning check are computed when asked. There is no scheduler, email
  or push notification in v1.
- An Agent connects with a Key only (docs/adr/0001-key-based-agent-access-first.md).
- The data model is multi-account from the first migration, though v1 is invite-only
  (docs/adr/0002-multi-account-from-day-one.md).
- Creates accept a client reference for idempotency; a repeat returns the first result without recording
  anything new.
- A write that looks wrong answers with a held status and one question; the client re-sends with a
  confirmation once the person agrees.
- Misspelt optional fields are understood and reported as warnings; a field that would change meaning is
  rejected. Every rejection carries a one-sentence fix.
- Reads that the agent will say aloud carry a spoken line; during a session they carry only that line.
- Health-detail reads and writes pass through the consent gate; deletes always succeed.
- Operations that must never be reachable with an agent key (keys, export, delete account, consent,
  privacy requests) are enforced at the operation level, not by convention.
- Each key is limited to sixty requests a minute.
- A write held for confirmation stays in a queue the person can see, confirm or discard, until it is resolved.
- Hosting and the database are **not chosen here**. The Owner's direction is AWS at about $10 a month with
  infrastructure as code only (decisions D-014, D-015). The Dev Lead writes the architecture as ADRs that the
  Owner approves before dependent work starts (D-022). There is no data-residency requirement (D-012).

**API contracts (summary)**
- One operation per capability, grouped as: account and settings, standing notes, session notes, exercise cues, exercises, sessions and sets,
  coaching (before, during, after), plan, programs, goals, habits, benchmarks, metrics and aches, body
  readings, food, insights, activity and undo, away periods, gyms, and support and reports.
- Every write returns an event reference and an undo handle. Every set write returns a say line and the
  next set.
- Error contract: invalid (400), unauthenticated (401), consent or ownership refusal (403), not found
  (404), conflict (409), too large (413), too many rows (422), rate limit (429), held for confirmation (202).

**Data (conceptual)**
- Core entities: person, key, session, set, exercise, gym, plan, planned day, program, goal, habit, tick,
  benchmark and result, metric and reading, body reading and device, meal and saved meal, ache, away
  period, standing note, session note, exercise cue, insight, event, consent record, report.
- The event log is the source for the activity feed, undo and attribution.

**Interface decisions**
- Dashboard areas: Today, Training (sessions, progress, exercises), Food, Body, Goals, and a Tools group
  (agents, insights, settings, activity). A phone gets a floating tab bar and an account sheet.
- Identity is Rung's own: its own name, wording and visual design.
- The Design Agent starts from the 29 redrawn desktop boards in `docs/product/shredpace/prototype/` for
  layout and structure only, redraws them in Rung's identity with one design that follows the
  device's light or dark mode, and submits them to the Owner for approval one area at a time (Today,
  Session, Plan, Food, Body, Goals, Progress, Settings).
- The starter exercise catalogue is written for Rung: about 60 common lifts, kept in a JSON seed file
  we own.

## Testing Decisions

- **A good test checks external behaviour only:** given these inputs, the module returns this output. It
  never asserts on how the result was reached or on internal structure.
- **The rule modules are tested exhaustively with table-driven cases.** The research documents give
  concrete examples that serve as ready-made cases: sets of 30×4, 20×8 and 20×4 on a five-to-ten range
  give 20 kg next; four sessions a week at 2,200 kcal give 2,300 and 2,100; 80 kg for 8 estimates about
  101 kg.
- **Modules to test, all of them pure:** progression engine, load calculator, set sanity checker, readiness
  adjuster, plan engine, goal tracker, nutrition calculator, body readings normaliser, insight rules,
  habit and streak rules.
- **Modules to test through their public behaviour:** consent gate (every health read and write with and
  without consent, and deletion on withdrawal), event log and undo (undo restores, one undo reverses a
  multi-day plan move, undo is refused after changes), idempotency, the held-for-confirmation flow, and
  owner-only refusals for agent keys.
- **Contract tests:** each operation's request and response shape, every documented error, and that the REST
  route, MCP tool and API description agree.
- **Conversation tests:** the say line for each write; that nothing mid-session returns a table.
- **Visual tests** use the existing screenshot directory: each dashboard screen in its empty and populated
  states, on phone and desktop, in light and dark.
- **Prior art:** there is no code yet. The nearest reference is the publisher's own documented behaviour
  (see Further Notes), used as the specification for expected results, not as code to copy.

## Out of Scope

- **Billing and plans.** No Stripe, no free-versus-paid gating, no early-access messaging. Every feature is on for
  every account (D-006).
- **ShredPace's brand, name, wording, assets and visual design**, and its design canvas. Behaviour is cloned;
  identity is not (D-006). The API is Rung's own (D-013).
- **Features ShredPace does not have:** native mobile apps (a PWA is planned instead, D-019), push notifications,
  email reminders, badges and public streaks, wearable or health-platform sync, a built-in AI coach or any model
  inside the product, social features and sharing a profile, languages other than English, and diagnosis,
  treatment advice or any medical claim.

### Later phases, not out of scope

These are part of the destination (D-006) but are not in Phase 1: one-click OAuth connectors (the first item of
Phase 2, D-011), the custom-GPT operation subset, a public documentation site, seven themes, CSV export, an
installable PWA with phone layouts, pounds and miles, "fix it by hand" (story 150), sign-up and the public landing
page, Continue with Google, emailed password reset, the Terms and Privacy pages, and the consent wording, which is
written with the first health-data feature (D-021). Endurance, skill ladders and typical ranges are built in full in
later phases.

## Further Notes

### Assumptions

The tiers "cloned in full", "built in reduced form" and "not in v1" no longer apply: every ShredPace feature is in the
destination except billing and its brand (D-006). The assumptions that remain:

- **Own identity.** Rung uses its own name, wording, design and API. This is not a restriction on features:
  reproducing another product's behaviour is ordinary; reproducing its brand, copy and visual identity is where
  legal risk lies.
- **Everything is free.** With billing out of scope, no feature is gated.
- **The tests listed above are wanted.** All pure rule modules are covered.
- **Hosting and stack** are the Dev Lead's ADRs for the Owner's approval, within the constraints in
  `docs/product/requirements.md`.

### Decisions

Every decision, with its reason and status, is in `docs/product/decision-log.md`. Vocabulary is in `GLOSSARY.md`
and the hard-to-reverse decisions are in `docs/adr/`. This PRD does not repeat them.

### Where this came from

The behaviour above is drawn from `docs/product/shredpace/`: the feature inventory, the product rules and
limits, the release timeline and the signed-in observations. The product being copied is about 46 days old
and changes quickly, so details here are accurate as of 2026-11-18.

### Known weak spots in the source material

- The publisher's own sources give three stall rules (five sessions in the interface, four sessions with
  rising effort in the agent guide, "no better set in three weeks" in a plan comparison). Decided: the
  four-session rule (decision-log I-02).
- Only empty and first-run dashboard screens were observed. Populated screens, the free-plan locked
  screens and the other themes are not backed by observation.
- The "147 boards" figure that prompted part of this research is unresolved; it almost certainly counts the
  source product's design canvas, which is not public.

### Open questions

Open questions are tracked in `docs/product/requirements.md` (section 9) and the decision log, not here. Settled
since this PRD was first drafted: the product name (Rung, D-018), who it is for (the Owner, D-005), one account or
many (D-003), the stall rule, the legal text (D-021) and data residency (D-012).
