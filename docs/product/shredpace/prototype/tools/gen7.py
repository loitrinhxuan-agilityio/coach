import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gen6 import *
import gen1
OUT = gen1.OUT
def patch(name, pairs):
    p = OUT + name + ".dc.html"; s = open(p, encoding="utf-8").read()
    for a, b in pairs:
        assert s.count(a) == 1, (name, s.count(a), a[:70]); s = s.replace(a, b)
    open(p, "w", encoding="utf-8").write(s)

# ---- Today: the leg workout is done ----
patch("TodayDesktop", [
 ('<span class="chip live">In progress</span>', '<span class="chip ok">Completed</span>'),
 ('17:34 – now · 4 sets', '17:34 – 18:05 · 4 sets'),
 ('tile2("This week","2"', 'tile2("This week","3"') if False else ('<b>This week</b><span class="big">2</span>', '<b>This week</b><span class="big">3</span>'),
 ('<b>Time trained</b><span class="big">0:39</span>', '<b>Time trained</b><span class="big">1:00</span>'),
 ('16% of 4 h', '25% of 4 h'),
 ('Claude changed 14 things today', 'Claude changed 31 things today'),
 ('Added a body reading: Waist 84 cm · 12:06', 'Changed Leg workout · 18:34'),
])

# ---- Sessions: the strength row, the 7-day panel and the plan panel ----
patch("SessionsDesktop", [
 ('<span class="chip live" style="margin-left: 6px">In progress</span><small>17:34 – now</small>', '<span class="chip" style="margin-left: 6px">Strength</span><small></small>'),
 ('4 sets<br>2.1k kg', '31 min<br>4 sets · 2.1k kg'),
 ('3 <span class="mut" style="font-size: 12.5px; font-weight: 400">sessions · 39 min in all</span>', '3 <span class="mut" style="font-size: 12.5px; font-weight: 400">sessions · 1 h 00 in all</span>'),
 ('<span style="flex: 10; background: #2f7d45"></span>', '<span style="flex: 31; background: #2f7d45"></span>'),
 ('Strength 10 min · Run 28 min', 'Strength 31 min · Run 28 min'),
 ('<p style="margin-top: 8px; font-size: 22px; font-weight: 600">2 <span class="mut" style="font-size: 12.5px; font-weight: 400">of 4</span></p>', '<p style="margin-top: 8px; font-size: 22px; font-weight: 600">3 <span class="mut" style="font-size: 12.5px; font-weight: 400">of 4</span></p>'),
 ('<span>✓ Full Body A</span><span>✓ 5 km run</span><span class="mut">Upper A · Thu</span><span class="mut">Lift · Fri</span>', '<span>Full Body A</span><span>Leg workout</span><span>Upper A</span><span>Lift</span><span class="mut" style="margin-top: 4px">Upper A Thu · Lift Fri</span>'),
])

# ---- Session detail: the finished leg workout, as read ----
def exblock(name, muscles, rows, nxt):
    r = ''.join('<tr><td>'+a+'</td><td>'+b+'</td><td class="mut">–</td><td>'+c+'</td></tr>' for a,b,c in rows)
    return '<div><div style="display: flex; justify-content: space-between; align-items: baseline"><strong style="font-size: 15px">'+name+'</strong><a href="ProProgress.dc.html" style="font-size: 12px; text-decoration: none">Progress ›</a></div><p class="mut" style="font-size: 11.5px; margin-top: 2px">'+muscles+'</p><table style="margin-top: 4px"><thead><tr><th>Set</th><th>Today</th><th>Last time</th><th>e1RM</th></tr></thead><tbody>'+r+'</tbody></table><p class="mut" style="font-size: 12px; margin-top: 4px">'+nxt+'</p></div>'
