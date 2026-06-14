<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### New Features

-   Initial experimental release.
-   `<WidgetDashboard>`: stateless compound component that renders an
    editable grid of widget instances, with staging of in-progress
    edits and a set of composable overlays that ship in the default
    composition (`Widgets`, `WidgetChrome`, `Actions`, `NoWidgetsState`,
    `Commands`, `LayoutSettingsDrawer`, `Inserter`,
    `WidgetSettingsDrawer`).
-   Grid-settings kit for host-side persistence: `WidgetGridSettings`,
    `DEFAULT_GRID`, `normalizeGridSettings`, `ROW_HEIGHT_PRESETS`,
    `DEFAULT_ROW_HEIGHT`, and `WIDGET_DASHBOARD_COLUMN_COUNT`.
