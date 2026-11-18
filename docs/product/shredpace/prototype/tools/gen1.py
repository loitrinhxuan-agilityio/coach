import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "project") + "/"
def write(name, html): open(OUT+name+".dc.html","w",encoding="utf-8").write(html)
FOOT = "Redrawn from the live dashboard on 18 Nov 2026 (Studio, light). Layout, labels and copy were observed; the body figure is a placeholder for the real anatomical illustration, tile tints are approximate, and the figures are sample data."

def head(title_html, right_extra=''):
    return f'''<div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 16px">{title_html}<div style="display: flex; gap: 12px; align-items: center; min-height: 44px"><span style="font-size: 11.5px; color: #67676b">Wed, Nov 18, 2026</span><span class="av">S</span></div></div>'''
def banner(title, text, right='', icon='◦'):
    return f'''<div class="panel" style="padding: 14px 16px; display: flex; gap: 14px; align-items: flex-start"><span style="width: 28px; height: 28px; border-radius: 999px; border: 1px solid #ececea; display: grid; place-items: center; flex: 0 0 auto; font-size: 13px; color: #67676b" aria-hidden="true">{icon}</span><div style="flex: 1; min-width: 0"><div style="display: flex; justify-content: space-between; gap: 12px"><strong style="font-size: 13.5px">{title}</strong>{right}</div><div style="font-size: 12.5px; color: #67676b; line-height: 1.5; margin-top: 4px">{text}</div></div></div>'''
def tile2(name, big, sub, tint='', extra='', href='ProProgress.dc.html'):
    return f'<a class="tile {tint}" href="{href}"><b>{name}</b><span class="big">{big}</span><span class="sub">{sub}</span>{extra}</a>'

# ---------------- Today ----------------
today_main = head('<div><p class="mut" style="font-size: 15px">Hello,</p><h1 style="font-size: 34px; margin-top: 2px">Sam.</h1><p class="mut" style="font-size: 13px; margin-top: 6px">Here’s your training today.</p></div>') + f'''
    <div style="display: flex; flex-wrap: wrap; gap: 20px; align-items: flex-start">
      <div class="panel" style="flex: 0 0 236px; box-sizing: border-box; padding: 14px; display: flex; flex-direction: column; align-items: center; gap: 8px">
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%"><span class="lbl">Drag to turn</span><span class="seg"><button type="button" class="on">Front</button><button type="button">Back</button></span></div>
        {figure(True)}
        <p style="font-size: 11.5px; color: #67676b; text-align: center; line-height: 1.5">Quads · 3 sets · Wednesday<br>Fewer sets ↔ More<br>Tracked by your agent, set by set.</p>
      </div>
      <div style="flex: 1 1 520px; min-width: 0; display: flex; flex-direction: column; gap: 12px">
        {banner("Week 1: finding your weights", "For each lift, warm up, then work up until a set of 10 feels like 2–3 reps were left (RPE 7). Log that set. Next week’s targets come from it.<br><strong style='color:#141416'>Effort, in one line</strong> RPE 10 = nothing left · 9 = one more rep · 8 = two more · 7 = three more.", '', '▣')}
        {banner("Claude changed 4 things today", "Logged 4 sets in Leg workout · 18:02", '<a href="ActivityHistory.dc.html" style="font-size: 12px; font-weight: 600; text-decoration: none; color: #141416; white-space: nowrap">What changed ›</a>', '✦')}
        <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px">
          {tile2("This week","1","of 4 sessions",'g','<span class="chip ok" style="align-self: flex-start; margin-top: 4px">On plan</span><span class="sub" style="margin-top: 6px">Legs today · Upper A Thu</span>','SessionsDesktop.dc.html')}
          {tile2("Volume","2.1","tonnes this week",'o','<span class="sub" style="margin-top: 6px">Mon–Sun</span>')}
          {tile2("Strength","100","kg · Back Squat, best set",'','','Exercises.dc.html')}
          {tile2("New bests","0","this week",'','')}
          {tile2("Streak","1","weeks in a row",'p','<span class="sub" style="margin-top: 6px">Your best</span>')}
          {tile2("Time trained","0:11","hours this week",'','','SessionsDesktop.dc.html')}
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 12px">
          <div class="panel" style="flex: 2 1 320px; min-width: 0; padding: 14px 16px">
            <p class="lbl">Today’s timeline</p>
            <div style="display: flex; justify-content: space-between; font-size: 10.5px; color: #67676b; margin: 10px 0 4px"><span>6:00</span><span>9:00</span><span>12:00</span><span>15:00</span><span>18:00</span><span>21:00</span></div>
            <div style="height: 6px; border-radius: 999px; background: #ececea; position: relative"><span style="position: absolute; left: 80%; width: 6%; top: 0; height: 6px; border-radius: 999px; background: #141416"></span></div>
            <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 12px; font-size: 12.5px">
              <div style="display: flex; justify-content: space-between; gap: 10px"><span><strong>Leg workout</strong> <span class="mut">18:02 – now · 4 sets</span></span><span class="chip live">In progress</span></div>
              <div style="display: flex; justify-content: space-between; gap: 10px"><span><strong>Chicken rice bowl</strong> <span class="mut">18:10 · 650 kcal</span></span><span class="chip">Logged</span></div>
            </div>
          </div>
          <a class="panel" href="ProCoach.dc.html" style="flex: 1 1 200px; min-width: 0; padding: 14px 16px; text-decoration: none; color: #141416"><p class="lbl">Recent insights</p><p style="font-size: 12.5px; color: #67676b; margin-top: 10px; line-height: 1.5">Nothing new from your coach this week.</p></a>
        </div>
      </div>
    </div>'''