leg = '''<div class="panel" style="flex: 1 1 400px; min-width: 0; padding: 22px; display: flex; flex-direction: column; gap: 14px">
        <p class="lbl">Wed 18 Nov · 17:34–18:05 · Legs · Upper/Lower Muscle Builder</p>
        <div style="display: flex; justify-content: space-between; align-items: center"><h2 style="font-size: 26px">Leg workout</h2><a href="SessionDetail.dc.html" style="font-size: 12.5px; text-decoration: none">‹ Wed 18 Nov</a></div>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px">''' + kv("Time","31 min") + kv("Working sets","4") + kv("Volume","2.1k kg") + kv("First marks","2","new lifts") + kv("Calories","255 kcal","estimate") + '''</div>
        <div><p class="lbl">How it went</p><p style="font-size: 13px; margin-top: 4px">You did 4 working sets. It felt good, and it was hard.</p><div style="display: flex; gap: 30px; margin-top: 8px"><div><p class="lbl">Effort</p><p style="font-size: 14px; font-weight: 600; margin-top: 2px">Hard <span class="mut" style="font-weight: 400; font-size: 11px">from Claude</span></p></div><div><p class="lbl">Felt</p><p style="font-size: 14px; font-weight: 600; margin-top: 2px">Good <span class="mut" style="font-weight: 400; font-size: 11px">from Claude</span></p></div></div><p class="mut" style="font-size: 11.5px; margin-top: 6px">told to Claude at 18:05</p></div>
        <div class="panel" style="padding: 12px 14px; background: #f0f0ee"><p class="lbl">Next legs</p><p style="font-size: 13px; margin-top: 2px">Back Squat 100 kg, all 8s.</p></div>
        ''' + exblock("Back Squat","quads · glutes · adductor magnus · inner thighs · lower back",[("1","100 × 5","117"),("2","100 × 5","117"),("3","100 × 5","117")],"First time logged. Next time: stay at 100 kg, 6 on every set.") + exblock("Romanian Deadlift","hamstrings · glutes · lower back · adductor magnus · forearm flexors",[("1","80 × 8","101")],"First time logged. Next time: stay at 80 kg, 9 on every set.") + '''
        <div><p class="lbl">Muscles this session <span style="text-transform: none; letter-spacing: 0; font-weight: 400">working sets</span></p><p style="font-size: 12.5px; margin-top: 6px; line-height: 1.6">Glutes 4 sets · Quads 3 sets · Hamstrings 1 set<br><span class="mut">Helping: adductor magnus 4 · lower back 4 · inner thighs 3 · forearm flexors 1</span></p></div>
        <div class="panel" style="padding: 12px 14px; background: #f0f0ee"><p class="lbl">Coach’s take</p><p style="font-size: 12.5px; margin-top: 2px">Next legs, keep the weights and add a rep where you can.</p></div>
        <div><p class="lbl">Something wrong with Romanian Deadlift?</p><p class="mut" style="font-size: 12px; margin: 2px 0 8px">Tell Claude and it fixes it here.</p>''' + say("Fix a set") + '</div></div>'
p = OUT + "SessionDetail.dc.html"; s = open(p, encoding="utf-8").read()
i = s.index('<div class="panel" style="flex: 1 1 380px; min-width: 0; padding: 22px; display: flex; flex-direction: column; gap: 14px">')
j = s.index('<div class="panel" style="flex: 1 1 340px; min-width: 0; padding: 22px; display: flex; flex-direction: column; gap: 14px">')
s = s[:i] + leg + "\n      " + s[j:]
s = s.replace("A finished session opens at #session/{id}. A session still in progress opens the live Today view instead; a finished strength session with sets was not seen.", "A finished session opens at #session/{id}; a run and a strength session have different pages. A session still in progress opens the live Today view instead.")
open(p, "w", encoding="utf-8").write(s)

