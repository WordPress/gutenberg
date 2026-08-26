<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### New Features

-   Widget chrome footer: `relevance: 'high'` actions mount as leading text
    links (declared icon as prefix) in a persistent strip under the widget
    body, `'medium'` as trailing compact affordances (icon-only with a
    declared icon); the "More" menu keeps the rest, and full-bleed widgets
    keep every action in the menu
    ([#81556](https://github.com/WordPress/gutenberg/pull/81556)).
-   A link action whose target the host recognizes as one of its own routes
    (the `links` capability from `useWidgetHost`) mounts the host router's
    link and navigates client-side; `download` and `openInNewTab` keep the
    plain anchor ([#81740](https://github.com/WordPress/gutenberg/pull/81740)).

### Documentation

-   Add a `HostLinks` story: a demo host whose `links` capability turns an
    in-app action target into a client-side route link, beside a plain
    anchor and a download
    ([#81740](https://github.com/WordPress/gutenberg/pull/81740)).

### Internal

-   Point tsconfig references at split dependencies' build projects. ([#81509](https://github.com/WordPress/gutenberg/pull/81509), [#81515](https://github.com/WordPress/gutenberg/pull/81515), [#81516](https://github.com/WordPress/gutenberg/pull/81516), [#81518](https://github.com/WordPress/gutenberg/pull/81518))
-   Split tsconfig into a build project and a default dev project so dev files are type checked without publishing their declarations. ([#81514](https://github.com/WordPress/gutenberg/pull/81514))

## 0.5.0 (2026-08-12)

### New Features

-   Tile spacing is host-tunable via `--wp-widget-dashboard-tile-padding` and
    `--wp-widget-dashboard-tile-header-gap`; the header gap follows the tile
    padding unless set apart ([#81352](https://github.com/WordPress/gutenberg/pull/81352)).
-   The actions "More" menu renders each action's resolved icon as the menu
    item prefix ([#81275](https://github.com/WordPress/gutenberg/pull/81275)).

### Enhancements

-   Widget chrome and picker preview chrome: preserve their flex-column layout
    when host styles reset semantic elements ([#80570](https://github.com/WordPress/gutenberg/pull/80570)).

### Documentation

-   Describe what the "More" menu mounts for a link fulfillment ([#80974](https://github.com/WordPress/gutenberg/pull/80974)).

### Internal

-   Widget actions menu: render the action icon directly; the widget types
    contract guarantees a renderable element ([#81381](https://github.com/WordPress/gutenberg/pull/81381)).
-   Remove obsolete dependency grouping comments as part of the repository-wide separator-free import migration. ([#81248](https://github.com/WordPress/gutenberg/pull/81248))

## 0.4.0 (2026-07-29)

### New Features

-   Surface a widget's declared `actions` in the tile chrome as a "More"
    menu of links ([#80363](https://github.com/WordPress/gutenberg/pull/80363)).

### Enhancements

-   Widget settings: use the `drawerRight` icon for the per-tile settings
    trigger instead of `moreVertical` ([#80208](https://github.com/WordPress/gutenberg/pull/80208)).
-   Widget toolbar: when the tile header lacks room for the inline attribute
    controls, the promoted fields collapse into a dropdown; the settings
    trigger stays in the toolbar ([#80208](https://github.com/WordPress/gutenberg/pull/80208)) ([#80423](https://github.com/WordPress/gutenberg/pull/80423])).

### Documentation

-   Prefer a static CSV asset over a `data:` URL in the goal-progress story ([#80510](https://github.com/WordPress/gutenberg/pull/80510)).
-   Add/improve default story and documentation ([#80423](https://github.com/WordPress/gutenberg/pull/80423])).
-   Document how attribute `relevance` maps to surfaces: the prominent
    surface, the settings surface, and the measured collapse ([#80208](https://github.com/WordPress/gutenberg/pull/80208)).

### Internal

-   Update Jest type definitions to v30 ([#80767](https://github.com/WordPress/gutenberg/pull/80767)).
-   Add a Storybook story reproducing the tile header with multiple
    high-relevance inline attribute controls ([#80208](https://github.com/WordPress/gutenberg/pull/80208)).
-   Mark the default runtime module `import()` with `@vite-ignore` alongside
    `webpackIgnore`, silencing Vite's import-analysis warning ([#80208](https://github.com/WordPress/gutenberg/pull/80208)).

## 0.3.0 (2026-07-14)

-   Remove layout-settings editing: the customize-toolbar button, the
    settings drawer, the layout-model switch commands, and the
    `onGridSettingsChange` prop. `gridSettings` is now read-only rendering
    configuration; the consumer owns the values and their persistence.

### New Features

-   Widget toolbar: edit high-relevance widget attributes inline from the
    tile toolbar.

### Enhancements

-   Widen React peer dependency ranges to `^18 || ^19` to support both React 18 and React 19 environments ([#80024](https://github.com/WordPress/gutenberg/pull/80024)).
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
