<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### New Features

-   Add `DashboardLanes`, a masonry-style surface aligned with the
    WebKit `display: grid-lanes` spec. Tiles declare a column span
    only; heights are driven by content; placement follows a
    source-ordered, shortest-lane skyline with a `flow-tolerance`
    tiebreaker. Falls back to a JS-driven polyfill on browsers
    without native support.
-   Export `DashboardLanesLayoutItem` and `DashboardLanesProps` types.

### Internal

-   Reorganize the package source under `dashboard-grid/`,
    `dashboard-lanes/`, and `shared/` so each layout model owns its
    component, types, stories, and tests.
-   Initial release of `DashboardGrid` (2D packed grid, kept under
    its own folder).
