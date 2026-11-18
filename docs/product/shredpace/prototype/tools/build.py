import re, os, json, sys

HERE = os.path.dirname(os.path.abspath(__file__))
SRC  = os.path.join(HERE, "..", "project")
OUT  = os.path.join(HERE, "dist")
os.makedirs(OUT, exist_ok=True)

# --- 1. the shell (chrome, router, directory) is stored next to this script ----------------------------------
shell = open(os.path.join(HERE, "shell.html"), encoding="utf-8").read()

# --- 2. screens (transcribed from docs/product/shredpace/spec/screens-and-routes.md) + states added 2026-11-18 -------
S = [
 # id            route                    hash                 desk                 phone                 pro                                     locked             group
 ("landing",    "#landing",              "landing",           "Main",              "PhoneLanding",       None,                                   None,              "Public"),
 ("signin",     "#signin",               "signin",            "SignIn",            "SignIn",             None,                                   None,              "Public"),
 ("contact",    "#contact",              "contact",           "ContactPage",       "PhoneContactPage",   None,                                   None,              "Public"),
 ("consent",    "#consent",              "consent",           "ConsentPage",       "PhoneConsentPage",   None,                                   None,              "Public"),
 ("privacy",    "#privacy",              "privacy",           "Legal",             None,                 None,                                   None,              "Public"),
 ("terms",      "#terms",                "terms",             "Legal",             None,                 None,                                   None,              "Public"),
 ("connector",  "#connector",            "connector",         "SignIn",            "SignIn",             None,                                   None,              "Public"),
 ("today",      "#today",                "today",             "TodayDesktop",      "PhoneToday",         None,                                   None,              "Today & sessions"),
 ("sessions",   "#sessions",             "sessions",          "SessionsDesktop",   "PhoneSessions",      None,                                   None,              "Today & sessions"),
 ("session",    "#session/{id}",         "session",           "SessionDetail",     "PhoneSessionDetail", None,                                   None,              "Today & sessions"),
 ("before",     "#before",               "before",            "SessionDesktop",    "PhoneBefore",        None,                                   None,              "Today & sessions"),
 ("during",     "#during",               "during",            "SessionDesktop",    "PhoneDuring",        None,                                   None,              "Today & sessions"),
 ("after",      "#after/{id}",           "after",             "SessionDesktop",    "PhoneAfter",         None,                                   None,              "Today & sessions"),
 ("activities", "#activities",           "activities",        "Activities",        None,                 None,                                   None,              "Today & sessions"),
 ("exercises",  "#exercises",            "exercises",         "Exercises",         None,                 None,                                   None,              "Today & sessions"),
 ("food",       "#food",                 "food",              "FoodDesktop",       "PhoneFood",          None,                                   None,              "Food"),
 ("usuals",     "#food/usuals",          "food-usuals",       "MealExtras",        None,                 None,                                   None,              "Food"),
 ("usual",      "#food/usual/{id}",      "food-usual",        "MealExtras",        None,                 None,                                   None,              "Food"),
 ("nutrition",  "#food/settings",        "food-settings",     "NutritionSettings", None,                 None,                                   None,              "Food"),
 ("body",       "#body",                 "body",              "BodyDesktop",       "PhoneBody",          None,                                   None,              "Body & metrics"),
 ("scans",      "#body/scans",           "body-scans",        "BodyHistory",       None,                 None,                                   None,              "Body & metrics"),
 ("scan",       "#body/scan/{id}",       "body-scan",         "BodyHistory",       None,                 None,                                   None,              "Body & metrics"),
 ("metric",     "#metric/{id}",          "metric",            "TrackAnything",     None,                 None,                                   None,              "Body & metrics"),
 ("ache",       "#ache/{id}",            "ache",              "TrackAnything",     None,                 None,                                   None,              "Body & metrics"),
 ("goals",      "#goals",                "goals",             "GoalsDesktop",      "PhoneGoals",         None,                                   None,              "Goals"),
 ("goal",       "#goal/{id}",            "goal",              "GoalDetailDesktop", "PhoneGoalDetail",    None,                                   None,              "Goals"),
 ("habit",      "#habit/{id}",           "habit",             "SkillsHabits",      None,                 None,                                   None,              "Goals"),
 ("benchmark",  "#benchmark/{id}",       "benchmark",         "SkillsHabits",      None,                 None,                                   None,              "Goals"),
 ("plan",       "#plan",                 "plan",              "PlanPage",          None,                 None,                                   None,              "Plan"),
 ("plansetup",  "#plan/setup/{step}",    "plan-setup",        "PlanSetup",         None,                 None,                                   None,              "Plan"),
 ("planweek",   "#plan/week/{date}",     "plan-week",         "NotesWeekConsent",  None,                 None,                                   None,              "Plan"),
 ("zones",      "#plan/zones",           "plan-zones",        "Endurance",         None,                 None,                                   None,              "Plan"),
 ("progress",   "#progress",             "progress",          None,                None,                 ("ProProgress","PhoneProProgress"),     None,              "Pro"),
 ("coach",      "#coach",                "coach",             None,                None,                 ("ProCoach","PhoneProCoach"),           "FreeCoachLocked", "Pro"),
 ("programs",   "#plan/program",         "plan-program",      None,                None,                 ("ProPrograms","PhoneProPrograms"),     "FreeCoachLocked", "Pro"),
 ("activity",   "#activity",             "activity",          "ActivityHistory",   "AgentTrail",         None,                                   None,              "Audit"),
 ("connect",    "#connect",              "connect",           "ConnectAgentV2",    None,                 None,                                   None,              "Audit"),
 ("settings",   "#settings",             "account",           "Settings",          None,                 None,                                   None,              "Account"),
 ("gym",        "#settings/gym",         "account-gym",       "GymWeights",        None,                 None,                                   None,              "Account"),
 ("appearance", "#settings/appearance",  "account-appearance","Appearance",        None,                 None,                                   None,              "Account"),
 ("healthdetails","#settings/privacy",   "account-privacy",   "Settings",          "ConsentSettings",    None,                                   None,              "Account"),
 ("pro",        "#pro",                  "billing",           "Billing",           None,                 None,                                   None,              "Account"),
 ("upgrade",    "#upgrade",              "go-pro",            "Upgrade",           None,                 None,                                   None,              "Account"),
 ("more",       "#more",                 "more",              "TodayDesktop",      "PhoneMore",          None,                                   None,              "Account"),
 # added 2026-11-18 from the changelog: states of existing screens, shown as their own entries
 ("st-missed",  "#today · missed day, time away, easing back",  "state-missed",     "MissedDays",     None,              None, None, "States added 18 Nov"),
 ("st-comeback","#today · the comeback question",               "state-comeback",   "TodayComeback",  None,              None, None, "States added 18 Nov"),
 ("st-studio",  "#today · Studio, before a first session",      "state-studio-new", "StudioNew",      None,              None, None, "States added 18 Nov"),
 ("st-key",     "#connect · key sheet on a phone",              "state-connect-key",None,             "ConnectKeyPhone", None, None, "States added 18 Nov"),
 ("st-avatar",  "#more · avatar menu on a phone",               "state-nav-more",   None,             "NavigationMore",  None, None, "States added 18 Nov"),
]
PUBLIC = {"landing","signin","contact","consent","privacy","terms","connector"}
LIMITED = {"progress"}
boards_of = lambda s: [b for b in (s[3], s[4], s[6]) if b] + (list(s[5]) if s[5] else [])
canon = {}
for s in S:
    for b in boards_of(s): canon.setdefault(b, s[2])

