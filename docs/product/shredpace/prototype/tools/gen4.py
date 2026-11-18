import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *
import gen1, gen2
from gen1 import head, banner, tile2, write, FOOT
from gen2 import crumbhead, srow, gl, chips, act

FOOT2 = "Redrawn from the live dashboard on 18 Nov 2026 after the account held real data (Studio, light). Labels, copy, structure and order were observed. The body figure is a placeholder for the real illustration, tile tints are approximate, and figures and times are sample data."
def T(label, val, sub='', big=True): return '<div class="tile"><b>'+label+'</b><span class="big">'+val+'</span><span class="sub">'+sub+'</span></div>'
def P(inner, pad=18, extra=''): return '<div class="panel" style="padding: %dpx; %s">%s</div>' % (pad, extra, inner)
def LBL(t): return '<p class="lbl">'+t+'</p>'

# ---------------- Today ----------------
recomp = banner("Recomp · week 1 of 12", "<strong style='color:#141416'>Early days.</strong> Weight 82.3 → 82.3 kg. Normal in the first weeks: more food around training and more water in the muscles. We judge a recomp from week 4, by your waist and your lifts. Waist: 84 cm · 18 Nov", '', '◎')
wk1 = banner("Week 1: finding your weights", "For each lift, warm up, then work up until a set of 6 feels like 2–3 reps were left (RPE 7). Log that set. Next week’s targets come from it.<br><strong style='color:#141416'>Effort, in one line</strong> RPE 10 = nothing left · 9 = one more rep · 8 = two more · 7 = three more.", '<span style="font-size: 12px; font-weight: 600; white-space: nowrap">Show 1 more ›</span>', '▣')
chg = banner("Claude changed 14 things today", "Added a body reading: Waist 84 cm · 12:06", '<a href="ActivityHistory.dc.html" style="font-size: 12px; font-weight: 600; text-decoration: none; color: #141416; white-space: nowrap">What changed ›</a>', '✦')
today_main = head('<div><p class="mut" style="font-size: 15px">Hello,</p><h1 style="font-size: 34px; margin-top: 2px">Sam.</h1><p class="mut" style="font-size: 13px; margin-top: 6px">Here’s your training today.</p></div>') + '''
    <div style="display: flex; flex-wrap: wrap; gap: 20px; align-items: flex-start">
      <div class="panel" style="flex: 0 0 236px; box-sizing: border-box; padding: 14px; display: flex; flex-direction: column; align-items: center; gap: 8px">
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%"><span class="lbl">Drag to turn</span><span class="seg"><button type="button" class="on">Front</button><button type="button">Back</button></span></div>
        ''' + figure(True) + '''
        <p style="font-size: 11.5px; color: #67676b; text-align: center; line-height: 1.5">Quads · 3 sets · Wednesday<br>Fewer sets ↔ More<br>Tracked by your agent, set by set.</p>
      </div>
      <div style="flex: 1 1 520px; min-width: 0; display: flex; flex-direction: column; gap: 10px">
        ''' + recomp + wk1 + chg + '''
        <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px">
          ''' + tile2("This week","2","of 4 sessions",'g','<span class="chip ok" style="align-self: flex-start; margin-top: 4px">On plan</span><span class="sub" style="margin-top: 6px">Upper A Thu · Lift Fri</span>','SessionsDesktop.dc.html') + tile2("Volume","2.1","tonnes this week",'o','<span class="sub" style="margin-top: 6px">Mon–Sun</span>') + tile2("Strength","100","kg · Back Squat, best set",'','','Exercises.dc.html') + '''
          ''' + tile2("New bests","0","this week",'','') + tile2("Streak","1","weeks in a row",'p','<span class="sub" style="margin-top: 6px">Your best</span>') + tile2("Time trained","0:39","hours this week",'','<span class="sub" style="margin-top: 6px">16% of 4 h</span>','SessionsDesktop.dc.html') + '''
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 12px">
          <div class="panel" style="flex: 2 1 320px; min-width: 0; padding: 14px 16px">
            <p class="lbl">Today’s timeline</p>
            <div style="display: flex; justify-content: space-between; font-size: 10.5px; color: #67676b; margin: 10px 0 4px"><span>6:00</span><span>9:00</span><span>12:00</span><span>15:00</span><span>18:00</span><span>21:00</span></div>
            <div style="height: 6px; border-radius: 999px; background: #ececea; position: relative"><span style="position: absolute; left: 60%; width: 9%; top: 0; height: 6px; border-radius: 999px; background: #141416"></span></div>
            <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 12px; font-size: 12.5px">
              <div style="display: flex; justify-content: space-between; gap: 10px"><span><strong>5 km run</strong> <span class="mut">17:05 – 17:32</span></span><span class="chip ok">Completed</span></div>
              <div style="display: flex; justify-content: space-between; gap: 10px"><span><strong>Leg workout</strong> <span class="mut">17:34 – now · 4 sets</span></span><span class="chip live">In progress</span></div>
              <div style="display: flex; justify-content: space-between; gap: 10px"><span><strong>Chicken rice bowl</strong> <span class="mut">17:42 · 650 kcal</span></span><span class="chip">Logged</span></div>
            </div>
          </div>
          <a class="panel" href="ProCoach.dc.html" style="flex: 1 1 200px; min-width: 0; padding: 14px 16px; text-decoration: none; color: #141416"><p class="lbl">Recent insights</p><p style="font-size: 12.5px; color: #67676b; margin-top: 10px; line-height: 1.5">Nothing new from your coach this week.</p></a>
        </div>
      </div>
    </div>'''
