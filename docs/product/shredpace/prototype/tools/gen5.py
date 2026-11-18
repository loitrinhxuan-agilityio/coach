import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gen4 import *
import gen4

def bar(label, val, tot, pct): return '<div><div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px"><span>'+label+'</span><span class="mut" style="font-variant-numeric: tabular-nums">'+val+' / '+tot+'</span></div><div style="height: 6px; border-radius: 999px; background: #f1d9c8"><div style="width: '+str(pct)+'%; height: 6px; border-radius: 999px; background: #c2410c"></div></div></div>'

# ---------------- Food today ----------------
ring = '<svg width="120" height="120" viewBox="0 0 120 120" role="img" aria-label="1,950 kcal left"><circle cx="60" cy="60" r="48" fill="none" stroke="#f1d9c8" stroke-width="9"/><circle cx="60" cy="60" r="48" fill="none" stroke="#c2410c" stroke-width="9" stroke-linecap="round" stroke-dasharray="75 301" transform="rotate(-90 60 60)"/><text x="60" y="58" text-anchor="middle" font-family="Inter, sans-serif" font-size="24" font-weight="600" fill="#141416">1,950</text><text x="60" y="76" text-anchor="middle" font-family="Inter, sans-serif" font-size="11" fill="#67676b">kcal left</text></svg>'
food_main = head('<div><p class="mut" style="font-size: 12.5px">Wed 18 Nov · training day</p><div style="display: flex; gap: 12px; align-items: center; margin-top: 4px; flex-wrap: wrap"><h1 style="font-size: 30px">Food today</h1><span class="chip">Lose fat and build muscle</span></div></div>') + '''
    <div style="display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-start">
      <div style="flex: 3 1 520px; min-width: 0; display: flex; flex-direction: column; gap: 14px">
        <div style="padding: 20px; border-radius: 14px; background: #f7e8de; border: 1px solid #ecd7c7; display: flex; flex-wrap: wrap; gap: 22px; align-items: center">
          ''' + ring + '''
          <div style="flex: 1 1 280px; min-width: 0; display: flex; flex-direction: column; gap: 12px"><div><p class="lbl">Today against your targets</p><p style="font-size: 16px; font-weight: 600; margin-top: 4px">650 of 2,600 kcal <span class="mut" style="font-weight: 400; font-size: 13px">and 165 g protein</span></p></div>
            ''' + bar("Protein","35 g","165 g",21) + bar("Carbs","80 g","340 g",24) + bar("Fat","21 g","65 g",32) + '''
            <p style="font-size: 11.5px; color: #67676b; line-height: 1.5">Training day: about 150 kcal over your daily average, as carbs for today’s session. Workout burn is never added back.</p></div>
        </div>
        <div class="panel" style="padding: 16px 20px"><p class="lbl">Meals <span style="text-transform: none; letter-spacing: 0; font-weight: 400">tap one to see it</span></p>
          <table style="margin-top: 6px"><thead><tr><th>Time</th><th>Meal</th><th>kcal</th><th>Protein</th><th>Carbs</th><th>Fat</th><th>Source</th></tr></thead><tbody><tr><td>17:42</td><td><strong>Chicken rice bowl</strong></td><td>650</td><td>35 g</td><td>80 g</td><td>21 g</td><td class="mut">you said</td></tr></tbody></table></div>
        <div class="panel" style="padding: 16px 20px"><p class="lbl">Last 14 days</p><p style="font-size: 13px; margin-top: 8px"><strong>Average 650 kcal · 35 g protein</strong></p>
          <div style="display: flex; gap: 6px; align-items: flex-end; height: 56px; margin-top: 10px; border-bottom: 1px dashed #c9c9c4"><span style="flex: 1"></span><span style="flex: 1"></span><span style="flex: 1"></span><span style="flex: 1"></span><span style="flex: 1"></span><span style="flex: 1"></span><span style="flex: 1"></span><span style="flex: 1"></span><span style="flex: 1"></span><span style="flex: 1"></span><span style="flex: 1"></span><span style="flex: 1"></span><span style="flex: 1"></span><span style="width: 12px; height: 24px; border-radius: 4px 4px 0 0; background: #e6a97c"></span></div></div>
      </div>
      <div style="flex: 1 1 250px; min-width: 0; display: flex; flex-direction: column; gap: 12px">
        <div class="panel" style="padding: 16px; display: flex; flex-direction: column; gap: 8px"><p class="lbl">Your usuals</p>''' + say("Log my usual chicken rice bowl") + '''</div>
        <div class="panel" style="padding: 16px; display: flex; flex-direction: column; gap: 8px"><p class="lbl">Tell Claude</p>''' + say("Ask me what I ate") + '''<p class="mut" style="font-size: 12px">Or send Claude a photo of your plate.</p></div>
        <div class="panel" style="padding: 16px"><p class="lbl">Bodyweight</p><p style="font-size: 28px; font-weight: 600; margin-top: 6px">82.3 <span class="mut" style="font-size: 14px; font-weight: 500">kg</span></p><p class="mut" style="font-size: 12px">7-day average 82.3</p></div>
        <div class="panel" style="padding: 16px"><p class="lbl">From your coach</p><p style="font-size: 12.5px; margin-top: 8px; line-height: 1.55">Weigh in a few mornings a week: after two weeks I can tell whether your targets fit.</p></div>
      </div>
    </div>'''