# ---- Before, During and After ----
def mk(h): return '<div class="panel" style="flex: 1 1 300px; min-width: 0; padding: 18px; display: flex; flex-direction: column; gap: 8px; font-size: 12.5px">'+h+'</div>'
before = mk('<p class="lbl">Today › Before</p><h2 style="font-size: 20px">Nothing planned</h2><p class="mut">Wed 18 Nov</p><p style="font-weight: 600">No targets for today</p><p class="mut" style="line-height: 1.5">Your next planned day is Thu 19 Nov · Upper A.</p><a href="SessionDesktop.dc.html" style="font-size: 13px; font-weight: 600; text-decoration: none; color: #141416; min-height: 44px; display: inline-flex; align-items: center">Preview targets ›</a><p class="mut" style="line-height: 1.5">Training anyway? Tell Claude “starting upper”: it logs as you go and Before fills in.</p><p class="lbl" style="margin-top: 6px">Muscles</p><p>All recovered.</p><p class="lbl" style="margin-top: 6px">This week</p><p>3 of 4 sessions · Full Body, Run, Legs</p>')
during = mk('<div style="display: flex; justify-content: space-between; align-items: center"><p class="lbl">Leg workout · 17:34</p><span class="chip live">Live from Claude</span></div><h2 style="font-size: 20px">Romanian Deadlift</h2><p>Next · set 2 of 3</p><p style="font-size: 26px; font-weight: 600">80 kg × 8</p><p class="mut">rest 2 min · started 17:34</p><p class="lbl" style="margin-top: 6px">Sets so far</p><div class="row" style="padding: 8px 0"><span>1</span><span>80 kg × 8</span></div><p class="lbl" style="margin-top: 6px">Tell Claude</p>' + say("Log my next set") + say("End my session") + '<p class="mut" style="font-size: 11.5px">This page updates as Claude logs.</p>')
after = mk('<p class="lbl">Today › After · Legs</p><h2 style="font-size: 20px">Leg workout, done</h2><p class="mut">Wed 18 Nov · 17:34–18:05 · 31 min</p><p class="lbl" style="margin-top: 4px">Plan against done</p><p>no plan</p><div class="panel" style="padding: 12px 14px; background: #f0f0ee"><p class="lbl">Coach’s take</p><p style="margin-top: 2px; line-height: 1.5">Next legs, keep the weights and add a rep where you can.</p></div><p class="lbl" style="margin-top: 4px">This week per muscle</p><p>Glutes 5 sets · Quads 4 sets · Hamstrings 2 sets</p><p class="mut" style="line-height: 1.5">Glutes, quads and hamstrings are low this week (under 10 sets): the coach adds sets to the next plan.</p><p class="lbl" style="margin-top: 4px">Recovery</p><p class="mut" style="line-height: 1.5">Quads, glutes, hamstrings · ready Fri afternoon. Back · ready now. Next: Upper A, Thu. It fits: those muscles are rested by then.</p><p class="lbl" style="margin-top: 4px">Next time</p><p>Back Squat 100 kg, all 8s · Romanian Deadlift 80 kg, all 10s</p><div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 6px"><div class="tile"><b>Working sets</b><span class="big" style="font-size: 22px">4</span></div><div class="tile"><b>Volume</b><span class="big" style="font-size: 22px">2.1k kg</span></div><div class="tile"><b>Records</b><span class="big" style="font-size: 22px">0</span><span class="sub">none this time</span></div><div class="tile"><b>Time</b><span class="big" style="font-size: 22px">31 min</span></div></div>')
sdk = head('<div><p class="lbl">Today › Before, during and after</p><h1 style="font-size: 28px; margin-top: 6px">Three views of the same screen</h1></div>') + '<div style="display: flex; flex-wrap: wrap; gap: 14px; align-items: flex-start">' + before + during + after + '</div>'
write("SessionDesktop", page("SessionDesktop","Before, during and after","Today",sdk,900,FOOT2+" The After page also carries an exercise table (today, last time, all-time best, last 8 times) and a muscles panel with a range switch (last session · this week · 90 days · 1 year · all time); they are not drawn here."))
print("part 4 done")
