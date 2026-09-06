<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### New Features

-   Layout items accept `draggable` and `resizable` flags. A non-draggable
    item is pinned: it cannot be dragged and holds its index while the
    other items reorder; a non-resizable item keeps its size
    ([#81967](https://github.com/WordPress/gutenberg/pull/81967)).
-   `DashboardGrid` and `DashboardLanes` accept `itemLimits`: per-item minimum and maximum tile sizes in pixels (`GridItemLimits`; width-only `GridItemWidthLimits` on lanes), enforced on rendered spans and resize gestures without being written into the layout ([#81899](https://github.com/WordPress/gutenberg/pull/81899)).

### Internal

-   Remove unused dependency `@dnd-kit/utilities` ([#82103](https://github.com/WordPress/gutenberg/pull/82103)).

## 0.6.0 (2026-08-26)

### Internal

-   Rename CSS module class names to kebab-case to satisfy `selector-class-pattern`. ([#82053](https://github.com/WordPress/gutenberg/pull/82053))
-   Point tsconfig references at split dependencies' build projects. ([#81514](https://github.com/WordPress/gutenberg/pull/81514), [#81518](https://github.com/WordPress/gutenberg/pull/81518))
-   Split tsconfig into a build project and a default dev project; story and test declarations are no longer published to npm. ([#81509](https://github.com/WordPress/gutenberg/pull/81509))

## 0.5.0 (2026-08-12)

### Internal

-   Remove obsolete dependency grouping comments as part of the repository-wide separator-free import migration. ([#81248](https://github.com/WordPress/gutenberg/pull/81248))

## 0.4.0 (2026-07-29)

### Internal

-   Update Jest type definitions to v30 ([#80767](https://github.com/WordPress/gutenberg/pull/80767)).

## 0.3.0 (2026-07-14)

### Enhancements

-   Widen React peer dependency ranges to `^18 || ^19` to support both React 18 and React 19 environments ([#80024](https://github.com/WordPress/gutenberg/pull/80024)).

## 0.2.0 (2026-07-01)

## 0.1.0 (2026-06-24)

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