write("FoodDesktop", page("FoodDesktop","Food","Food",food_main,900,FOOT2))

# ---------------- Food targets ----------------
def trow(n, sub, val): return '<div class="row"><span>'+n+'<small>'+sub+'</small></span><strong style="font-size: 18px; font-variant-numeric: tabular-nums">'+val+'</strong></div>'
nut_main = crumbhead("Food","FoodDesktop.dc.html","Food targets") + '''
    <div class="panel" style="padding: 20px; max-width: 700px"><p class="lbl">Focus</p><h2 style="font-size: 20px; margin-top: 8px">Lose fat, build muscle</h2></div>
    <div class="panel" style="padding: 6px 20px; max-width: 700px">''' + trow("Calories","about 10% under maintenance, a day on average: training days about 150 more, rest days about 150 less","2,450") + trow("Protein (g)","2 g per kg: high, to build muscle in a small deficit","165") + trow("Carbs (g)","the rest of your calories; most of the fuel for training","300") + trow("Fat (g)","at least 0.6 g per kg for hormones","65") + trow("Fibre (g)","keeps you full in a deficit","30") + '''</div>
    <div class="panel" style="padding: 6px 20px; max-width: 700px">''' + gen2.tg("Calories","the main number for weight",True) + gen2.tg("Protein, carbs and fat","bars under calories",True) + gen2.tg("Fibre","optional",False) + gen2.tg("Show numbers","off: Today shows on track or not, without figures",True) + '''</div>
    <div style="display: flex; flex-direction: column; gap: 8px; max-width: 700px"><p class="lbl">Tell Claude</p>''' + say("Ask me my protein target") + '</div>'
write("NutritionSettings", page("NutritionSettings","Food targets","Food",nut_main,900,FOOT2))

