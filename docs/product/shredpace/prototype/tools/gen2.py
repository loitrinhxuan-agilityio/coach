import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *
from gen1 import head, banner, tile2, FOOT, write   # re-running gen1 is harmless (rewrites the same files)

def crumbhead(crumb, href, title, sub=''):
    subhtml = ('<p class="mut" style="font-size: 13px; margin-top: 6px">' + sub + '</p>') if sub else ''
    inner = ('<div><a href="' + href + '" style="font-size: 13px; text-decoration: none; min-height: 44px; display: inline-flex; align-items: center">‹ ' + crumb
             + '</a><h1 style="font-size: 30px; margin-top: 2px">' + title + '</h1>' + subhtml + '</div>')
    return head(inner)

# ---------------- Activity ----------------
def chips(items, on): return '<span class="seg" style="flex-wrap: wrap">'+''.join('<button type="button"%s>%s</button>' % (ON if i==on else '', t) for i,t in enumerate(items))+'</span>'
def act(time, who, text, by):
    return f'<div class="row" style="padding: 12px 0"><span style="display: flex; gap: 12px; align-items: center"><span class="mut" style="font-size: 12px; min-width: 40px">{time}</span><span class="av" style="width: 26px; height: 26px; font-size: 11px; background: {"#d9e3f7" if who=="C" else "#f2cdb8"}">{who}</span><span>{text}<small>{by}</small></span></span><span class="ch">Details · <a href="ActivityHistory.dc.html">Open ›</a></span></div>'
act_main = crumbhead("Settings","Settings.dc.html","Activity","Everything your agents and you have changed. Undo works for 7 days; older items open where you can change them.") + f'''
    <div style="display: flex; flex-wrap: wrap; gap: 14px 24px"><div><p class="lbl" style="margin-bottom: 6px">Who</p>{chips(["Everyone","Claude","You"],0)}</div><div><p class="lbl" style="margin-bottom: 6px">What</p>{chips(["All","To check","Sessions","Food","Body","Goals and plan","Settings"],0)}</div></div>
    <p class="mut" style="font-size: 12px">Each agent is named after its key (Settings › API keys). Removing a key keeps its history here.</p>
    <div class="panel" style="padding: 6px 20px"><p class="lbl" style="padding-top: 14px">Today</p>
      {act("18:10","C","Added a meal: Chicken rice bowl, 650 kcal","Claude")}{act("18:10","C","Weight 82.3 kg","Claude")}{act("18:02","C","Logged 4 sets in Leg workout","Claude")}{act("18:02","C","Started Leg workout","Claude")}
      <p class="lbl" style="padding-top: 16px">Yesterday · Tue 17 Nov</p>
      {act("08:14","C","Started Full Body A","Claude")}{act("08:13","C","Added a program: Beginner Full-Body Muscle","Claude")}{act("08:11","Y","Added an API key: Claude","Someone")}</div>'''
write("ActivityHistory", page("ActivityHistory","What changed","Settings",act_main,900,FOOT))

# ---------------- Settings ----------------
def srow(t, sub, val='›', href='#'):
    inner = '<span>' + t + '<small>' + sub + '</small></span><span class="ch">' + val + '</span>'
    return ('<a class="row" href="' + href + '">' + inner + '</a>') if href != '#' else ('<div class="row">' + inner + '</div>')
set_main = head('<div><h1 style="font-size: 30px">Settings</h1></div>') + f'''
    <div style="display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-start">
      <div class="panel" style="flex: 1 1 340px; min-width: 0; padding: 6px 20px"><p class="lbl" style="padding-top: 14px">Yours, here</p>
        {srow("Appearance","Studio · your device’s mode","›","Appearance.dc.html")}{srow("Agents and keys","Connect Claude, Grok, any bot · make or revoke a key","›","ConnectAgentV2.dc.html")}{srow("Privacy and consent","What agents may read and write","›","ConsentSettings.dc.html")}{srow("Plan","Pro, free during early access","Early Pro","Upgrade.dc.html")}{srow("Export, sign out, delete account","Your data, your account")}{srow("Fix it by hand","When your agent can’t: edit here for an hour")}</div>
      <div class="panel" style="flex: 1 1 340px; min-width: 0; padding: 6px 20px"><p class="lbl" style="padding-top: 14px">Set by your agent</p>
        {srow("Name and units","","Sam · kg · km")}{srow("Body type","How your figure is drawn","Not set")}{srow("Your gym","Bar, plates, dumbbells, kettlebells, machines","20 kg bar","GymWeights.dc.html")}{srow("Food goal","","Not set","NutritionSettings.dc.html")}{srow("Coach check-ins","Morning plan, Monday recap, stalls","All on","ProCoach.dc.html")}{srow("What your agents know","0 notes they all read","0")}
        <p class="mut" style="font-size: 12px; padding: 14px 0; line-height: 1.5">Workouts, sets, food, body, goals<br>Shown here; changed by telling your agent</p></div>
    </div>
    <div style="display: flex; flex-direction: column; gap: 8px"><p class="lbl">To change one, tell Claude</p>{say("Use pounds")}</div>'''