write("TodayDesktop", page("TodayDesktop","Today","Today",today_main,900,FOOT))

# ---------------- Sessions ----------------
sess_main = head('<div><h1 style="font-size: 30px">Training</h1><div style="margin-top: 12px">'+seg(TRAIN,"Sessions")+'</div></div>') + '''
    <div style="display: flex; flex-wrap: wrap; gap: 20px; align-items: flex-start">
      <div style="flex: 1 1 440px; min-width: 0; display: flex; flex-direction: column; gap: 12px">
        <span class="seg" style="align-self: flex-start"><button type="button" class="on">All</button><button type="button">Strength</button><button type="button">Cardio</button><button type="button">Outdoors</button></span>
        <p class="lbl">This week · 2 sessions</p>
        <div class="panel" style="padding: 4px 16px">
          <a class="row" href="TodayDesktop.dc.html"><span style="display: flex; gap: 14px; align-items: center"><span style="text-align: center; min-width: 34px"><strong style="font-size: 18px; display: block">18</strong><span class="lbl">Wed</span></span><span><strong>Leg workout</strong> <span class="chip live" style="margin-left: 6px">In progress</span><small>18:02 – now</small></span></span><span class="ch" style="text-align: right">4 sets<br>2.1k kg</span></a>
          <a class="row" href="SessionDetail.dc.html"><span style="display: flex; gap: 14px; align-items: center"><span style="text-align: center; min-width: 34px"><strong style="font-size: 18px; display: block">17</strong><span class="lbl">Tue</span></span><span><strong>Full Body A</strong><small>Full Body</small></span></span><span class="ch">1 min</span></a>
        </div>
      </div>
      <div style="flex: 1 1 300px; min-width: 0; display: flex; flex-direction: column; gap: 12px">
        <div class="panel" style="padding: 16px"><p class="lbl">Last 7 days, every activity</p><p style="margin-top: 10px; font-size: 22px; font-weight: 600">2 <span class="mut" style="font-size: 12.5px; font-weight: 400">sessions · 11 min in all</span></p><p class="mut" style="font-size: 12px; margin-top: 6px">Strength 10 min</p></div>
        <div class="panel" style="padding: 16px"><div style="display: flex; justify-content: space-between"><p class="lbl">Your plan this week</p><a href="PlanPage.dc.html" style="font-size: 12px; text-decoration: none">Plan ›</a></div><p style="margin-top: 8px; font-size: 22px; font-weight: 600">1 <span class="mut" style="font-size: 12.5px; font-weight: 400">of 4</span></p>
          <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 10px; font-size: 12.5px"><span>✓ Full Body A</span><span><strong>Legs</strong> <span class="mut">· today</span></span><span class="mut">Full Body B · Thu</span><span class="mut">Full Body C</span></div></div>
        <div class="panel" style="padding: 16px"><p class="lbl">Last 4 weeks</p><p class="mut" style="font-size: 12px; margin-top: 4px">Minutes, every activity</p>
          <div style="display: flex; gap: 14px; align-items: flex-end; height: 70px; margin-top: 10px">
            <div style="flex: 1; text-align: center"><div style="height: 2px; background: #e6e0d9"></div><span class="mut" style="font-size: 10.5px">19 Oct</span></div><div style="flex: 1; text-align: center"><div style="height: 2px; background: #e6e0d9"></div><span class="mut" style="font-size: 10.5px">26 Oct</span></div><div style="flex: 1; text-align: center"><div style="height: 2px; background: #e6e0d9"></div><span class="mut" style="font-size: 10.5px">2 Nov</span></div><div style="flex: 1; text-align: center"><div style="height: 2px; background: #e6e0d9"></div><span class="mut" style="font-size: 10.5px">9 Nov</span></div>
          </div></div>
      </div>
    </div>'''
