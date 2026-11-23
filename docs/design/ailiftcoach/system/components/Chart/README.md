# Chart

A line or bar chart of training data over time. The system has one chart component because a
dashboard with five chart styles is a dashboard nobody can read quickly.

## Rules

- **Four series is the ceiling.** `series-1` to `series-4`, in order. A fifth line is a second
  chart. The ramp varies in lightness as well as hue, so a chart survives greyscale and the two
  most common colour-blindnesses.
- **Context is ghosted, not coloured.** Last time, the plan, a projection, a target band — anything
  that is not measured fact — takes `series-ghost` and is drawn dashed. A reader should be able to
  tell fact from forecast without the legend.
- **Label the endpoint.** The last value is what a lifter came for, so mark it with a filled dot
  and name it in the legend: *Back Squat · 96 → 117 kg*. A chart whose numbers appear only on the
  axis makes people estimate.
- **Every axis label names a value the data reaches.** Do not tick at 120 when the series tops out
  at 117. Pick ticks inside the real range, and let the top tick be the maximum where that reads
  cleanly.
- **One scale per chart.** Two series with different units on shared axes is two charts drawn on
  top of each other. Back Squat and Bench Press share kg, so they share a chart; bodyweight does
  not belong with them.
- **Axis text is `ink-muted`, grid lines are `line`.** The data is the only thing at full strength.
- **Name the unit in the subtitle**, not after every tick: *Top set of each session, Epley, kg*.

## When not to draw one

A trend needs at least three readings over a week or more, and a progress line needs two weeks of
sessions. Below that, show `EmptyState` with the threshold — one point is not a direction, and a
chart drawn from two points invents a slope the data cannot support.

## Accessibility

Series are distinguishable in greyscale by lightness. Marks carry their value in the legend, so the
chart is readable without hover. Every drawn shape has an explicit fill: no shape inherits a colour
that only exists in one theme.

## Consumer provides

The series, their unit, the tick values, and which series are fact and which are context. The
component does no rounding — a figure is rounded once where it is computed.
