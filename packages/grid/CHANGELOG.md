<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### Enhancements

-   Rework the default edit-mode `GridOverlay` to paint per-row marker
    tiles (with `border-radius` md) inside each column instead of
    column backgrounds, outlines, and repeating row dividers. Theme via
    `--wp-grid-overlay-tile-bg`.
    `GridOverlayRenderProps` now includes `rows` for uniform-row grids.
-   Animate sibling tiles when layout reflows during drag or resize in
    edit mode (FLIP transform). Respects `prefers-reduced-motion`.
-   Add `--wp-grid-placeholder-outline-style` and
    `--wp-grid-resize-preview-outline-style` CSS custom properties for
    the drag-placeholder outline (default `dashed`) and resize-preview
    border (default `solid`).
-   Set `data-wp-dashboard-grid-resizing` on the `DashboardGrid` root
    element while any tile resize gesture is active, so consumers can
    adjust styles when the pointer may still hover tiles ([#78234](https://github.com/WordPress/gutenberg/pull/78234)).

### New Features

-   Initial release. Ships two layout components:
    -   `DashboardGrid`, a 2D packed grid with explicit `(width,
        height)` spans, drag-to-reorder and resize handles.
    -   `DashboardLanes`, a masonry-style surface aligned with the
        WebKit `display: grid-lanes` spec. Tiles declare a column
        span only; heights are driven by content; placement follows
        a source-ordered, shortest-lane skyline with a
        `flow-tolerance` tiebreaker. Falls back to a JS-driven
        polyfill on browsers without native support.
-   Export `DashboardGridLayoutItem`, `DashboardGridProps`,
    `DashboardLanesLayoutItem`, and `DashboardLanesProps` types.
-   Add `renderDragPreview` prop and `DragPreviewRenderProps` type on
    both surfaces for consumers that need to wrap the dragged-clone
    visual with their own chrome. The surface keeps a thin functional
    frame (lift scale, grabbing cursor, pointer pass-through) around
    the consumer's wrapper.
-   Expose CSS custom properties for theming the lift scale,
    placeholder opacity, placeholder outline color, and placeholder
    radius (`--wp-grid-drag-preview-scale`,
    `--wp-grid-placeholder-opacity`,
    `--wp-grid-placeholder-outline-color`,
    `--wp-grid-placeholder-radius`).

### Breaking changes

-   Remove the `spacing` prop from `DashboardGrid` and `DashboardLanes`.
    The gap between tiles is now owned by the design-system gap token
    (`--wpds-dimension-gap-md`) applied in CSS; override via theme or
    density rather than per instance. `GridOverlayRenderProps` no
    longer exposes `spacing` or `gapPx`; the overlay inherits the same
    gap token. The `DashboardGridSpacing` type export is removed.

### Internal

-   Organize the package source under `dashboard-grid/`,
    `dashboard-lanes/`, and `shared/` so each layout model owns its
    component, types, stories, and tests.
-   Drop the default visual layer on the drag-preview wrapper
    (shadow). The dragged clone now renders the consumer's children
    directly inside the functional frame; visual chrome is owned by
    the consumer either through the tile children themselves or via
    `renderDragPreview`.
