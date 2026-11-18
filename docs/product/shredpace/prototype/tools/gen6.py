import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gen5 import *
import gen5

def chartbox(h, labels, dot): 
    return '<div style="position: relative; height: '+str(h)+'px; border-left: 1px solid #ececea; border-bottom: 1px solid #ececea; margin: 10px 0 4px 26px">'+''.join('<span style="position: absolute; left: -30px; top: %dpx; font-size: 10.5px; color: #67676b">%s</span>' % (y,t) for y,t in labels)+'<span style="position: absolute; left: 10px; top: '+str(dot)+'px; width: 9px; height: 9px; border-radius: 999px; background: #141416"></span></div>'

# ---------------- Track anything: weight metric, custom metric, ache ----------------
ta_main = head('<div><p class="lbl">Progress › Body › Weight · #metric/…  ·  #ache/…</p><h1 style="font-size: 28px; margin-top: 6px">Metric and ache pages</h1></div>') + '''
    <div style="display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-start">
      <div class="panel" style="flex: 1 1 380px; min-width: 0; padding: 20px">
        <span class="seg" style="flex-wrap: wrap"><button type="button" class="on">Weight</button><button type="button">Body fat</button><button type="button">Muscle</button><button type="button">Waist</button><button type="button">Fat mass</button><button type="button">Visceral fat</button><button type="button">BMR</button></span>
        <p style="font-size: 34px; font-weight: 600; margin-top: 14px; letter-spacing: -.02em">82.3 <span style="font-size: 15px; font-weight: 500">kg</span></p><p class="mut" style="font-size: 12px">Wed 18 Nov, 17:42 · by hand</p>
        <div style="margin-top: 10px"><span class="seg"><button type="button">W</button><button type="button">M</button><button type="button" class="on">3M</button><button type="button">Y</button><button type="button">All</button></span> <span class="mut" style="margin-left: 10px; font-size: 12px">‹ 18 Nov – 18 Nov ›</span></div>
        ''' + chartbox(110,[(-6,"82.4"),(44,"82.3"),(98,"82.2")],46) + '''<p class="mut" style="font-size: 12px">A trend needs 3 readings</p>
        <p class="lbl" style="margin-top: 14px">Readings <a href="TrackAnything.dc.html" style="font-weight: 400; text-transform: none; letter-spacing: 0; margin-left: 8px">Add ›</a></p>
        <div class="row"><span>Wed 18 Nov, 17:42<small>by hand · Claude</small></span><span>82.3 kg ›</span></div><div class="row"><span>Wed 18 Nov, 17:34<small>by hand · Claude</small></span><span>82.3 kg ›</span></div><p class="mut" style="font-size: 11.5px">Tap one to fix or delete it.</p>
        <p class="lbl" style="margin-top: 12px">About weight</p><p class="mut" style="font-size: 12px; margin-top: 4px; line-height: 1.55">Your weight changes by a kilo or more in a day with water and food. Weigh in the morning, after the toilet and before eating: the 7-day average is the line to watch.</p></div>
      <div style="flex: 1 1 300px; min-width: 0; display: flex; flex-direction: column; gap: 16px">
        <div class="panel" style="padding: 20px"><a href="BodyDesktop.dc.html" style="font-size: 12.5px; text-decoration: none">‹ Body</a><h2 style="font-size: 22px; margin-top: 6px">Resting heart rate</h2><p style="font-size: 30px; font-weight: 600; margin-top: 6px">58 <span style="font-size: 14px; font-weight: 500">bpm</span></p>
          ''' + chartbox(60,[(-6,"58.1"),(24,"58"),(50,"57.9")],24) + '''<p class="mut" style="font-size: 12px">Lower is better · logged daily · by Claude</p>
          <p class="lbl" style="margin-top: 12px">Goal</p><p class="mut" style="font-size: 12.5px; margin-top: 4px">No goal for it yet. <a href="GoalsDesktop.dc.html">Set one ›</a></p>
          <p class="lbl" style="margin-top: 12px">Readings</p><div class="row"><span>Wed 18 Nov</span><span>58 · Claude</span></div><a href="TrackAnything.dc.html" style="font-size: 12.5px; text-decoration: none">Edit the metric ›</a></div>
        <div class="panel" style="padding: 20px"><a href="BodyDesktop.dc.html" style="font-size: 12.5px; text-decoration: none">‹ Body</a><h2 style="font-size: 22px; margin-top: 6px">Left knee</h2><p style="font-size: 30px; font-weight: 600; margin-top: 6px">4/10 <span class="chip" style="margin-left: 8px; vertical-align: 6px">Steady</span></p>
          ''' + chartbox(60,[(-6,"10"),(24,"5"),(50,"0")],38) + '''<p class="mut" style="font-size: 11.5px">0 none · 10 the worst. Logged when you mention it.</p>
          <p class="lbl" style="margin-top: 12px">What changes</p><p style="font-size: 12.5px; margin-top: 4px; line-height: 1.5">Nothing changes: under 5/10 and not rising, your plan stays as it is.</p>
          <p class="lbl" style="margin-top: 12px">The log</p><div class="row"><span>4<small>Wed 18 · during squats</small></span><span class="ch">Claude</span></div>
          <p class="mut" style="font-size: 11.5px; margin-top: 6px; line-height: 1.5">At 7/10 or more: “That’s a lot of pain. Please get it checked before loading it.” Shredpace doesn’t diagnose.</p></div>
      </div>
    </div>'''
