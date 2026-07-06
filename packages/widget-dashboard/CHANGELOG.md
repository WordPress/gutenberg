<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### Enhancements

-   `WidgetHeader`: surface the widget type's `help` note as an infotip
    beside the title: a click-open popover with the note and its links.

## 0.2.0 (2026-07-01)

## 0.1.0 (2026-06-24)

### New Features

-   Initial experimental release. Depends on WordPress core-private APIs and is
    intended to run inside WordPress core; not yet safe to consume as a
    standalone npm dependency from an external plugin.
-   `<WidgetDashboard>`: stateless compound component that renders an
    editable grid of widget instances, with staging of in-progress edits.
    Composable parts ship in the default composition (`Actions`, `Widgets`,
    `WidgetChrome`, `NoWidgetsState`, `Commands`); the inserter and the
    layout/widget settings overlays are mounted by the engine.
-   Grid-settings kit for host-side persistence: `WidgetGridSettings`,
    `DEFAULT_GRID`, `normalizeGridSettings`, `ROW_HEIGHT_PRESETS`,
    `DEFAULT_ROW_HEIGHT`, and `WIDGET_DASHBOARD_COLUMN_COUNT`.