write("Settings", page("Settings","Settings","Settings",set_main,900,FOOT))

# ---------------- Appearance ----------------
themes=[("Ember","Charcoal and orange, condensed italic."),("Chalk and iron","Graphite, chalk and lime, sharp."),("Trail","Slate, paper and signal yellow."),("Blush","Rose and plum, a soft italic serif."),("Sage","Sage and cream, calm and airy."),("Lilac","Lavender and violet, crisp and modern."),("Studio","Warm paper, frosted cards, light type.")]
SELCHIP = '<span class="chip" style="background:#141416;color:#fff">Selected</span>'
trows=''.join('<div class="row" style="padding: 11px 0"><span><strong>%s</strong><small>%s</small></span>%s</div>' % (n, t, SELCHIP if n=="Studio" else "") for n,t in themes)
app_main = crumbhead("Settings","Settings.dc.html","Appearance") + f'''
    <div style="display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-start">
      <div style="flex: 1 1 340px; min-width: 0; display: flex; flex-direction: column; gap: 14px">
        <div class="panel" style="padding: 6px 20px"><p class="lbl" style="padding-top: 14px">Theme</p>{trows}</div>
        <div class="panel" style="padding: 18px 20px"><p class="lbl">Mode</p><div style="margin-top: 10px"><span class="seg"><button type="button">System</button><button type="button" class="on">Light</button><button type="button">Dark</button></span></div><p class="mut" style="font-size: 12px; margin-top: 10px; line-height: 1.5">Follows your device. It is light right now.</p><p class="mut" style="font-size: 12px; margin-top: 6px; line-height: 1.5">Saved to your account, so your phone and laptop match. Your agent can change it too: “switch my dashboard to Trail”.</p></div>
      </div>
      <div class="panel" style="flex: 1 1 300px; min-width: 0; padding: 20px; display: flex; flex-direction: column; gap: 12px"><p class="lbl">Preview</p>
        <div style="padding: 14px; border-radius: 12px; background: #f0f0ee"><p class="lbl">Next set · from your trainer</p><p style="font-size: 22px; font-weight: 600; margin-top: 6px">72.5 kg × 8</p><p class="mut" style="font-size: 12px">Barbell Row · set 3 of 4</p></div>
        <div style="display: flex; gap: 10px"><div class="tile" style="flex: 1"><b>Streak</b><span class="big">10</span><span class="sub">weeks in a row</span></div><div class="tile" style="flex: 1"><b>This week</b><span class="big">16</span><span class="sub">sessions in 30 days</span></div></div>
        <div class="row" style="padding: 8px 0"><span><strong>Pull day</strong><small>FRI · Strength · 72.5 kg</small></span></div><div class="row" style="padding: 8px 0"><span><strong>Morning run</strong><small>WED · Run · 5:32/km</small></span></div></div>
    </div>'''
write("Appearance", page("Appearance","Appearance","Settings",app_main,900,FOOT+" The preview card’s figures are the preview’s own sample data on the live page."))

# ---------------- Gym ----------------
def gl(n, sub, val): return f'<div class="row"><span>{n}<small>{sub}</small></span><span style="display: flex; gap: 10px; align-items: center"><span class="chip">Agent</span><span class="ch">{val}</span></span></div>'
gym_main = crumbhead("Settings","Settings.dc.html","Your gym","What your gym has, so every target is a weight you can pick up.") + f'''
    <div class="panel" style="padding: 6px 20px"><p class="lbl" style="padding-top: 14px">Free weights</p>
      {gl("Bar","Barbell sets read as totals","20 kg, the usual")}{gl("Plates","in pairs","25, 20, 15, 10, 5, 2.5, 1.25 kg, the usual")}{gl("Dumbbells","per hand","Not set")}{gl("Kettlebells","","Not set")}{gl("Machines","","None yet")}</div>
    <p class="mut" style="font-size: 12.5px; line-height: 1.55">Until your agent knows, dumbbells, kettlebells and machines round to 2.5 kg steps.</p>
    <div style="display: flex; flex-direction: column; gap: 8px"><p class="lbl">To change one, tell Claude</p>{say("Tell Claude what my gym has")}</div>'''
