<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### New Features

-   Initial experimental release.
-   `<WidgetDashboard>`: stateless compound component that renders an
    editable grid of widget instances, with staging of in-progress
    edits, a modal inserter, per-widget settings, a layout-settings
    drawer, and command palette integration (`Widgets`, `WidgetChrome`,
    `Actions`, `NoWidgetsState`).
-   Grid-settings kit for host-side persistence: `WidgetGridSettings`,
    `DEFAULT_GRID`, `normalizeGridSettings`, `ROW_HEIGHT_PRESETS`,
    `DEFAULT_ROW_HEIGHT`, and `WIDGET_DASHBOARD_COLUMN_COUNT`.