write("SessionsDesktop", page("SessionsDesktop","Sessions","Training",sess_main,900,FOOT))

# ---------------- Progress ----------------
prog_main = head('<div><h1 style="font-size: 30px">Training</h1><div style="margin-top: 12px">'+seg(TRAIN,"Progress")+'</div></div>') + '''
    <p class="mut" style="font-size: 13px">Since you started · 17 Nov (1 week)</p>
    <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px">
      <div class="tile"><b>Workouts</b><span class="big">2</span></div><div class="tile"><b>Lifted</b><span class="big">2.1 <span style="font-size: 14px; font-weight: 500">t</span></span></div><div class="tile"><b>Weeks trained</b><span class="big">1 <span class="mut" style="font-size: 14px; font-weight: 500">of 1</span></span></div>
    </div>
    <div style="display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-start">
      <div class="panel" style="flex: 1 1 380px; min-width: 0; padding: 18px"><div style="display: flex; justify-content: space-between; align-items: baseline"><p class="lbl">First marks</p><span class="chip">2 new lifts</span></div>
        <h2 style="font-size: 17px; margin-top: 10px">Your first marks</h2><p class="mut" style="font-size: 12.5px; margin-top: 4px; line-height: 1.5">Today’s best set of each lift. Next time is measured against these.</p>
        <table style="margin-top: 8px"><tbody><tr><td><strong>Back Squat</strong></td><td>100 × 5</td><td class="mut">e1RM 117</td></tr><tr><td><strong>Romanian Deadlift</strong></td><td>80 × 8</td><td class="mut">e1RM 101</td></tr></tbody></table>
        <p class="mut" style="font-size: 12px; margin-top: 10px">The chart and its % start with a second week.</p></div>
      <div style="flex: 1 1 300px; min-width: 0; display: flex; flex-direction: column; gap: 12px">
        <div class="panel" style="padding: 16px"><p class="lbl">What you trained</p><p style="margin-top: 8px; font-size: 14px"><strong>Legs · Wed 18 Nov</strong> <span class="mut">Last workout</span></p><p class="mut" style="font-size: 12px; margin-top: 4px">Since 17 Nov</p><p style="font-size: 12.5px; margin-top: 8px; line-height: 1.5">So far: glutes, quads, hamstrings and adductor magnus.</p></div>
        <div class="panel" style="padding: 16px"><p class="lbl">Bests <span style="text-transform: none; letter-spacing: 0; font-weight: 400">since you started</span></p>
          <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 10px; font-size: 13px"><div style="display: flex; justify-content: space-between"><span><strong>Back Squat</strong><br><span class="mut" style="font-size: 11.5px">Wed 18 Nov 2026</span></span><strong>117 kg e1RM</strong></div><div style="display: flex; justify-content: space-between"><span><strong>Romanian Deadlift</strong><br><span class="mut" style="font-size: 11.5px">Wed 18 Nov 2026</span></span><strong>101 kg e1RM</strong></div></div></div>
      </div>
    </div>
    <div class="panel" style="padding: 16px 18px"><p class="lbl">Your year <span style="text-transform: none; letter-spacing: 0; font-weight: 400">one square a week · dashed: before you started · faint: still to come</span></p>
      <div style="display: flex; gap: 4px; margin-top: 10px; align-items: center"><span style="width: 14px; height: 14px; border-radius: 4px; background: #141416"></span><span style="width: 14px; height: 14px; border-radius: 4px; border: 1px dashed #c9c9c4"></span><span style="width: 14px; height: 14px; border-radius: 4px; border: 1px dashed #c9c9c4"></span><span style="width: 14px; height: 14px; border-radius: 4px; background: #ececea"></span><span style="width: 14px; height: 14px; border-radius: 4px; background: #ececea"></span></div>
      <p class="mut" style="font-size: 12px; margin-top: 10px">1 of 1 weeks trained · 2 workouts a week · Longest streak 1 wk</p></div>'''