write("TodayDesktop", page("TodayDesktop","Today","Today",today_main,900,FOOT2))

# ---------------- Sessions ----------------
def srow2(day, dow, name, chip, sub, right):
    return '<a class="row" href="SessionDetail.dc.html"><span style="display: flex; gap: 14px; align-items: center"><span style="text-align: center; min-width: 34px"><strong style="font-size: 18px; display: block">'+day+'</strong><span class="lbl">'+dow+'</span></span><span><strong>'+name+'</strong> '+chip+'<small>'+sub+'</small></span></span><span class="ch" style="text-align: right">'+right+'</span></a>'
sess_main = head('<div><h1 style="font-size: 30px">Training</h1><div style="margin-top: 12px">'+seg(TRAIN,"Sessions")+'</div></div>') + '''
    <div style="display: flex; flex-wrap: wrap; gap: 20px; align-items: flex-start">
      <div style="flex: 1 1 440px; min-width: 0; display: flex; flex-direction: column; gap: 12px">
        <span class="seg" style="align-self: flex-start"><button type="button" class="on">All</button><button type="button">Strength</button><button type="button">Cardio</button><button type="button">Outdoors</button></span>
        <p class="lbl">This week · 3 sessions</p>
        <div class="panel" style="padding: 4px 16px">
          ''' + srow2("18","Wed","Leg workout",'<span class="chip live" style="margin-left: 6px">In progress</span>',"17:34 – now","4 sets<br>2.1k kg") + srow2("18","Wed","5 km run",'<span class="chip" style="margin-left: 6px">Run</span>',"","5.0 km · 27:40<br>5:32 /km") + srow2("17","Tue","Full Body A",'',"Full Body","1 min") + '''
        </div>
      </div>
      <div style="flex: 1 1 300px; min-width: 0; display: flex; flex-direction: column; gap: 12px">
        <div class="panel" style="padding: 16px"><p class="lbl">Last 7 days, every activity</p><p style="margin-top: 10px; font-size: 22px; font-weight: 600">3 <span class="mut" style="font-size: 12.5px; font-weight: 400">sessions · 39 min in all</span></p>
          <div style="display: flex; height: 8px; border-radius: 999px; overflow: hidden; margin-top: 10px"><span style="flex: 10; background: #2f7d45"></span><span style="flex: 28; background: #c2410c"></span></div><p class="mut" style="font-size: 12px; margin-top: 8px">Strength 10 min · Run 28 min</p></div>
        <div class="panel" style="padding: 16px"><div style="display: flex; justify-content: space-between"><p class="lbl">Your plan this week</p><a href="PlanPage.dc.html" style="font-size: 12px; text-decoration: none">Plan ›</a></div><p style="margin-top: 8px; font-size: 22px; font-weight: 600">2 <span class="mut" style="font-size: 12.5px; font-weight: 400">of 4</span></p>
          <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 10px; font-size: 12.5px"><span>✓ Full Body A</span><span>✓ 5 km run</span><span class="mut">Upper A · Thu</span><span class="mut">Lift · Fri</span></div></div>
        <div class="panel" style="padding: 16px"><p class="lbl">Last 4 weeks</p><p class="mut" style="font-size: 12px; margin-top: 4px">Minutes, every activity</p>
          <div style="display: flex; gap: 14px; align-items: flex-end; height: 70px; margin-top: 10px"><div style="flex: 1; text-align: center"><div style="height: 2px; background: #e6e0d9"></div><span class="mut" style="font-size: 10.5px">19 Oct</span></div><div style="flex: 1; text-align: center"><div style="height: 2px; background: #e6e0d9"></div><span class="mut" style="font-size: 10.5px">26 Oct</span></div><div style="flex: 1; text-align: center"><div style="height: 2px; background: #e6e0d9"></div><span class="mut" style="font-size: 10.5px">2 Nov</span></div><div style="flex: 1; text-align: center"><div style="height: 2px; background: #e6e0d9"></div><span class="mut" style="font-size: 10.5px">9 Nov</span></div></div></div>
      </div>
    </div>'''