write("GymWeights", page("GymWeights","Your gym","Settings",gym_main,900,FOOT))

# ---------------- Settings > Plan (#upgrade) ----------------
plan_set = crumbhead("Settings","Settings.dc.html","Settings") + '''
    <div class="panel" style="padding: 24px; display: flex; flex-direction: column; gap: 12px; max-width: 640px"><p class="lbl">Plan</p>
      <div style="display: flex; gap: 10px; align-items: center"><h2 style="font-size: 26px">Pro</h2><span class="chip" style="background: #141416; color: #fff">Early Pro</span></div>
      <p style="font-size: 13.5px; line-height: 1.6">Free while Shredpace is in early access. Everything in Pro is on: your whole history, several agents, the coach’s take, programs, every theme and export.</p>
      <p class="mut" style="font-size: 12.5px; line-height: 1.6">When pricing is ready you’ll see the date here at least 14 days ahead. Nothing you log is ever deleted.</p></div>
    <div class="panel" style="padding: 22px; max-width: 640px; display: flex; flex-direction: column; gap: 8px"><h2 style="font-size: 17px">Help shape Shredpace</h2><p class="mut" style="font-size: 13px">You’re one of the first. What works, what doesn’t, what’s missing?</p><div><button type="button" style="min-height: 44px; padding: 0 22px; border-radius: 999px; border: 0; background: #141416; color: #fff; font-family: inherit; font-weight: 600; font-size: 13px; cursor: pointer">Send feedback</button></div><p class="mut" style="font-size: 12px">Or tell your agent: it sends it for you.</p></div>'''
write("Upgrade", page("Upgrade","Plan","Settings",plan_set,900,FOOT+" On the live site #upgrade redirects here."))

# ---------------- Welcome (#pro) ----------------
tick=lambda t: f'<div class="row" style="padding: 11px 0"><span>✓ &nbsp;{t}</span></div>'
welcome = head('<div></div>') + f'''
    <div class="panel" style="padding: 28px; max-width: 560px; margin: 24px auto 0; width: 100%; box-sizing: border-box; display: flex; flex-direction: column; gap: 10px">
      <p class="lbl">Wed 18 Nov</p><h1 style="font-size: 30px">Almost there</h1><p class="mut" style="font-size: 13px">Finishing up…</p>
      <p class="lbl" style="margin-top: 12px">What’s new for you</p>
      {tick("Your whole history, back to your first session")}{tick("Several agents: add Grok beside Claude")}{tick("The coach’s take, every week")}{tick("Five more themes, and export")}
      <div style="display: flex; gap: 10px; align-items: center; margin-top: 12px; flex-wrap: wrap"><a href="Appearance.dc.html" style="min-height: 44px; padding: 0 20px; border-radius: 999px; border: 1px solid #ececea; display: inline-grid; place-items: center; text-decoration: none; color: #141416; font-size: 13px; font-weight: 600">Pick a theme</a><a href="TodayDesktop.dc.html" style="font-size: 13px; text-decoration: none; min-height: 44px; display: inline-flex; align-items: center">Back to Today ›</a></div></div>'''
write("Billing", page("Billing","Welcome","Settings",welcome,900,FOOT+" Seen at #pro for an early-Pro account; the checkout and payment screens were not seen."))

# ---------------- Zones ----------------
zc=lambda s,t: f'<div class="panel" style="flex: 1 1 220px; min-width: 0; padding: 20px"><p class="lbl">{s} · no test yet</p><p style="font-size: 15px; font-weight: 600; margin-top: 10px; line-height: 1.4">{t}</p></div>'
zones_main = crumbhead("Coach","PlanPage.dc.html","Your zones") + f'''
    <div style="display: flex; flex-wrap: wrap; gap: 14px">{zc("Run","A 5 km time trial sets your paces")}{zc("Ride","A 20-minute FTP test sets your watts")}{zc("Swim","A 400 and a 200 set your CSS")}</div>
    <p class="mut" style="font-size: 12.5px; line-height: 1.55">Heart rate zones show instead where there’s no test yet (from your max or a lab number).</p>'''
write("Endurance", page("Endurance","Zones","Coach",zones_main,900,FOOT))