write("TrackAnything", page("TrackAnything","Metrics and aches","Body",ta_main,900,FOOT2+" Body metrics open at #metric/weight, a custom metric at #metric/{id}, an ache at #ache/{area}/{side}."))

# ---------------- Session detail ----------------
def kv(k,v,sub=''): return '<div><p class="lbl">'+k+'</p><p style="font-size: 20px; font-weight: 600; margin-top: 4px">'+v+'</p>'+(('<p class="mut" style="font-size: 11px">'+sub+'</p>') if sub else '')+'</div>'
sd_main = head('<div><a href="SessionsDesktop.dc.html" style="font-size: 13px; text-decoration: none; min-height: 44px; display: inline-flex; align-items: center">‹ Sessions</a><h1 style="font-size: 28px">Session detail</h1></div>') + '''
    <div style="display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-start">
      <div class="panel" style="flex: 1 1 380px; min-width: 0; padding: 22px; display: flex; flex-direction: column; gap: 14px">
        <p class="lbl">Tue 17 Nov · 09:14–09:15 · Full body · Beginner Full-Body Muscle</p>
        <div style="display: flex; justify-content: space-between; align-items: center"><h2 style="font-size: 26px">Full Body A</h2><a href="SessionDetail.dc.html" style="font-size: 12.5px; text-decoration: none">Wed 18 Nov ›</a></div>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px">''' + kv("Time","1 min") + kv("Working sets","0") + kv("Volume","0 kg") + kv("Records","0","none this time") + kv("Calories","5 kcal","estimate") + '''</div>
        <div><p class="lbl">How it went</p><p style="font-size: 13px; margin-top: 4px">You did 0 of 15 targets.</p></div>
        <div style="display: flex; gap: 30px"><div><p class="lbl">Effort</p><p class="mut" style="font-size: 13px; margin-top: 4px">Not set</p></div><div><p class="lbl">Felt</p><p class="mut" style="font-size: 13px; margin-top: 4px">Not set</p></div></div>
        <p class="mut" style="font-size: 12px">“Started but no sets logged” · told to Claude at 09:15</p>
        <div><p class="lbl">Muscles this session <span style="text-transform: none; letter-spacing: 0; font-weight: 400">working sets</span></p></div>
        <div class="panel" style="padding: 14px; background: #f0f0ee"><p class="lbl">Coach’s take</p><p style="font-size: 12.5px; margin-top: 4px">Logged. Next time, aim to beat today’s numbers.</p></div></div>
      <div class="panel" style="flex: 1 1 340px; min-width: 0; padding: 22px; display: flex; flex-direction: column; gap: 14px">
        <p class="lbl">Wed 18 Nov · 17:05–17:32 · Run</p>
        <div style="display: flex; justify-content: space-between; align-items: center"><h2 style="font-size: 26px">5 km run</h2><span style="font-size: 12.5px"><a href="SessionDetail.dc.html" style="text-decoration: none">‹ Previous</a> &nbsp; <a href="SessionDetail.dc.html" style="text-decoration: none">Next ›</a></span></div>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px">''' + kv("Distance","5.0 km") + kv("Time","27:40") + kv("Pace","5:32 /km") + kv("Calories","~372","estimate") + '''</div>
        <div><p class="lbl">Against your runs</p><div class="row" style="padding: 9px 0"><span>Fastest 5 km, all time</span><strong>27:40 · 18 Nov</strong></div><div class="row" style="padding: 9px 0"><span>Runs this month</span><strong>1 · 5.0 km</strong></div><div class="row" style="padding: 9px 0"><span>Average pace, 4 weeks</span><strong>5:32 /km</strong></div></div>
        <div><p class="lbl">Muscles</p><p style="font-size: 12.5px; margin-top: 4px">Calves, quads, glutes, hamstrings, shins.</p><p class="mut" style="font-size: 11.5px">From the activity, not from sets: an estimate.</p></div>
        <div style="display: flex; gap: 30px"><div><p class="lbl">From</p><p style="font-size: 13px; margin-top: 4px">logged by Claude</p></div></div>
        <div><p class="lbl">How it went</p><div style="display: flex; gap: 30px; margin-top: 4px"><span class="mut" style="font-size: 13px">Effort · Not set</span><span class="mut" style="font-size: 13px">Felt · Not set</span></div><p class="mut" style="font-size: 12px; margin-top: 6px">told to Claude at 17:32</p></div></div>
    </div>'''