write("ProProgress", page("ProProgress","Progress","Training",prog_main,900,FOOT))

# ---------------- Exercises ----------------
ex_names = [("Ab Wheel Rollout","Other · 8–15"),("Arnold Press","Dumbbell · 8–12"),("Assault Bike","Cardio machine · time"),("Assisted Pull-Up","Machine · 6–10"),("Back Extension","Bodyweight · 10–15"),("Back Squat","Barbell · 5–8"),("Band Pull-Up","Bodyweight · 5–10"),("Barbell Curl","Barbell · 8–12"),("Barbell Row","Barbell · 6–10"),("Bench Press","Barbell · 5–8"),("Bulgarian Split Squat","Dumbbell · 8–12"),("Cable Crossover","Cable · 10–15")]
rows = ''.join(f'<a class="row" href="Exercises.dc.html" style="padding: 10px 14px;{" background: #ececea; border-radius: 10px;" if n=="Back Squat" else ""}"><span><strong style="font-size: 13px">{n}</strong><small>{m}</small></span></a>' for n,m in ex_names)
ex_main = head('<div><h1 style="font-size: 30px">Training</h1><div style="margin-top: 12px">'+seg(TRAIN,"Exercises")+'</div></div>') + f'''
    <div style="display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-start">
      <div class="panel" style="flex: 0 1 300px; min-width: 240px; padding: 6px"><div style="display: flex; padding: 8px 14px 4px"><span class="lbl">Main muscle</span><span class="lbl" style="margin-left: auto">Also works</span></div>{rows}</div>
      <div class="panel" style="flex: 1 1 400px; min-width: 0; padding: 20px; display: flex; flex-direction: column; gap: 14px">
        <div><span class="chip">Barbell · starter exercise</span><h2 style="font-size: 24px; margin-top: 10px">Back Squat</h2><p class="mut" style="font-size: 12px; margin-top: 4px">Movement demo: coming soon</p></div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; font-size: 13px">
          <div><p class="lbl">Main muscle</p><p style="margin-top: 4px">quads, glutes</p></div><div><p class="lbl">Also works</p><p style="margin-top: 4px">adductor magnus, adductors, lower back</p></div>
          <div><p class="lbl">Rep range</p><p style="margin-top: 4px">5–8 <span class="mut">· your setting</span></p></div><div><p class="lbl">Increment</p><p style="margin-top: 4px">2.5 kg</p></div>
        </div>
        <div style="border-top: 1px solid #ececea; padding-top: 12px"><p class="lbl">Loaded as <span style="text-transform: none; letter-spacing: 0; font-weight: 400">sets the label and the maths</span></p><p style="font-size: 12.5px; margin-top: 6px">Barbell: log the total, the bar included.</p><span class="seg" style="margin-top: 8px"><button type="button" class="on">Bar</button><button type="button">Smith machine</button></span></div>
        <div style="border-top: 1px solid #ececea; padding-top: 12px"><p class="lbl">Your progress</p><p class="mut" style="font-size: 12px; margin-top: 4px">estimated 1RM · 1 session</p><p style="font-size: 26px; font-weight: 600; margin-top: 4px">117 <span style="font-size: 14px; font-weight: 500">kg</span></p></div>
        <div style="border-top: 1px solid #ececea; padding-top: 12px"><p class="lbl">Notes from your trainer</p><p class="mut" style="font-size: 12.5px; margin-top: 4px">No notes yet. Ask your agent to add some.</p></div>
        {say("Change how Back Squat is loaded")}
      </div>
    </div>'''