# ---------------- Body ----------------
def bt(name,val,sub,href="BodyHistory.dc.html"): return '<a class="tile" href="'+href+'"><b>'+name+'</b><span class="big" style="font-size: 24px">'+val+'</span><span class="sub">'+sub+'</span></a>'
def rd(n,v,c=''): return '<div class="row" style="padding: 9px 0"><span>'+n+'</span><span>'+v+' <span class="mut" style="margin-left: 8px">'+c+'</span></span></div>'
body_main = head('<div><p class="mut" style="font-size: 12.5px">Body · focus: lose fat and build muscle</p><h1 style="font-size: 30px; margin-top: 4px">Body</h1></div>') + '''
    <div style="display: flex; flex-wrap: wrap; gap: 14px; align-items: stretch">
      <a class="panel" href="TrackAnything.dc.html" style="flex: 1 1 240px; min-width: 0; padding: 20px; text-decoration: none; color: #141416; display: flex; flex-direction: column; gap: 4px"><p class="lbl">Weight</p><p style="font-size: 40px; font-weight: 600; letter-spacing: -.02em; margin-top: 8px">82.3 <span style="font-size: 16px; font-weight: 500">kg</span></p><p class="mut" style="font-size: 12px">7-day average 82.3 kg</p><p class="mut" style="font-size: 11.5px">Latest Wed 18 Nov · InBody 570</p></a>
      <div style="flex: 2 1 420px; min-width: 0; display: flex; flex-direction: column; gap: 8px"><p class="mut" style="font-size: 11.5px">Latest scan, Wed 18 Nov</p><div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px">
        ''' + bt("Body fat","18.0%","same as 18 Nov") + bt("Muscle","36.0 kg","") + bt("Waist","84 cm","") + bt("Visceral","6","") + bt("BMR","1,750","") + bt("Fat mass","14.8 kg","") + '''</div>
        <p class="mut" style="font-size: 11.5px; line-height: 1.5">Each tile is its metric’s latest value, its change under it; an older one carries its date.</p></div>
    </div>
    <div class="panel" style="padding: 12px 16px; background: #f0f0ee; font-size: 12px; line-height: 1.5"><span class="mut">ⓘ</span> Different device from last time (by hand → InBody 570): body-composition changes may partly be the device.</div>
    <div style="display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-start">
      <div style="flex: 1 1 300px; min-width: 0; display: flex; flex-direction: column; gap: 12px">
        <div class="panel" style="padding: 16px 18px"><div style="display: flex; justify-content: space-between"><p class="lbl">Goals</p><a href="GoalsDesktop.dc.html" style="font-size: 12px; text-decoration: none">All goals ›</a></div><a class="row" href="GoalDetailDesktop.dc.html" style="padding: 10px 0"><span><strong>Body fat down to 15%</strong><small>18% → 18% → 15%</small></span><span class="chip">Early days</span></a></div>
        <div class="panel" style="padding: 16px 18px"><div style="display: flex; justify-content: space-between"><p class="lbl">Your metrics</p><a href="TrackAnything.dc.html" style="font-size: 12px; text-decoration: none">Add ›</a></div><a class="row" href="TrackAnything.dc.html" style="padding: 10px 0"><span><strong>Resting heart rate</strong><small>Average this week</small></span><strong>58 bpm</strong></a></div>
        <div class="panel" style="padding: 16px 18px"><div style="display: flex; justify-content: space-between"><p class="lbl">Aches and pains</p><a href="TrackAnything.dc.html" style="font-size: 12px; text-decoration: none">Log ›</a></div><a class="row" href="TrackAnything.dc.html" style="padding: 10px 0"><span><strong>Left knee</strong><small>Wed, during squats</small></span><span class="ch">4/10 · Steady</span></a><p class="mut" style="font-size: 11.5px; margin-top: 4px">Rising areas make the exercises that load them lighter.</p></div>
      </div>
      <div class="panel" style="flex: 1 1 300px; min-width: 0; padding: 16px 20px"><p class="lbl">Every reading</p><p class="mut" style="font-size: 11.5px; margin-top: 4px">latest scan, 18 Nov · change since 18 Nov</p><div style="margin-top: 6px">
        ''' + rd("Body fat","18.0%","same") + rd("Fat mass","14.8 kg") + rd("Visceral fat","level 6") + rd("Waist","84 cm") + rd("Skeletal muscle","36.0 kg") + rd("Weight","82.3 kg","same") + rd("BMR","1,750 kcal") + '''</div></div>
    </div>'''
write("BodyDesktop", page("BodyDesktop","Body","Body",body_main,900,FOOT2))

