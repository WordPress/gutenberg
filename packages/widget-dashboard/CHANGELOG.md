<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

-   Remove layout-settings editing: the customize-toolbar button, the
    settings drawer, the layout-model switch commands, and the
    `onGridSettingsChange` prop. `gridSettings` is now read-only rendering
    configuration; the consumer owns the values and their persistence.

### New Features

-   Widget toolbar: edit high-relevance widget attributes inline from the
    tile toolbar.

### Enhancements

-   Widget grid: reserve top paint space for outward tile focus rings so scroll
    containers do not clip the widget chrome outline ([#79990](https://github.com/WordPress/gutenberg/pull/79990)).

### Internal

-   Rename CSS Module class selectors to kebab-case and drop the package
    suppressions from `stylelint-suppressions.json` ([#79990](https://github.com/WordPress/gutenberg/pull/79990)).
-   `WidgetHeader`: surface the widget type's `help` note as an infotip
    beside the title: a click-open popover with the note and its links.
-   Widget inserter: render more accurate widget previews.
-   Widget settings: anchor the settings drawer to the right edge and
    toggle it from the gear button.
-   Restructure the tile chrome: extract `WidgetHeader` and `WidgetFrame`,
    and move widget and layout controls into toolbar chips.

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
