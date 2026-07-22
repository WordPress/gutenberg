# Widget Dashboard

<div class="callout callout-alert">
This package is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

Stateless rendering engine for widget dashboards. `WidgetDashboard` renders an editable grid of widget instances behind a consumer-controlled edit mode: drag-to-reorder, resize, a modal inserter, per-widget settings, and command-palette integration.


## What it does not own

-   **The contract.** What a widget _is_, _asks_, and _shows_ belongs to primitives, layer by layer. See _Widget Primitives / Anatomy_.
-   **Data.** The engine is stateless. Widget types arrive through `widgetTypes`; the consumer owns `layout` and its persistence.

Widgets are one _concept_ the admin renders, among materials and surfaces shared across screens.
For that broader vocabulary, see [the admin materials and surfaces discussion](https://github.com/WordPress/gutenberg/issues/70913).
