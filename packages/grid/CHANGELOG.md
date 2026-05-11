<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### New Features

-   Add `renderDragPreview` prop and `DragPreviewRenderProps` type for
    consumers that need to wrap the dragged-clone visual with their
    own chrome. The grid keeps a thin functional frame (lift scale,
    grabbing cursor, pointer pass-through) around the consumer's
    wrapper.
-   Expose a small set of CSS custom properties for theming the lift
    scale, placeholder opacity, placeholder outline color, and
    placeholder radius (`--wp-grid-drag-preview-scale`,
    `--wp-grid-placeholder-opacity`,
    `--wp-grid-placeholder-outline-color`,
    `--wp-grid-placeholder-radius`).

### Internal

-   Drop the default visual layer on `.drag-preview` (shadow,
    border-radius, overflow). The dragged clone now renders the
    consumer's children directly inside the functional frame; visual
    chrome is owned by the consumer either through the tile children
    themselves or via `renderDragPreview`.
-   Initial release of `DashboardGrid` (2D packed grid with drag-to-
    reorder and resize handles).