def scope_css(css, scope):
    if "@media" in css or "@supports" in css: raise SystemExit("at-rule in " + scope)
    out = []
    for sels, decls in re.findall(r'([^{}]+)\{([^{}]*)\}', css):
        sels, decls = sels.strip(), decls.strip()
        if not sels or not decls: continue
        parts = [scope if x.strip() in ("body","html",":root") else f"{scope} {x.strip()}" for x in sels.split(",") if x.strip()]
        out.append(", ".join(parts) + " { " + decls + " }")
    return "\n".join(out)

boards, css_parts = {}, []
for f in sorted(os.listdir(SRC)):
    if not f.endswith(".dc.html"): continue
    name = f[:-8]; src = open(os.path.join(SRC, f), encoding="utf-8").read()
    mt = re.search(r'<title>(.*?)</title>', src, re.S); mh = re.search(r'<helmet>(.*?)</helmet>', src, re.S)
    mb = re.search(r'</helmet>(.*?)</x-dc>', src, re.S); mp = re.search(r'"\$preview":\{"width":(\d+),"height":(\d+)\}', src)
    assert mh and mb and mp, f
    st = re.search(r'<style>(.*?)</style>', mh.group(1), re.S)
    css_parts.append(scope_css(st.group(1), f'.bd[data-board="{name}"]') if st else "")
    html = re.sub(r'href="([A-Za-z0-9]+)\.dc\.html"', lambda m: 'href="#%s"' % canon.get(m.group(1), "today"), mb.group(1))
    html = re.sub(r'href="#([A-Za-z0-9_-]+)"', lambda m: m.group(0) if m.group(1) in {s[2] for s in S} else 'data-scroll="%s"' % m.group(1), html)
    boards[name] = {"title": mt.group(1).strip() if mt else name, "w": int(mp.group(1)), "h": int(mp.group(2)), "html": html.strip()}

used = set(canon); disk = set(boards)
print("boards on disk:", len(disk), "| referenced by screens:", len(used))
print("referenced but absent:", sorted(used - disk) or "none", "| on disk but unreferenced:", sorted(disk - used) or "none")
assert not (used - disk)
data = {"screens": [{"id": s[0], "route": s[1], "hash": s[2], "desk": s[3], "phone": s[4], "pro": list(s[5]) if s[5] else None,
                     "locked": s[6], "group": s[7], "public": s[0] in PUBLIC, "limited": s[0] in LIMITED} for s in S], "boards": boards}
js = json.dumps(data, separators=(",", ":")).replace("<", "\\u003c")
page = shell.replace("/*__BOARDS_CSS__*/", "\n".join(css_parts)).replace("/*__BOARDS_JSON__*/", js)
open(os.path.join(OUT, "index.html"), "w", encoding="utf-8").write(page)
print("screens:", len(S), "| boards:", len(boards), "| index.html:", len(page.encode()), "bytes")