write("SessionDetail", page("SessionDetail","Session detail","Training",sd_main,900,FOOT2+" A finished session opens at #session/{id}. A session still in progress opens the live Today view instead; a finished strength session with sets was not seen."))

# ---------------- Scans ----------------
def scanrow(when, dev, val, extra): return '<a class="row" href="BodyHistory.dc.html"><span><strong>'+when+'</strong><small>'+dev+'</small></span><span style="text-align: right">'+val+'<br><span class="mut" style="font-size: 11.5px">'+extra+'</span></span></a>'
bh_main = crumbhead("Body","BodyDesktop.dc.html","All scans") + '''
    <div style="display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-start">
      <div class="panel" style="flex: 1 1 380px; min-width: 0; padding: 4px 18px">''' + scanrow("Wed 18 Nov","by hand","84 cm waist","only these") + scanrow("Wed 18 Nov, 17:05","InBody 570","18.0%","36.0 kg muscle · 14.8 kg fat mass · +2 more") + scanrow("Wed 18 Nov","by hand","18.0%","only these") + scanrow("Wed 18 Nov","by hand","82.3 kg","only these") + scanrow("Wed 18 Nov, 17:34","by hand","82.3 kg","only these") + '''</div>
      <div class="panel" style="flex: 1 1 300px; min-width: 0; padding: 22px; display: flex; flex-direction: column; gap: 10px"><a href="BodyHistory.dc.html" style="font-size: 12.5px; text-decoration: none">‹ All scans</a><p class="lbl">Wed 18 Nov</p><p class="mut" style="font-size: 12.5px">by hand · logged by Claude</p><p class="lbl" style="margin-top: 8px">Waist</p><p style="font-size: 32px; font-weight: 600">84 <span style="font-size: 14px; font-weight: 500">cm</span></p><p class="mut" style="font-size: 12.5px">Your first measure: changes show from the next one.</p><div style="display: flex; gap: 14px; margin-top: 8px"><a href="BodyHistory.dc.html" style="font-size: 12.5px; text-decoration: none">Fix a value ›</a><a href="BodyHistory.dc.html" style="font-size: 12.5px; text-decoration: none">Delete this scan</a></div></div>
    </div>
    <p class="mut" style="font-size: 12.5px; line-height: 1.55">Newest first. A partial scan shows what it has; its metrics’ pages skip it for the rest.</p>'''
write("BodyHistory", page("BodyHistory","All scans","Body",bh_main,900,FOOT2+" A scan opens at #body/scan/{id}."))

# ---------------- Usuals ----------------
us_main = crumbhead("Food","FoodDesktop.dc.html","Your usuals") + '''<div class="panel" style="padding: 4px 20px; max-width: 680px"><a class="row" href="MealExtras.dc.html"><strong>Chicken rice bowl</strong><span class="ch">650 kcal ›</span></a></div>'''
write("MealExtras", page("MealExtras","Your usuals","Food",us_main,900,FOOT2))

