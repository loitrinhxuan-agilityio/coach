# Shared Studio-light template for boards redrawn from the live dashboard (observed 2026-11-18).
# Palette and type are the real Studio theme (evidence/themes.json): accent = text colour, Inter 600, radius 14.
FONT = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap">'
CSS = """
body { margin: 0; background: #f5f5f3; color: #141416; font-family: 'Inter', system-ui, sans-serif; }
a { color: #67676b; } a:hover { color: #141416; }
h1, h2, h3 { font-family: 'Inter', sans-serif; font-weight: 600; margin: 0; letter-spacing: -.01em; }
p { margin: 0; }
.panel { background: #fbfbfa; border: 1px solid #ececea; border-radius: 14px; }
.lbl { font-size: 10.5px; letter-spacing: .09em; text-transform: uppercase; color: #67676b; font-weight: 600; margin: 0; }
.mut { color: #67676b; }
.nav a { display: block; padding: 12px 13px; border-radius: 999px; text-decoration: none; font-size: 13.5px; font-weight: 500; }
.nav a.on { background: #ececea; color: #141416; font-weight: 600; }
.seg { display: inline-flex; border: 1px solid #ececea; border-radius: 999px; padding: 2px; background: #fbfbfa; }
.seg a, .seg button { border: 0; background: none; min-height: 44px; padding: 0 18px; border-radius: 999px; font-family: inherit; font-size: 12.5px; font-weight: 600; color: #67676b; cursor: pointer; text-decoration: none; display: inline-grid; place-items: center; }
.seg .on { background: #141416; color: #ffffff; }
.tile { padding: 15px 16px; border-radius: 14px; background: #fbfbfa; border: 1px solid #ececea; min-width: 0; display: flex; flex-direction: column; gap: 4px; text-decoration: none; color: #141416; }
.tile.g { background: #e6f0e8; } .tile.o { background: #f7e8de; } .tile.p { background: #f8e5e5; }
.tile b { font-size: 11px; letter-spacing: .06em; text-transform: uppercase; color: #67676b; font-weight: 600; }
.tile .big { font-size: 30px; font-weight: 600; letter-spacing: -.02em; margin-top: 6px; font-variant-numeric: tabular-nums; }
.tile .sub { font-size: 11.5px; color: #67676b; line-height: 1.4; }
.chip { display: inline-block; padding: 3px 9px; border-radius: 999px; font-size: 10.5px; font-weight: 600; background: #ececea; color: #141416; }
.chip.live { background: #fbe9d9; color: #9a3412; }
.chip.ok { background: #dcefe1; color: #1f6a37; }
.say { display: flex; gap: 12px; align-items: center; justify-content: space-between; padding: 8px 8px 8px 14px; border-radius: 12px; background: #f0f0ee; }
.say span { font-size: 12.5px; color: #141416; min-width: 0; }
.say button { flex: 0 0 auto; min-height: 44px; padding: 0 18px; border-radius: 999px; border: 0; background: #141416; color: #ffffff; font-family: inherit; font-size: 12px; font-weight: 600; cursor: pointer; }
.row { display: flex; gap: 14px; align-items: center; justify-content: space-between; padding: 14px 0; border-bottom: 1px solid #ececea; text-decoration: none; color: #141416; font-size: 13.5px; }
.row:last-child { border-bottom: 0; }
.row small { display: block; font-size: 11.5px; color: #67676b; margin-top: 3px; font-weight: 400; }
.ch { color: #67676b; font-size: 12.5px; white-space: nowrap; }
.sw { flex: 0 0 auto; width: 44px; height: 26px; border-radius: 999px; position: relative; border: 0; cursor: pointer; }
.sw i { position: absolute; top: 3px; width: 20px; height: 20px; border-radius: 999px; background: #ffffff; }
table { border-collapse: collapse; width: 100%; font-size: 13px; }
th, td { text-align: left; padding: 11px 12px; border-bottom: 1px solid #ececea; }
th { color: #67676b; font-weight: 600; font-size: 10.5px; letter-spacing: .08em; text-transform: uppercase; }
td { font-variant-numeric: tabular-nums; }
.av { width: 34px; height: 34px; border-radius: 999px; background: #f2cdb8; display: grid; place-items: center; font-weight: 600; font-size: 13px; position: relative; flex: 0 0 auto; }
.av::after { content: ""; position: absolute; right: -1px; bottom: -1px; width: 9px; height: 9px; border-radius: 999px; background: #2f7d45; border: 2px solid #f5f5f3; }
"""
NAV = [("Today","TodayDesktop"),("Training","SessionsDesktop"),("Food","FoodDesktop"),("Body","BodyDesktop"),("Goals","GoalsDesktop")]
TOOLS = [("Ask Claude","ConnectAgentV2"),("Your agents","ConnectAgentV2"),("Coach","ProCoach"),("Settings","Settings")]