# ---------------- Goals ----------------
goals_main = head('<div><h1 style="font-size: 30px">Goals</h1><p class="mut" style="font-size: 13px; margin-top: 8px"><span class="chip">Focus: lose fat and build muscle</span> <span style="margin-left: 8px">from your plan · <a href="PlanSetup.dc.html">Change ›</a></span></p></div>') + '''
    <a class="panel" href="GoalDetailDesktop.dc.html" style="padding: 20px; text-decoration: none; color: #141416; display: flex; flex-direction: column; gap: 12px; max-width: 640px"><div style="display: flex; justify-content: space-between"><p class="lbl">Body · body fat</p><span class="chip">Early days</span></div><h2 style="font-size: 20px">Body fat down to 15%</h2>
      <div style="display: flex; gap: 36px"><div><p class="lbl">Start</p><strong style="font-size: 20px">18%</strong></div><div><p class="lbl">Now</p><strong style="font-size: 20px">18%</strong></div><div><p class="lbl">Target</p><strong style="font-size: 20px">15%</strong></div></div>
      <div style="height: 6px; border-radius: 999px; background: #ececea"></div><p class="mut" style="font-size: 12px; line-height: 1.5">Trends need 3 readings or more; it needs 0.9 points a month to make 28 February.</p><p class="mut" style="font-size: 11.5px">InBody 570 scans, 18 Nov</p></a>
    <div style="max-width: 640px"><p class="lbl" style="margin-bottom: 8px">Skills, habits and tests</p><div class="panel" style="padding: 4px 18px">
      <a class="row" href="GoalDetailDesktop.dc.html"><span><strong>My first pull-up</strong><small>Step 1 of 4 · Negatives 3 × 5</small></span><span class="chip">In progress</span></a>
      <a class="row" href="SkillsHabits.dc.html"><span><strong>Creatine</strong><small>0 of 7 this week</small></span><span class="chip">Habit</span></a></div>
      <p class="mut" style="font-size: 11.5px; margin-top: 8px">No bars here: a step, a streak or a result says it better.</p></div>
    <div style="display: flex; flex-direction: column; gap: 8px; max-width: 640px"><p class="lbl">Tell Claude</p>''' + say("Add a goal") + say("Mark the Body fat down to 15% goal done") + '</div>'
write("GoalsDesktop", page("GoalsDesktop","Goals","Goals",goals_main,900,FOOT2))

# ---------------- Goal detail ----------------
gd_main = crumbhead("Goals","GoalsDesktop.dc.html","Body fat down to 15%") + '''
    <div style="display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-start; max-width: 900px">
      <div class="panel" style="flex: 1 1 380px; min-width: 0; padding: 20px"><div style="display: flex; justify-content: space-between"><p class="lbl">Body · body fat</p><span class="chip">Early days</span></div>
        <div style="display: flex; gap: 40px; margin-top: 14px"><div><p class="lbl">Start</p><strong style="font-size: 24px">18%</strong></div><div><p class="lbl">Now</p><strong style="font-size: 24px">18%</strong></div><div><p class="lbl">Target</p><strong style="font-size: 24px">15%</strong></div></div>
        <p class="lbl" style="margin-top: 18px">Since 18 November</p>
        <div style="margin-top: 8px; position: relative; height: 110px; border-left: 1px solid #ececea; border-bottom: 1px solid #ececea"><span style="position: absolute; left: -26px; top: -6px; font-size: 10.5px; color: #67676b">18</span><span style="position: absolute; left: -30px; top: 44px; font-size: 10.5px; color: #67676b">16.5</span><span style="position: absolute; left: -26px; bottom: -6px; font-size: 10.5px; color: #67676b">15</span><span style="position: absolute; left: 8px; top: 0; width: 9px; height: 9px; border-radius: 999px; background: #141416"></span></div><p class="mut" style="font-size: 10.5px; margin-top: 6px">18 Nov</p></div>
      <div style="flex: 1 1 280px; min-width: 0; display: flex; flex-direction: column; gap: 12px"><div class="panel" style="padding: 6px 20px"><p class="lbl" style="padding-top: 14px">Details</p>
        <div class="row"><span class="mut">Measures</span><span>Body fat, from scans</span></div><div class="row"><span class="mut">Due</span><span>28 February</span></div><div class="row"><span class="mut">Why</span><span style="text-align: right; max-width: 190px">Body fat down 3 points by February</span></div><div class="row"><span class="mut">Set</span><span>18 Nov by Claude</span></div><div class="row"><span class="mut">Goes with</span><span>Food: lose fat and build muscle · <a href="NutritionSettings.dc.html">Goal and food targets ›</a></span></div></div>
        <div style="display: flex; flex-direction: column; gap: 8px"><p class="lbl">Tell Claude</p>''' + say("Mark the Body fat down to 15% goal done") + '</div></div>\n    </div>'