# ---------------- Plan setup ----------------
setup_main = head('<div><h1 style="font-size: 30px">Your plan</h1><p class="mut" style="font-size: 13px; margin-top: 6px">Your agent sets up your plan</p></div>') + f'''
    <div class="panel" style="padding: 22px; max-width: 680px; display: flex; flex-direction: column; gap: 12px"><p class="lbl">Tell Claude</p><p style="font-size: 13.5px; line-height: 1.6">Claude asks what it needs: your goal, your days and your time, any injuries. Your plan fills in here as it goes.</p>{say("Set up my plan: ask me what you need")}</div>
    <div class="panel" style="padding: 6px 20px; max-width: 680px"><div class="row"><span><span class="lbl">Goal</span><small style="font-size: 13.5px; color: #141416; margin-top: 6px">Not set yet</small></span></div><div class="row"><span><span class="lbl">Days and time</span><small style="font-size: 13.5px; color: #141416; margin-top: 6px">4 days a week</small></span></div><div class="row"><span><span class="lbl">Program</span><small style="font-size: 13.5px; color: #141416; margin-top: 6px">Upper/Lower Muscle Builder</small></span></div></div>'''
write("PlanSetup", page("PlanSetup","Your plan","Coach",setup_main,900,FOOT))

# ---------------- Food targets ----------------
def tg(n, sub, on): 
    bg = '#141416' if on else '#c9c9c4'; pos = 'right: 3px' if on else 'left: 3px'
    return f'<div class="row"><span>{n}<small>{sub}</small></span><button type="button" class="sw" style="background: {bg}" aria-label="{"On" if on else "Off"}"><i style="{pos}"></i></button></div>'
nut_main = crumbhead("Food","FoodDesktop.dc.html","Food targets") + f'''
    <div class="panel" style="padding: 20px; max-width: 680px"><p class="lbl">Focus</p><h2 style="font-size: 20px; margin-top: 8px">No focus yet</h2><p class="mut" style="font-size: 12.5px; margin-top: 6px">Pick a goal above, and your daily targets are worked out for you.</p></div>
    <div class="panel" style="padding: 6px 20px; max-width: 680px">{tg("Calories","the main number for weight",True)}{tg("Protein, carbs and fat","bars under calories",True)}{tg("Fibre","optional",False)}{tg("Show numbers","off: Today shows on track or not, without figures",True)}</div>
    <div style="display: flex; flex-direction: column; gap: 8px; max-width: 680px"><p class="lbl">Tell Claude</p>{say("Ask me my protein target")}</div>'''
write("NutritionSettings", page("NutritionSettings","Food targets","Food",nut_main,900,FOOT))

# ---------------- Usuals ----------------
us_main = crumbhead("Food","FoodDesktop.dc.html","Your usuals") + '''
    <div class="panel" style="padding: 22px; max-width: 680px"><p style="font-size: 13.5px; line-height: 1.6" class="mut">No usuals yet. Tell your agent “save this as my usual” after a meal.</p></div>'''
write("MealExtras", page("MealExtras","Your usuals","Food",us_main,900,FOOT))

# ---------------- Scans ----------------
sc_main = crumbhead("Body","BodyDesktop.dc.html","All scans") + '''
    <div class="panel" style="padding: 24px; max-width: 680px"><h2 style="font-size: 18px">No scans yet</h2><p class="mut" style="font-size: 13px; margin-top: 8px; line-height: 1.55">Send your agent a photo of your scale’s app or a scan report, or weigh in.</p></div>
    <p class="mut" style="font-size: 12.5px; max-width: 680px; line-height: 1.55">Newest first. A partial scan shows what it has; its metrics’ pages skip it for the rest.</p>'''
write("BodyHistory", page("BodyHistory","All scans","Body",sc_main,900,FOOT))