# ---------------- Gym ----------------
gym_main = crumbhead("Settings","Settings.dc.html","Your gym","What your gym has, so every target is a weight you can pick up.") + '''
    <div class="panel" style="padding: 6px 20px"><p class="lbl" style="padding-top: 14px">Free weights</p>''' + gl("Bar","Barbell sets read as totals","20 kg") + gl("Plates","in pairs","25, 20, 15, 10, 5, 2.5, 1.25 kg, the usual") + gl("Dumbbells","per hand","2.5 to 30 kg in 2.5s") + gl("Kettlebells","","Not set") + gl("Machines","","None yet") + '''</div>
    <p class="mut" style="font-size: 12.5px; line-height: 1.55">Until your agent knows, kettlebells and machines round to 2.5 kg steps.</p>
    <div style="display: flex; flex-direction: column; gap: 8px"><p class="lbl">To change one, tell Claude</p>''' + say("Set my dumbbells") + say("Set a machine’s weights") + '</div>'
write("GymWeights", page("GymWeights","Your gym","Settings",gym_main,900,FOOT2))

# ---------------- Settings ----------------
set_main = head('<div><h1 style="font-size: 30px">Settings</h1></div>') + '''
    <div style="display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-start">
      <div class="panel" style="flex: 1 1 340px; min-width: 0; padding: 6px 20px"><p class="lbl" style="padding-top: 14px">Yours, here</p>
        ''' + srow("Appearance","Studio · your device’s mode","›","Appearance.dc.html") + srow("Agents and keys","Connect Claude, Grok, any bot · make or revoke a key","›","ConnectAgentV2.dc.html") + srow("Privacy and consent","What agents may read and write","›","ConsentSettings.dc.html") + srow("Plan","Pro, free during early access","Early Pro","Upgrade.dc.html") + srow("Export, sign out, delete account","Your data, your account") + srow("Fix it by hand","When your agent can’t: edit here for an hour") + '''</div>
      <div class="panel" style="flex: 1 1 340px; min-width: 0; padding: 6px 20px"><p class="lbl" style="padding-top: 14px">Set by your agent</p>
        ''' + srow("Name and units","","Sam · kg · km") + srow("Body type","How your figure is drawn","Female") + srow("Your gym","Bar, plates, dumbbells, kettlebells, machines","20 kg bar","GymWeights.dc.html") + srow("Food goal","","Recomp","NutritionSettings.dc.html") + srow("Coach check-ins","Morning plan, Monday recap, stalls","All on","ProCoach.dc.html") + srow("What your agents know","1 note they all read","1") + '''
        <p class="mut" style="font-size: 12px; padding: 14px 0; line-height: 1.5">Workouts, sets, food, body, goals<br>Shown here; changed by telling your agent</p></div>
    </div>
    <div style="display: flex; flex-direction: column; gap: 8px"><p class="lbl">To change one, tell Claude</p>''' + say("Use pounds") + say("Forget “Dumbbell weights are per hand”") + '</div>'
write("Settings", page("Settings","Settings","Settings",set_main,900,FOOT2))

# ---------------- During and Before ----------------
sdk_main = head('<div><p class="lbl">Today › Before and during</p><h1 style="font-size: 28px; margin-top: 6px">Two views of the same screen</h1></div>') + '''
    <div style="display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-start">
      <div class="panel" style="flex: 1 1 320px; min-width: 0; padding: 20px; display: flex; flex-direction: column; gap: 10px"><p class="lbl">Today › Before</p><h2 style="font-size: 22px">Nothing planned</h2><p class="mut" style="font-size: 12.5px">Wed 18 Nov</p><p style="font-size: 14px; font-weight: 600; margin-top: 6px">No targets for today</p><p class="mut" style="font-size: 12.5px; line-height: 1.55">Your next planned day is Thu 19 Nov · Upper A.</p><a href="SessionDesktop.dc.html" style="font-size: 13px; font-weight: 600; text-decoration: none; color: #141416; min-height: 44px; display: inline-flex; align-items: center">Preview targets ›</a><p class="mut" style="font-size: 12px; line-height: 1.55">Training anyway? Tell Claude “starting upper”: it logs as you go and Before fills in.</p><p class="lbl" style="margin-top: 8px">Muscles</p><p style="font-size: 12.5px">All recovered.</p><p class="lbl" style="margin-top: 8px">This week</p><p style="font-size: 12.5px">3 of 4 sessions · Full Body, Run, Legs</p></div>
      <div class="panel" style="flex: 1 1 340px; min-width: 0; padding: 20px; display: flex; flex-direction: column; gap: 10px"><div style="display: flex; justify-content: space-between; align-items: center"><p class="lbl">Leg workout · 17:34</p><span class="chip live">Live from Claude</span></div>
        <h2 style="font-size: 24px">Romanian Deadlift</h2><p style="font-size: 14px">Next · set 2 of 3</p><p style="font-size: 28px; font-weight: 600">80 kg × 8</p><p class="mut" style="font-size: 12px">rest 2 min · started 17:34</p>
        <p class="lbl" style="margin-top: 8px">Sets so far</p><div class="row" style="padding: 9px 0"><span>1</span><span>80 kg × 8</span></div>
        <p class="lbl" style="margin-top: 6px">Tell Claude</p>''' + say("Log my next set") + say("Swap this exercise") + say("Undo that last set") + say("End my session") + '''<p class="mut" style="font-size: 12px">This page updates as Claude logs.</p></div>
    </div>'''
