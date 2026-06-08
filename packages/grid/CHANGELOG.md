<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### Code Quality

-   Add missing `@types/react` dependency. [#78882](https://github.com/WordPress/gutenberg/pull/78882).

### Enhancements

-   Clamp tile resize so width cannot shrink below a single column
    track (and height below a single row on `DashboardGrid` when
    vertical resize is enabled).
-   Rework the default edit-mode `GridOverlay` to paint per-row marker
    tiles (with `border-radius` md) inside each column instead of
    column backgrounds, outlines, and repeating row dividers. Theme via
    `--wp-grid-overlay-tile-bg`.
    `GridOverlayRenderProps` now includes `rows` for uniform-row grids.
-   Animate sibling tiles when layout reflows during drag or resize in
    edit mode (FLIP transform). Respects `prefers-reduced-motion`.
-   Animate tile removal in edit mode: the removed tile scales down and
    fades out while siblings reflow into place (FLIP). Respects
    `prefers-reduced-motion`.
-   Add `--wp-grid-placeholder-outline-style` and
    `--wp-grid-resize-preview-outline-style` CSS custom properties for
    the drag-placeholder outline (default `dashed`) and resize-preview
    border (default `solid`).
-   Add `--wp-grid-drag-preview-radius` so consumers can round the
    drag-preview functional frame without targeting package internals.
-   Animate drag preview `box-shadow` from resting `xs` to `md` (same
    motion tokens as scale) and apply static `md` when reduced motion
    is requested, on the `.drag-preview-frame` wrapper (both surfaces).
    Widget dashboard edit tiles use `xs` at rest and on hover so only
    the drag preview elevates to `md`.
    On drop, compose `@dnd-kit/core`'s default `DragOverlay` translation
    with preview exit keyframes (via drop side effects). Split scale into
    an inner `__lift` wrapper so drop translation does not fight the lift
    transform.
-   Defer placeholder fade and dashed outline until `data-wp-grid-dragging`
    is set and the drag-preview enter animation completes (both surfaces).
-   Set `data-wp-dashboard-grid-resizing` on the `DashboardGrid` root
    element while any tile resize gesture is active, so consumers can
    adjust styles when the pointer may still hover tiles ([#78234](https://github.com/WordPress/gutenberg/pull/78234)).
-   Set `data-wp-grid-resizing` and `data-wp-grid-dragging` on grid
    surface roots, and `data-wp-grid-item-resizing` on the active tile,
    so interaction chrome (resize handles, actionable areas) can be
    styled via CSS without per-tile props ([#78391](https://github.com/WordPress/gutenberg/pull/78391)).
-   Add `--wp-grid-gap` so consumers can set tile spacing per surface
    without remapping design-system tokens (defaults to
    `--wpds-dimension-gap-xl`).
-   Increase the default tile gap from `--wpds-dimension-gap-md` to
    `--wpds-dimension-gap-xl`.

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
    `--wp-grid-drag-preview-radius`,
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
