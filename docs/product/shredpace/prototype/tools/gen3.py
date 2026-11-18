import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "project") + "/"
ic = lambda d: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+d+'</svg>'
tabs=[("Today","TodayDesktop",ic('<path d="M4 11l8-7 8 7v9H4z"/>')),("Training","SessionsDesktop",ic('<path d="M4 12h16M7 8v8M17 8v8"/>')),("Food","FoodDesktop",ic('<path d="M7 3v8M11 3v8M9 11v10M16 3c-2 2-2 6 0 8v10"/>')),("Body","BodyDesktop",ic('<circle cx="12" cy="5" r="2"/><path d="M12 8v7M8 11h8M10 21l2-6 2 6"/>')),("Goals","GoalsDesktop",ic('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>'))]
tb=''.join('<a href="%s.dc.html" style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px; min-height: 44px; justify-content: center; text-decoration: none; font-size: 10.5px; color: %s; font-weight: %s">%s%s</a>' % (h, '#141416' if t=="Today" else '#67676b', '700' if t=="Today" else '500', i, t) for t,h,i in tabs)
body = f'''<div style="position: relative; width: 390px; height: 844px; box-sizing: border-box; overflow: hidden; background: #f5f5f3">
  <div style="height: 100%; overflow-y: auto; padding: 18px 16px 110px; display: flex; flex-direction: column; gap: 12px; box-sizing: border-box">
    <div style="display: flex; justify-content: space-between; align-items: flex-start">
      <div><p class="mut" style="font-size: 15px">Hello,</p><h1 style="font-size: 34px; margin-top: 2px">Sam.</h1><p class="mut" style="font-size: 13px; margin-top: 6px">Here’s your training today.</p><p style="font-size: 11.5px; margin-top: 4px">Wed, Nov 18, 2026</p></div>
      <a href="PhoneMore.dc.html" class="av" aria-label="Account menu" style="text-decoration: none; color: #141416">S</a>
    </div>
    <div class="panel" style="padding: 14px 16px"><strong style="font-size: 13.5px">Week 1: finding your weights</strong><p class="mut" style="font-size: 12.5px; margin-top: 6px; line-height: 1.5">For each lift, warm up, then work up until a set of 10 feels like 2–3 reps were left (RPE 7). Log that set. Next week’s targets come from it.</p><p style="font-size: 12.5px; margin-top: 8px"><strong>Effort, in one line</strong></p><p class="mut" style="font-size: 12px; margin-top: 2px">RPE 10 = nothing left · 9 = one more rep · 8 = two more · 7 = three more.</p></div>
    <div class="panel" style="padding: 14px 16px"><div style="display: flex; justify-content: space-between; gap: 10px"><strong style="font-size: 13.5px">Claude changed 4 things today</strong><a href="AgentTrail.dc.html" style="font-size: 12px; font-weight: 600; text-decoration: none; color: #141416; white-space: nowrap">What changed ›</a></div><p class="mut" style="font-size: 12.5px; margin-top: 4px">Logged 4 sets in Leg workout · 18:02</p></div>
    <div class="panel" style="padding: 14px; display: flex; flex-direction: column; align-items: center; gap: 6px"><div style="display: flex; justify-content: space-between; align-items: center; width: 100%"><span class="lbl">Drag to turn</span><span class="seg"><button type="button" class="on">Front</button><button type="button">Back</button></span></div>{figure(True)}<p class="mut" style="font-size: 11.5px; text-align: center">Quads · 3 sets · Wednesday<br>Tracked by your agent, set by set.</p></div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px"><a class="tile g" href="SessionsDesktop.dc.html"><b>This week</b><span class="big">1</span><span class="sub">of 4 sessions</span><span class="chip ok" style="align-self: flex-start">On plan</span></a><a class="tile o" href="ProProgress.dc.html"><b>Volume</b><span class="big">2.1</span><span class="sub">tonnes this week</span></a></div>
  </div>
  <nav aria-label="Main" style="position: absolute; left: 14px; right: 14px; bottom: 14px; display: flex; padding: 6px 8px; border-radius: 999px; background: #fbfbfa; border: 1px solid #ececea; box-shadow: 0 10px 30px -10px rgba(0,0,0,.25)">{tb}</nav>
</div>'''
open(OUT+"PhoneToday.dc.html","w",encoding="utf-8").write(doc("PhoneToday","Today on a phone",body,390,844))
print("PhoneToday written")
