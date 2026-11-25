# Gate 2 screenshots

[`quality-gates.md`](../../../docs/agents/quality-gates.md) Gate 2 asks that every screen a
change affects is checked against its approved board in [`docs/design/`](../../../docs/design/),
with the screenshots attached to the pull request and kept here. The directory existed only in
that sentence until now, which is why
[`development-preparation.md`](../../../docs/agents/development-preparation.md) item 6 gates
item 7: a gate that names a directory nothing created cannot be enforced.

This directory is the directory. Nothing generates its contents yet — there is no application
code to screenshot, so the first screenshots will be attached by hand to the first UI pull
request. When a UI test runner exists it should write here.

One file per screen per theme, named for the screen and the theme, so a reviewer can match a
screenshot to a board without opening it:

```
today-light.png
today-dark.png
```

A pull request that touches no UI marks Gate 2 "not applicable" and says why, so an empty
directory is the normal state for a change like this one.