ON = ' class="on"'
def rail(active):
    n=''.join('<a%s href="%s.dc.html">%s</a>' % (ON if t==active else '', b, t) for t,b in NAV)
    t=''.join('<a%s href="%s.dc.html">%s</a>' % (ON if x==active else '', b, x) for x,b in TOOLS)
    return f'''<aside style="flex: 0 0 218px; min-width: 0; border-right: 1px solid #ececea; padding: 24px 14px; display: flex; flex-direction: column; gap: 18px; box-sizing: border-box; background: #f7f7f5">
    <span style="font-size: 17px; font-weight: 700; padding: 0 10px; letter-spacing: -.02em">Shredpace</span>
    <nav class="nav" style="display: flex; flex-direction: column; gap: 2px">{n}</nav>
    <div><p class="lbl" style="padding: 0 10px; margin-bottom: 6px">Tools</p><nav class="nav" style="display: flex; flex-direction: column; gap: 2px">{t}</nav></div>
    <a href="ConnectAgentV2.dc.html" class="panel" style="margin-top: auto; padding: 12px 14px; text-decoration: none; display: block"><strong style="font-size: 12px; color: #141416; display: block">Claude is connected</strong><span style="font-size: 11.5px; color: #67676b; line-height: 1.5">Last heard 18:02 · logs every set you send</span></a>
  </aside>'''

def top(crumb=None, crumb_href=None, right=True):
    left = f'<a href="{crumb_href}" style="font-size: 13px; text-decoration: none">‹ {crumb}</a>' if crumb else '<span></span>'
    r = '<div style="display: flex; gap: 12px; align-items: center"><span style="font-size: 11.5px; color: #67676b">Wed, Nov 18, 2026</span><span class="av">S</span></div>' if right else ''
    return f'<div style="display: flex; justify-content: space-between; align-items: center; min-height: 44px">{left}{r}</div>'

def seg(items, on):
    return '<span class="seg">' + ''.join('<a%s href="%s.dc.html">%s</a>' % (ON if t==on else '', h, t) for t,h in items) + '</span>'

TRAIN = [("Sessions","SessionsDesktop"),("Progress","ProProgress"),("Exercises","Exercises")]
COACHT = [("Plan","PlanPage"),("Coach","ProCoach")]

def say(text):
    return f'<div class="say"><span>“{text}”</span><button type="button">Copy</button></div>'

def tile(name, big, sub, tint='', href='#'):
    return f'<a class="tile {tint}" href="{href}"><b>{name}</b><span class="big">{big}</span><span class="sub">{sub}</span></a>'

def page(file, title, active, main, h=900, foot='', rail_on=True, w=1280):
    body = f'''<div style="display: flex; flex-wrap: wrap; min-height: {h}px; align-items: stretch">
  {rail(active) if rail_on else ''}
  <main style="flex: 999 1 560px; min-width: 0; padding: 18px 34px 28px; display: flex; flex-direction: column; gap: 16px; box-sizing: border-box">
{main}
{('<p style="margin: auto 0 0; font-size: 11.5px; color: #67676b; line-height: 1.55; max-width: 96ch">'+foot+'</p>') if foot else ''}
  </main>
</div>'''
    return doc(file, title, body, w, h)

def doc(file, title, body, w, h, css_extra=''):
    html = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>{title}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
{FONT}
<style>{CSS}{css_extra}
</style>
</helmet>

{body}
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":{w},"height":{h}}}}}'>
class Component extends DCLogic {{
  renderVals() {{ return {{}}; }}
}}
</script>
</body>
</html>
'''
    return html

def figure(tint=True):
    q = '#e8a39a' if tint else '#e6e0d9'
    h = '#e8b9b0' if tint else '#e6e0d9'
    return f'''<svg viewBox="0 0 120 250" width="132" height="275" role="img" aria-label="Body figure, quads tinted for this week's sets">
      <g fill="#e6e0d9"><circle cx="60" cy="19" r="13"/><rect x="38" y="38" width="44" height="70" rx="17"/><rect x="14" y="42" width="20" height="76" rx="10"/><rect x="86" y="42" width="20" height="76" rx="10"/></g>
      <g><rect x="40" y="110" width="18" height="70" rx="9" fill="{q}"/><rect x="62" y="110" width="18" height="70" rx="9" fill="{q}"/>
      <rect x="41" y="182" width="16" height="54" rx="8" fill="#e6e0d9"/><rect x="63" y="182" width="16" height="54" rx="8" fill="#e6e0d9"/></g>
    </svg>'''