write("Exercises", page("Exercises","Exercises","Training",ex_main,900,FOOT))

# ---------------- Plan ----------------
days=[("Mon","–",""),("Tue","✓",""),("Wed","Legs","on"),("Thu","Upper A",""),("Fri","–",""),("Sat","Lower B",""),("Sun","–","")]
strip=''.join(f'<div style="flex: 1; min-width: 0; text-align: center; padding: 10px 4px; border-radius: 12px; border: 1px solid {"#141416" if o else "#ececea"}; background: {"#ffffff" if o else "#fbfbfa"}"><span class="lbl" style="display: block; margin-bottom: 6px">{d}</span><span style="font-size: 12.5px; font-weight: 600">{v}</span></div>' for d,v,o in days)
plan_main = head('<div><h1 style="font-size: 30px">Coach</h1><div style="margin-top: 12px">'+seg(COACHT,"Plan")+'</div></div>') + f'''
    <div style="display: flex; flex-wrap: wrap; gap: 16px">
      <div class="panel" style="flex: 1 1 320px; min-width: 0; padding: 20px"><p class="lbl">Focus</p><h2 style="font-size: 20px; margin-top: 8px">Not set yet</h2><p class="mut" style="font-size: 12.5px; margin-top: 8px; line-height: 1.55">Pick what you’re training for, and your goals, program and food targets follow from it.</p><p class="mut" style="font-size: 12.5px; margin-top: 8px; line-height: 1.55">Or tell your agent: “set up my plan”. It asks the same four things.</p></div>
      <div class="panel" style="flex: 1 1 320px; min-width: 0; padding: 20px"><div style="display: flex; justify-content: space-between"><p class="lbl">Training</p><a href="PlanSetup.dc.html" style="font-size: 12px; text-decoration: none">Change ›</a></div><h2 style="font-size: 20px; margin-top: 8px">4 days a week</h2><p class="mut" style="font-size: 12.5px; margin-top: 6px">4 lifting days · no cardio</p><p style="font-size: 12.5px; margin-top: 8px; line-height: 1.5">Program: Upper/Lower Muscle Builder, week 1 of 8 · Accumulation block · <a href="ProPrograms.dc.html">Program ›</a></p></div>
    </div>
    <div class="panel" style="padding: 18px 20px"><p class="lbl">This week · 1 of 4 done</p><div style="display: flex; gap: 8px; margin-top: 12px">{strip}</div></div>
    <div style="display: flex; flex-direction: column; gap: 8px"><p class="lbl">Tell Claude</p>{say("Set up my plan: ask me what you need")}</div>
    <a href="Endurance.dc.html" style="font-size: 13px; text-decoration: none; min-height: 44px; display: flex; align-items: center">Your zones › <span class="mut" style="margin-left: 8px">run, ride and swim, from a test</span></a>'''
write("PlanPage", page("PlanPage","Your plan","Coach",plan_main,900,FOOT))

