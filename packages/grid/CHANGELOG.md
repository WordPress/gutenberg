<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### New Features

-   Initial release: `DashboardGrid`, a 2D packed grid component with drag-to-reorder and resize handles for dashboard-style surfaces.
-   `DashboardGridLayoutItem.width` is a discriminated value (`number | 'fill' | 'full'`) covering fixed-span, row-filling, and full-row tiles under a single prop.
-   Drag reorder uses `<DragOverlay>`: the dragged tile stays in place as a dashed placeholder while a clone follows the cursor.
-   Resize displays a dashed preview overlay that tracks the cursor across column and row steps.
-   `actionableArea` content on every tile is muted with `inert` while any tile is dragging or resizing, preventing hover tooltips on other tiles from interrupting a gesture.
-   Grid columns hold their computed widths even when a tile's content is wider than the column (`minmax(0, 1fr)`); content overflow is handled by the consumer.
-   `DashboardGrid` forwards refs to its root `<div>`, and standard `<div>` attributes (`id`, `aria-*`, `data-*`, event handlers, `style`) flow through.
