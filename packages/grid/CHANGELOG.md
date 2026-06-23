<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### New Features

-   Initial experimental release. Ships two layout components sharing
    the same layout-as-data contract (a `layout` array keyed by child
    `key`, `editMode`, and `onChangeLayout` / `onPreviewLayout`
    callbacks):
    -   `DashboardGrid`, a 2D packed grid with explicit
        `(width, height)` spans, drag-to-reorder, and resize handles.
    -   `DashboardLanes`, a masonry-style surface aligned with the
        WebKit `display: grid-lanes` spec. Tiles declare a column span
        only; heights are driven by content; placement follows a
        source-ordered, shortest-lane skyline with a `flow-tolerance`
        tiebreaker. Uses the native engine when supported and falls
        back to a JS-driven polyfill otherwise.
-   Keyboard-accessible drag-to-reorder on both surfaces, with sibling
    tiles animating into place on reflow (respects
    `prefers-reduced-motion`).
-   `renderResizeHandle`, `renderDragPreview`, and `renderGridOverlay`
    render props on both surfaces for consumers that need custom
    interaction chrome.
-   CSS custom properties for theming the tile gap, drag preview,
    placeholder, resize preview, and edit-mode overlay without
    touching package internals.
-   Export the `DashboardGridLayoutItem`, `DashboardGridProps`,
    `DashboardLanesLayoutItem`, `DashboardLanesProps`,
    `DragPreviewRenderProps`, `GridOverlayRenderProps`, `ResizeDelta`,
    and `ResizeHandleRenderProps` types.