# ---------------- Program ----------------
wk=''.join(f'<div style="flex: 1; text-align: center"><span class="lbl" style="display: block; margin-bottom: 6px">{d}</span><span style="display: block; height: 28px; border-radius: 8px; {"background: #141416;" if i==1 else "border: 1px dashed #c9c9c4;"}"></span></div>' for i,d in enumerate(["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]))
progm_main = head('<div><h1 style="font-size: 30px">Coach</h1><div style="margin-top: 12px">'+seg(COACHT,"Plan")+'</div></div>') + f'''
    <div class="panel" style="padding: 22px; display: flex; flex-direction: column; gap: 14px">
      <p class="lbl">Current program · written by your coach</p>
      <h2 style="font-size: 26px">Upper/Lower Muscle Builder</h2>
      <div style="display: flex; gap: 40px"><div><p class="lbl">Week</p><p style="font-size: 24px; font-weight: 600; margin-top: 4px">1 <span class="mut" style="font-size: 14px">/ 8</span></p></div><div><p class="lbl">Stuck to it</p><p style="font-size: 24px; font-weight: 600; margin-top: 4px">—</p></div></div>
      <div style="display: flex; flex-direction: column; gap: 6px; font-size: 12.5px; line-height: 1.5"><span><strong>Accumulation</strong> wk 1–3 · Moderate weights, 2 reps in reserve, build volume</span><span><strong>Build</strong> wk 4–7 · Double progression: hit the top of the rep range on all sets, then add weight; 1–2 reps in reserve</span><span><strong>Deload</strong> wk 8 · About half the sets, lighter weights to recover</span></div>
      <div><p class="lbl" style="margin-bottom: 8px">Week 1</p><div style="display: flex; gap: 8px">{wk}</div><p class="mut" style="font-size: 11.5px; margin-top: 10px">● Done as planned · ◐ Done, changed · ✕ Missed · ○ Planned</p></div>
    </div>
    <div style="display: flex; flex-wrap: wrap; gap: 16px">
      <div class="panel" style="flex: 1 1 280px; min-width: 0; padding: 18px"><p class="lbl">Your goals</p><p class="mut" style="font-size: 12.5px; margin-top: 8px; line-height: 1.5">No goals yet. Tell your agent what you’re after, and it sets the goal.</p></div>
      <div class="panel" style="flex: 1 1 280px; min-width: 0; padding: 18px"><p class="lbl">Programs <span style="text-transform: none; letter-spacing: 0; font-weight: 400">Ask your coach for a new one</span></p>
        <div style="margin-top: 6px"><div class="row" style="padding: 10px 0"><span><strong>Upper/Lower Muscle Builder</strong><small>8 weeks · current · Week 1</small></span></div><div class="row" style="padding: 10px 0"><span><strong>Beginner Full-Body Muscle</strong><small>1 week · Nov 2026</small></span><strong>100%</strong></div></div></div>
    </div>
    <div class="panel" style="padding: 18px"><p class="lbl">Runs, rides and swims</p><p style="font-size: 12.5px; margin-top: 8px; line-height: 1.5">Send your agent a GPX, FIT or a screenshot from Strava or Garmin; it logs the run.</p></div>'''
write("ProPrograms", page("ProPrograms","Program","Coach",progm_main,900,FOOT))

# ---------------- Coach ----------------
coach_main = head('<div><h1 style="font-size: 30px">Coach</h1><div style="margin-top: 12px">'+seg(COACHT,"Coach")+'</div></div>') + '''
    <p class="mut" style="font-size: 12.5px">Wednesday 18 November · your coach worked overnight</p>
    <div class="panel" style="padding: 22px"><h2 style="font-size: 22px">Nothing to change this week</h2><p class="mut" style="font-size: 13px; margin-top: 8px; line-height: 1.55; max-width: 62ch">Nothing flagged yet. The checks need some history: a stall after 5 sessions of a lift, your load after 2 weeks.</p></div>
    <div style="display: flex; flex-wrap: wrap; gap: 16px">
      <div class="panel" style="flex: 1 1 320px; min-width: 0; padding: 20px"><p class="lbl">Load and recovery</p><p style="font-size: 26px; font-weight: 600; margin-top: 8px">—</p><p class="mut" style="font-size: 12px; margin-top: 2px">Not enough history yet</p>
        <div style="display: flex; margin-top: 12px; font-size: 10.5px; font-weight: 600; text-align: center"><span style="flex: 1; padding: 6px 0; background: #ececea; border-radius: 8px 0 0 8px">Detraining</span><span style="flex: 1; padding: 6px 0; background: #dcefe1">Building</span><span style="flex: 1; padding: 6px 0; background: #f7e8de">Pushing</span><span style="flex: 1; padding: 6px 0; background: #f8e5e5; border-radius: 0 8px 8px 0">Risky</span></div>
        <p class="mut" style="font-size: 11.5px; margin-top: 10px; line-height: 1.5">Shows after two weeks of training: this week’s load against your 4-week average, counting lifting volume, running distance and session time together.</p></div>
      <div class="panel" style="flex: 1 1 320px; min-width: 0; padding: 20px"><p class="lbl">Last week’s recap</p><p class="mut" style="font-size: 12px; margin-top: 6px">your agent reads it when it checks in · email coming soon</p><p style="font-size: 22px; font-weight: 600; margin-top: 10px">0 <span class="mut" style="font-size: 13px; font-weight: 400">of 4 sessions</span></p><p class="mut" style="font-size: 12px; margin-top: 10px">Share recap card · coming soon</p></div>
    </div>
    <div class="panel" style="padding: 6px 20px"><p class="lbl" style="padding-top: 14px">How your coach checks in</p>
      <div class="row"><span>Morning plan check</span><button type="button" class="sw" style="background: #141416" aria-label="On"><i style="right: 3px"></i></button></div>
      <div class="row"><span>Weekly recap on Monday</span><button type="button" class="sw" style="background: #141416" aria-label="On"><i style="right: 3px"></i></button></div>
      <div class="row"><span>Tell me about stalls and imbalances</span><button type="button" class="sw" style="background: #141416" aria-label="On"><i style="right: 3px"></i></button></div></div>
    ''' + say("Stop the morning plan check")
write("ProCoach", page("ProCoach","Coach","Coach",coach_main,900,FOOT))

# ---------------- Food ----------------
food_main = head('<div><h1 style="font-size: 30px">Food</h1><p class="mut" style="font-size: 13px; margin-top: 6px">Wednesday 18 November · training day</p></div>') + f'''
    <div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center; justify-content: space-between"><span class="seg"><a href="FoodDesktop.dc.html">‹ Tue 17 Nov</a><a class="on" href="FoodDesktop.dc.html">Today</a></span><a href="NutritionSettings.dc.html" style="font-size: 13px; font-weight: 600; text-decoration: none; color: #141416; min-height: 44px; display: inline-flex; align-items: center">Set a goal ›</a></div>
    <div style="display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-start">
      <div class="panel" style="flex: 1 1 300px; min-width: 0; padding: 20px"><p class="lbl">Your daily targets</p><p style="font-size: 30px; font-weight: 600; margin-top: 8px">— <span class="mut" style="font-size: 14px; font-weight: 500">kcal</span></p><p class="mut" style="font-size: 12.5px; margin-top: 8px; line-height: 1.55">Your targets are worked out from it: calories first to lose fat, protein first to build muscle, a band to maintain, carbs around training to perform.</p><div style="margin-top: 12px">{say("Set my goal: lose fat, about 0.5 kg a week")}</div></div>
      <div style="flex: 1 1 300px; min-width: 0; display: flex; flex-direction: column; gap: 10px"><p class="lbl">Tell Claude</p>{say("Ask me my protein target")}
        <div class="panel" style="padding: 16px; margin-top: 6px"><p class="lbl">Bodyweight</p><p class="mut" style="font-size: 12.5px; margin-top: 8px; line-height: 1.55">No weigh-ins yet. Tell your agent your weight in the morning, before eating: the trend shows after a few.</p></div></div>
    </div>
    <div class="panel" style="padding: 18px 20px"><p class="lbl">Meals <span style="text-transform: none; letter-spacing: 0; font-weight: 400">click to correct · logged by your agent</span></p>
      <table style="margin-top: 6px"><thead><tr><th>Time</th><th>Meal</th><th>kcal</th><th>Protein</th><th>Carbs</th><th>Fat</th><th>Source</th></tr></thead><tbody><tr><td>18:10</td><td><strong>Chicken rice bowl</strong></td><td>650</td><td>35 g</td><td>80 g</td><td>21 g</td><td class="mut">you said</td></tr></tbody></table></div>
    <div class="panel" style="padding: 16px 20px"><p class="lbl">Last 14 days</p><p style="font-size: 13px; margin-top: 8px"><strong>average 650 kcal · 35 g protein</strong></p><p class="mut" style="font-size: 12.5px; margin-top: 4px">Set a goal to see your days against a target.</p></div>'''
write("FoodDesktop", page("FoodDesktop","Food","Food",food_main,900,FOOT))

# ---------------- Body ----------------
def mt(name,val,sub): return f'<a class="tile" href="BodyHistory.dc.html"><b>{name}</b><span class="big" style="font-size: {"26px" if val!="—" else "26px"}">{val}</span><span class="sub">{sub}</span></a>'
body_main = head('<div><h1 style="font-size: 30px">Body</h1></div>') + f'''
    <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px">
      {mt("Weight","82.3 kg","7-day average 82.3 kg<br>Latest Wed 18 Nov")}{mt("Body fat","—","not logged yet")}{mt("Muscle","—","not logged yet")}
      {mt("Waist","—","not logged yet")}{mt("Visceral","—","not logged yet")}{mt("BMR","—","not logged yet")}
    </div>
    <p class="mut" style="font-size: 12px">Each tile is its metric’s latest value, its change under it; an older one carries its date.</p>
    <div style="display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-start">
      <div class="panel" style="flex: 1 1 300px; min-width: 0; padding: 18px"><div style="display: flex; justify-content: space-between"><p class="lbl">Goals</p><a href="GoalsDesktop.dc.html" style="font-size: 12px; text-decoration: none">All goals ›</a></div><p class="mut" style="font-size: 12.5px; margin-top: 8px; line-height: 1.5">No goals on these numbers yet. Tell your agent one (“body fat down 3 points by February”), or add one in Goals.</p></div>
      <div class="panel" style="flex: 1 1 300px; min-width: 0; padding: 18px"><p class="lbl">Every reading</p><p class="mut" style="font-size: 12px; margin-top: 4px">latest reading, 18 Nov · change since 18 Nov</p><div class="row" style="margin-top: 6px"><strong>Weight</strong><span>82.3 kg <span class="mut" style="margin-left: 8px">same</span></span></div></div>
    </div>
    <div class="panel" style="padding: 18px"><div style="display: flex; justify-content: space-between"><p class="lbl">Your metrics</p><a href="TrackAnything.dc.html" style="font-size: 12px; text-decoration: none">Add ›</a></div><p class="mut" style="font-size: 12.5px; margin-top: 8px">Resting heart rate, steps, grip: anything you track.</p><div style="margin-top: 10px">{say("Track my resting heart rate")}</div></div>'''
write("BodyDesktop", page("BodyDesktop","Body","Body",body_main,900,FOOT))

# ---------------- Goals ----------------
goals_main = head('<div><h1 style="font-size: 30px">Goals</h1><p class="mut" style="font-size: 13px; margin-top: 6px">No focus yet · <a href="PlanSetup.dc.html">Set up your plan ›</a></p></div>') + f'''
    <div class="panel" style="padding: 22px"><p class="lbl">Your goals</p><p style="font-size: 30px; font-weight: 600; margin-top: 8px">— <span class="mut" style="font-size: 14px; font-weight: 500">kg</span> <span class="mut" style="font-size: 14px; font-weight: 500; margin-left: 12px">—%</span></p><p class="mut" style="font-size: 12.5px; margin-top: 10px; line-height: 1.55; max-width: 60ch">A lift to hit, a pace, a body-fat number, or a guard that warns when strength slips. Pick a kind above, or tell Claude.</p><div style="margin-top: 12px">{say("Set a goal: body fat down 3 points by February")}</div></div>
    <div style="display: flex; flex-direction: column; gap: 8px"><p class="lbl">Tell Claude</p>{say("Add a goal")}</div>'''
write("GoalsDesktop", page("GoalsDesktop","Goals","Goals",goals_main,900,FOOT))
print("batch 1 written")