# ---------------- Before and During ----------------
sd_main = head('<div><p class="lbl">Today › Before and during</p><h1 style="font-size: 28px; margin-top: 6px">Two views of the same screen</h1></div>') + f'''
    <div style="display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-start">
      <div class="panel" style="flex: 1 1 320px; min-width: 0; padding: 20px; display: flex; flex-direction: column; gap: 10px"><p class="lbl">Today › Before</p><h2 style="font-size: 22px">Nothing planned</h2><p class="mut" style="font-size: 12.5px">Wed 18 Nov</p><p style="font-size: 14px; font-weight: 600; margin-top: 6px">No targets for today</p><p class="mut" style="font-size: 12.5px; line-height: 1.55">Your next planned day is Thu 19 Nov · Upper A.</p><a href="SessionDesktop.dc.html" style="font-size: 13px; font-weight: 600; text-decoration: none; color: #141416; min-height: 44px; display: inline-flex; align-items: center">Preview targets ›</a><p class="mut" style="font-size: 12px; line-height: 1.55">Training anyway? Tell Claude “starting full body”: it logs as you go and Before fills in.</p><p class="lbl" style="margin-top: 8px">This week</p><p style="font-size: 12.5px">1 of 4 sessions · Full Body</p></div>
      <div class="panel" style="flex: 1 1 340px; min-width: 0; padding: 20px; display: flex; flex-direction: column; gap: 10px"><div style="display: flex; justify-content: space-between; align-items: center"><p class="lbl">Leg workout · 18:02</p><span class="chip live">Live from Claude</span></div>
        <h2 style="font-size: 24px">Goblet Squat</h2><p style="font-size: 14px">Next · set 1 of 3 <span style="font-size: 22px; font-weight: 600; margin-left: 8px">× 12</span></p><p class="mut" style="font-size: 12px">started 18:02</p>
        <p class="lbl" style="margin-top: 8px">Up next</p>
        <div style="display: flex; flex-direction: column; font-size: 13px"><div class="row" style="padding: 9px 0"><span>Dumbbell Bench Press</span><span class="ch">3 × 8–12 · find it</span></div><div class="row" style="padding: 9px 0"><span>Lat Pulldown</span><span class="ch">3 × 10–12 · find it</span></div><div class="row" style="padding: 9px 0"><span>Romanian Deadlift</span><span class="ch">3 × 10–12 · find it</span></div></div>
        <p class="lbl" style="margin-top: 6px">Tell Claude</p>{say("Log my next set")}{say("Swap this exercise")}{say("End my session")}<p class="mut" style="font-size: 12px">This page updates as Claude logs.</p></div>
    </div>'''
write("SessionDesktop", page("SessionDesktop","Before and during","Today",sd_main,900,FOOT+" After a session was not seen: the account had no finished session of its own to open."))

# ---------------- Connect (standalone, no rail) ----------------
conn = f'''<div style="min-height: 900px; display: grid; place-items: center; padding: 40px 20px; box-sizing: border-box"><div class="panel" style="padding: 30px; width: 100%; max-width: 460px; box-sizing: border-box; display: flex; flex-direction: column; gap: 12px"><p class="lbl">Your agents</p><h1 style="font-size: 26px">Claude is connected</h1><p class="mut" style="font-size: 13px">Last call 1 h ago</p><a href="TodayDesktop.dc.html" style="min-height: 44px; display: grid; place-items: center; border-radius: 999px; background: #141416; color: #fff; text-decoration: none; font-size: 13.5px; font-weight: 600">Go to Today ›</a><a href="ConnectKeyPhone.dc.html" style="min-height: 44px; display: grid; place-items: center; border-radius: 999px; border: 1px solid #ececea; text-decoration: none; color: #141416; font-size: 13.5px; font-weight: 600">Add another agent</a><p class="mut" style="font-size: 11.5px; line-height: 1.5; margin-top: 8px">Redrawn from the live page on 18 Nov. It renders on its own, without the rail. The page for adding an agent was not opened, so its steps are not shown here.</p></div></div>'''
write("ConnectAgentV2", doc("ConnectAgentV2","Your agents",conn,1280,900))

# ---------------- Consent (after agreeing) ----------------
cons = f'''<div style="min-height: 900px; display: grid; place-items: center; padding: 40px 20px; box-sizing: border-box"><div class="panel" style="padding: 30px; width: 100%; max-width: 500px; box-sizing: border-box; display: flex; flex-direction: column; gap: 12px"><p class="lbl">Your agent sent you here</p><h1 style="font-size: 26px">Health details</h1><p style="font-size: 14px; font-weight: 600">Done. Tell your agent it can try again.</p><p class="mut" style="font-size: 12.5px; line-height: 1.55">Agreed 17 Nov 2026 at 08:15 · text version 6. You can turn this off any time in Settings › Privacy.</p><a href="TodayDesktop.dc.html" style="min-height: 44px; display: grid; place-items: center; border-radius: 999px; background: #141416; color: #fff; text-decoration: none; font-size: 13.5px; font-weight: 600">Open the dashboard</a><a href="ContactPage.dc.html" style="font-size: 12.5px; min-height: 44px; display: inline-flex; align-items: center; text-decoration: none">Questions about this? Contact us ›</a><p class="mut" style="font-size: 11.5px; line-height: 1.5">Only the state after agreeing was seen. The question screen shown before agreeing was not.</p></div></div>'''
write("ConsentPage", doc("ConsentPage","Health details",cons,1280,900))
print("batch 2 written")