write("GoalDetailDesktop", page("GoalDetailDesktop","Goal","Goals",gd_main,900,FOOT2+" A goal opens at #goal/{id}, an id and not a number."))

# ---------------- Habit + skill ----------------
wkd=''.join('<div style="flex: 1; text-align: center"><span class="lbl" style="display: block; margin-bottom: 6px">'+d+'</span><span style="display: block; height: 26px; border-radius: 8px; background: #ececea"></span></div>' for d in "MTWTFSS")
def step(n,t,s): return '<div style="display: flex; gap: 14px; align-items: flex-start; padding: 12px 0; border-bottom: 1px solid #ececea"><span class="av" style="width: 30px; height: 30px; font-size: 12px; background: '+('#141416' if n==1 else '#ececea')+'; color: '+('#ffffff' if n==1 else '#141416')+'">'+str(n)+'</span><span><strong style="font-size: 13.5px">'+t+'</strong><br><span class="mut" style="font-size: 12px">'+s+'</span></span></div>'
sh_main = head('<div><a href="GoalsDesktop.dc.html" style="font-size: 13px; text-decoration: none; min-height: 44px; display: inline-flex; align-items: center">‹ Goals</a><h1 style="font-size: 30px">Habit and skill</h1></div>') + '''
    <div style="display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-start">
      <div class="panel" style="flex: 1 1 340px; min-width: 0; padding: 20px; display: flex; flex-direction: column; gap: 14px"><p class="lbl">Habit · #habit/{id}</p><h2 style="font-size: 24px">Creatine</h2>
        <div style="display: flex; gap: 28px"><div><p class="lbl">Streak</p><strong style="font-size: 20px">0 days</strong></div><div><p class="lbl">Best</p><strong style="font-size: 20px">0 days</strong></div><div><p class="lbl">4 weeks</p><strong style="font-size: 20px">0 of 0</strong></div></div>
        <div><p class="lbl">The last 4 weeks</p><p class="mut" style="font-size: 11.5px; margin-top: 2px">filled: done · grey: missed</p><div style="display: flex; gap: 6px; margin-top: 8px">''' + wkd + '''</div></div>
        <p class="mut" style="font-size: 12.5px; line-height: 1.5">5 g a day, every day. Ticked by you or your agent; today isn’t ticked yet.</p>''' + say("Tick creatine") + '''</div>
      <div class="panel" style="flex: 1 1 340px; min-width: 0; padding: 20px"><p class="lbl">Skill goal · #goal/{id}</p><h2 style="font-size: 24px; margin-top: 10px">My first pull-up</h2><p style="margin-top: 6px; font-size: 13px"><strong>Step 1 of 4</strong> <span class="chip" style="margin-left: 6px">In progress</span></p><p class="mut" style="font-size: 12.5px; margin-top: 6px">No attempt yet: negatives 3 × 5 reaches step 1.</p>
        <div style="margin-top: 8px">''' + step(1,"Negatives","3 × 5, 5 s down") + step(2,"Band pull-ups","3 × 5, green band") + step(3,"1 pull-up","strict, from a dead hang") + step(4,"3 pull-ups","in one set") + '''</div>
        <p class="lbl" style="margin-top: 14px">In your plan</p><p class="mut" style="font-size: 12.5px; margin-top: 4px; line-height: 1.5">Not in your plan. Ask your agent to add it to the days it fits.</p><p class="lbl" style="margin-top: 14px">This step’s sets</p></div>
    </div>'''
write("SkillsHabits", page("SkillsHabits","Habit and skill","Goals",sh_main,900,FOOT2+" A habit opens at #habit/{id}; a skill goal opens at #goal/{id}. Benchmarks were not created on the account, so none is drawn."))
print("part 2 done")