write("SessionsDesktop", page("SessionsDesktop","Sessions","Training",sess_main,900,FOOT2))

# ---------------- Progress ----------------
def mini(name, val, sub): return '<div style="display: flex; justify-content: space-between; align-items: baseline; gap: 12px; padding: 10px 0; border-bottom: 1px solid #ececea"><span><strong style="font-size: 13px">'+name+'</strong><br><span class="mut" style="font-size: 11.5px">'+sub+'</span></span><strong style="font-size: 16px">'+val+'</strong></div>'
prog_main = head('<div><h1 style="font-size: 30px">Training</h1><div style="margin-top: 12px">'+seg(TRAIN,"Progress")+'</div></div>') + '''
    <p class="mut" style="font-size: 13px">Since you started · 17 Nov (1 week)</p>
    <div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px">
      ''' + T("Workouts","3") + T("Lifted","2.1 <span style='font-size:14px;font-weight:500'>t</span>") + T("Distance","5 <span style='font-size:14px;font-weight:500'>km</span>") + T("Weeks trained","1 <span class='mut' style='font-size:14px;font-weight:500'>of 1</span>") + '''
    </div>
    <div style="display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-start">
      <div class="panel" style="flex: 1 1 380px; min-width: 0; padding: 18px"><p class="lbl">Week 1 of 12 · Recomp</p><h2 style="font-size: 17px; margin-top: 8px">Early days</h2><p class="mut" style="font-size: 12.5px; margin-top: 4px; line-height: 1.5">Weight moves with water in the first weeks. We judge a recomp from week 4, by your waist and your lifts.</p>
        ''' + mini("Waist","84 cm","1 readings: a trend needs 3") + mini("Back Squat · e1RM","116.7 kg","Not enough sessions yet") + mini("Body fat · same scale","18%","1 scan: a trend needs 3") + '''
        <div style="padding-top: 12px"><p class="lbl">Weight</p><div style="display: flex; justify-content: space-between; font-size: 11.5px; color: #67676b; margin-top: 6px"><span>80.3</span><strong style="color: #141416">82.3 kg · steady, as it should be</strong><span>84.3</span></div><div style="height: 6px; border-radius: 999px; background: #ececea; margin-top: 6px; position: relative"><span style="position: absolute; left: 49%; top: -3px; width: 12px; height: 12px; border-radius: 999px; background: #141416"></span></div></div></div>
      <div style="flex: 1 1 300px; min-width: 0; display: flex; flex-direction: column; gap: 12px">
        <div class="panel" style="padding: 16px"><div style="display: flex; justify-content: space-between; align-items: center"><p class="lbl">Your lifts</p><span class="seg"><button type="button" class="on">Lifts</button><button type="button">Runs</button></span></div>
          <div style="margin-top: 8px"><p class="lbl">First marks · 2 new lifts</p><p class="mut" style="font-size: 12px; margin-top: 4px">Today’s best set of each lift. Next time is measured against these.</p>
          <table style="margin-top: 6px"><tbody><tr><td><strong>Back Squat</strong></td><td>100 × 5</td><td class="mut">e1RM 117</td></tr><tr><td><strong>Romanian Deadlift</strong></td><td>80 × 8</td><td class="mut">e1RM 101</td></tr></tbody></table><p class="mut" style="font-size: 11.5px; margin-top: 6px">The chart and its % start with a second week.</p></div></div>
        <div class="panel" style="padding: 16px"><p class="lbl">What you trained</p><p style="margin-top: 8px; font-size: 14px"><strong>Legs · Wed 18 Nov</strong> <span class="mut">Last workout</span></p><p style="font-size: 12.5px; margin-top: 6px; line-height: 1.5">So far: glutes, quads, hamstrings and adductor magnus.</p></div>
        <div class="panel" style="padding: 16px"><p class="lbl">Bests <span style="text-transform: none; letter-spacing: 0; font-weight: 400">since you started</span></p>
          ''' + mini("Back Squat","117 kg e1RM","Wed 18 Nov 2026") + mini("Romanian Deadlift","101 kg e1RM","Wed 18 Nov 2026") + mini("5 km run","27:40","Wed 18 Nov 2026") + '''</div>
      </div>
    </div>
    <div class="panel" style="padding: 16px 18px"><p class="lbl">Your year <span style="text-transform: none; letter-spacing: 0; font-weight: 400">one square a week · dashed: before you started · faint: still to come</span></p>
      <div style="display: flex; gap: 4px; margin-top: 10px; align-items: center"><span style="width: 14px; height: 14px; border-radius: 4px; background: #141416"></span><span style="width: 14px; height: 14px; border-radius: 4px; border: 1px dashed #c9c9c4"></span><span style="width: 14px; height: 14px; border-radius: 4px; border: 1px dashed #c9c9c4"></span><span style="width: 14px; height: 14px; border-radius: 4px; background: #ececea"></span></div>
      <p class="mut" style="font-size: 12px; margin-top: 10px">1 of 1 weeks trained · 3 workouts a week · Longest streak 1 wk</p></div>'''