write("SessionDesktop", page("SessionDesktop","Before and during","Today",sdk_main,900,FOOT2+" A finished session’s After page was not seen: the leg workout was still open."))

# ---------------- Activity ----------------
act_main = crumbhead("Settings","Settings.dc.html","Activity","Everything your agents and you have changed. Undo works for 7 days; older items open where you can change them.") + '''
    <div style="display: flex; flex-wrap: wrap; gap: 14px 24px"><div><p class="lbl" style="margin-bottom: 6px">Who</p>''' + chips(["Everyone","Claude","You"],0) + '''</div><div><p class="lbl" style="margin-bottom: 6px">What</p>''' + chips(["All","To check","Sessions","Food","Body","Goals and plan","Settings"],0) + '''</div></div>
    <p class="mut" style="font-size: 12px">Each agent is named after its key (Settings › API keys). Removing a key keeps its history here.</p>
    <div class="panel" style="padding: 6px 20px"><p class="lbl" style="padding-top: 14px">Today</p>
      ''' + act("18:06","C","Added a body reading: Waist 84 cm","Claude") + act("18:05","C","Added a body scan: 18% body fat","Claude") + act("18:05","C","Saved a meal: Chicken rice bowl, 650 kcal","Claude") + act("18:05","C","Added a goal: My first pull-up","Claude") + act("18:05","C","Changed a gym: My gym","Claude") + act("18:04","C","Logged 5 km run (1 set)","Claude") + act("17:43","C","Added a program: Upper/Lower Muscle Builder","Claude") + '''
      <p class="lbl" style="padding-top: 16px">Yesterday · Tue 17 Nov</p>
      ''' + act("09:14","C","Started Full Body A","Claude") + act("09:11","Y","Added an API key: Claude","Someone") + '''</div>'''
write("ActivityHistory", page("ActivityHistory","What changed","Settings",act_main,900,FOOT2))

# ---------------- Program (goals now listed) ----------------
src = open(gen4.OUT if hasattr(gen4,'OUT') else gen1.OUT, 'r') if False else None
p = gen1.OUT + "ProPrograms.dc.html"
s = open(p, encoding="utf-8").read()
old = '<p class="lbl">Your goals</p><p class="mut" style="font-size: 12.5px; margin-top: 8px; line-height: 1.5">No goals yet. Tell your agent what you’re after, and it sets the goal.</p>'
new = '<p class="lbl">Your goals</p><div style="margin-top: 6px"><div class="row" style="padding: 10px 0"><span><strong>Body fat down to 15%</strong><small>18%, from 18%</small></span></div><div class="row" style="padding: 10px 0"><span><strong>My first pull-up</strong><small>Step 1 of 4 · Negatives 3 × 5</small></span></div></div>'
assert old in s; open(p, "w", encoding="utf-8").write(s.replace(old, new))

# ---------------- Exercises: the Bar note, as read ----------------
p = gen1.OUT + "Exercises.dc.html"
s = open(p, encoding="utf-8").read()
old = '<span class="seg" style="margin-top: 8px"><button type="button" class="on">Bar</button><button type="button">Smith machine</button></span>'
new = '<span class="seg" style="margin-top: 8px"><button type="button" class="on">Bar</button></span><p class="mut" style="font-size: 11.5px; margin-top: 8px; line-height: 1.5">Not counted: the total is the plates. Records here compare only with this lift. A Smith machine starts here; a trap bar or an EZ bar takes its own weight.</p>'
assert old in s; open(p, "w", encoding="utf-8").write(s.replace(old, new))
print("part 3 done")