write("ProProgress", page("ProProgress","Progress","Training",prog_main,900,FOOT2))

# ---------------- Plan ----------------
days=[("Mon","–",""),("Tue","✓",""),("Wed","✓","on"),("Thu","Upper A",""),("Fri","Lift",""),("Sat","Lower B",""),("Sun","–","")]
strip=''.join('<div style="flex: 1; min-width: 0; text-align: center; padding: 10px 4px; border-radius: 12px; border: 1px solid %s; background: %s"><span class="lbl" style="display: block; margin-bottom: 6px">%s</span><span style="font-size: 12.5px; font-weight: 600">%s</span></div>' % ("#141416" if o else "#ececea", "#ffffff" if o else "#fbfbfa", d, v) for d,v,o in days)
def goalrow(t, sub, st): return '<a class="row" href="GoalDetailDesktop.dc.html" style="padding: 10px 0"><span><strong>'+t+'</strong><small>'+sub+'</small></span><span class="chip">'+st+'</span></a>'
plan_main = head('<div><h1 style="font-size: 30px">Coach</h1><div style="margin-top: 12px">'+seg(COACHT,"Plan")+'</div></div>') + '''
    <div style="display: flex; flex-wrap: wrap; gap: 16px">
      <div class="panel" style="flex: 1 1 320px; min-width: 0; padding: 20px"><div style="display: flex; justify-content: space-between"><p class="lbl">Focus</p><a href="PlanSetup.dc.html" style="font-size: 12px; text-decoration: none">Change ›</a></div><h2 style="font-size: 20px; margin-top: 8px">Lose fat, build muscle</h2><p class="mut" style="font-size: 12.5px; margin-top: 8px; line-height: 1.55">A recomp: about 10% under maintenance, lots of protein, strength first. Judged by your waist and your lifts; your weight stays about the same.</p></div>
      <div class="panel" style="flex: 1 1 320px; min-width: 0; padding: 20px"><div style="display: flex; justify-content: space-between"><p class="lbl">Training</p><a href="PlanSetup.dc.html" style="font-size: 12px; text-decoration: none">Change ›</a></div><h2 style="font-size: 20px; margin-top: 8px">4 days a week · about 60 min · gym</h2><p class="mut" style="font-size: 12.5px; margin-top: 6px">4 lifting days · no cardio</p><p style="font-size: 12.5px; margin-top: 8px; line-height: 1.5">Program: Upper/Lower Muscle Builder, week 1 of 8 · Accumulation block · <a href="ProPrograms.dc.html">Program ›</a></p></div>
    </div>
    <div class="panel" style="padding: 18px 20px"><p class="lbl">This week · 2 of 4 done</p><div style="display: flex; gap: 8px; margin-top: 12px">''' + strip + '''</div></div>
    <div style="display: flex; flex-wrap: wrap; gap: 16px">
      <div class="panel" style="flex: 1 1 320px; min-width: 0; padding: 16px 20px"><div style="display: flex; justify-content: space-between"><p class="lbl">Goals</p><a href="GoalsDesktop.dc.html" style="font-size: 12px; text-decoration: none">All 2 ›</a></div>''' + goalrow("Body fat down to 15%","18% → 18% → 15%","Early days") + goalrow("My first pull-up","Step 1 of 4 · Negatives 3 × 5","In progress") + '''</div>
      <div class="panel" style="flex: 1 1 320px; min-width: 0; padding: 16px 20px"><div style="display: flex; justify-content: space-between"><p class="lbl">Food</p><a href="NutritionSettings.dc.html" style="font-size: 12px; text-decoration: none">Targets ›</a></div><p style="font-size: 15px; font-weight: 600; margin-top: 10px">2,450 kcal a day on average · 165 g protein</p><p class="mut" style="font-size: 12.5px; margin-top: 6px; line-height: 1.5">Training days 2,600, rest days 2,300: the protein stays, the carbs move.</p></div>
    </div>
    <div style="display: flex; flex-direction: column; gap: 8px"><p class="lbl">Tell Claude</p>''' + say("Set up my plan: ask me what you need") + '''</div>
    <a href="Endurance.dc.html" style="font-size: 13px; text-decoration: none; min-height: 44px; display: flex; align-items: center">Your zones › <span class="mut" style="margin-left: 8px">run, ride and swim, from a test</span></a>'''
write("PlanPage", page("PlanPage","Your plan","Coach",plan_main,900,FOOT2))
print("part 1 done")
