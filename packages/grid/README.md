# Grid

<div class="callout callout-alert">
This package is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

A collection of grid layout components for arranging tiles in
dashboard-style surfaces.

This package exposes two components, each implementing a different
layout model:

-   **`DashboardGrid`** is a 2D packed grid: tiles declare explicit
    `(width, height)` spans in column/row units and can span multiple
    columns and rows.
-   **`DashboardLanes`** is a masonry-style surface aligned with the
    emerging WebKit spec [`display: grid-lanes`](https://webkit.org/blog/17660/introducing-css-grid-lanes/).
    Tiles declare a column span only; heights are driven by content;
    placement follows a source-ordered, shortest-lane skyline with a
    `flow-tolerance` tiebreaker.

## Installation

Install the module:

```bash
npm install @wordpress/grid --save
```

_This package assumes that your code will run in an **ES2015+** environment.
If you're using an environment that has limited or no support for such
language features and APIs, you should include [the polyfill shipped in
`@wordpress/babel-preset-default`](https://github.com/WordPress/gutenberg/tree/HEAD/packages/babel-preset-default#polyfill)
in your code._

## Setup

Component styles are CSS Modules injected at runtime when a component
mounts; there is no stylesheet to enqueue or import.

Visual defaults (tile gap, elevation, motion, placeholder strokes)
read the design tokens that `@wordpress/theme` publishes as
`--wpds-*` CSS custom properties.

### Within standard WordPress editor screens

In standard WordPress editor screens (such as the post editor or the
site editor), the design tokens stylesheet is managed centrally by
Gutenberg. You don't need to add any setup yourself.

### Elsewhere

Install and load the design tokens stylesheet in your application:

```bash
npm install @wordpress/theme
```

```js
import '@wordpress/theme/design-tokens.css';
```

Without the tokens the components stay functional, but gaps,
elevations, and interaction visuals lose their intended values.
Alternatively, define the `--wpds-*` custom properties the package
consumes yourself.

## Choosing a component

| Need                                                  | Use                                               |
| ----------------------------------------------------- | ------------------------------------------------- |
| Fixed-cell tile dashboard, content fills its cell.    | `DashboardGrid`                                   |
| Masonry / waterfall surface, content drives height.   | `DashboardLanes`                                  |
| Static layout primitive (no per-item state, no drag). | `__experimentalGrid` from `@wordpress/components` |

Both components here are higher-level: the user (not the developer)
places and resizes tiles, and the result is emitted through
`onChangeLayout`. For a static CSS Grid with no spans, drag, or
per-item state, use `__experimentalGrid` from `@wordpress/components`.

---

## `DashboardGrid`

A 2D packed grid where each child has an explicit column and row
span.

### Usage

```jsx
import { DashboardGrid } from '@wordpress/grid';

const layout = [
	{ key: 'a', width: 2, height: 2 },
	{ key: 'b', width: 4, height: 1 },
	{ key: 'c', width: 'fill', height: 1 },
	{ key: 'd', width: 'full', height: 1 },
];

function Dashboard() {
	const [ current, setCurrent ] = useState( layout );

	return (
		<DashboardGrid
			layout={ current }
			columns={ 6 }
			editMode
			onChangeLayout={ setCurrent }
		>
			<div key="a">Tile A</div>
			<div key="b">Tile B</div>
			<div key="c">Tile C</div>
			<div key="d">Tile D</div>
		</DashboardGrid>
	);
}
```

Each child **must** have a `key` prop that matches an entry in the
`layout` array. Children without a matching layout entry render at
the end of the grid without explicit placement and fall through
CSS Grid's auto-flow.

### Layout model

```ts
interface DashboardGridLayoutItem {
	key: string; // matches child key
	width?: number | 'fill' | 'full'; // column span (see below)
	height?: number; // rows to span
	order?: number; // lower values render first (responsive mode)
}
```

`width` is a discriminated value:

-   `number`: span that many columns (clamped to the grid's column count).
-   `'fill'`: fill the remaining columns in the current row.
-   `'full'`: span every column (`grid-column: 1 / -1`), forcing a row break.

`'fill'` is resolved per-row against the remaining free space.

### Props

| Prop                 | Type                                       | Default  | Description                                                                                                                                             |
| -------------------- | ------------------------------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `layout`             | `DashboardGridLayoutItem[]`                | —        | Required. Positions and sizes keyed by child `key`.                                                                                                     |
| `children`           | `ReactNode`                                | —        | Required. Each child needs a `key` matching a layout entry.                                                                                             |
| `columns`            | `number`                                   | `6`      | Total columns (fixed mode).                                                                                                                             |
| `minColumnWidth`     | `number`                                   | —        | If set, enables responsive mode: columns derived from container width. Mutually exclusive with `columns`.                                               |
| `rowHeight`          | `number \| 'auto'`                         | `'auto'` | Row height in pixels, or `'auto'` to let content size rows.                                                                                             |
| `editMode`           | `boolean`                                  | `false`  | Enables drag-to-reorder and resize handles.                                                                                                             |
| `onChangeLayout`     | `( layout ) => void`                       | —        | Fired when the user commits a drag or resize.                                                                                                           |
| `onPreviewLayout`    | `( layout ) => void`                       | —        | Fired continuously during a drag or resize with the in-progress layout. Use for live feedback; `onChangeLayout` still emits the committed result.       |
| `renderResizeHandle` | `ComponentType< ResizeHandleRenderProps >` | —        | Override the default corner-triangle resize handle. See [Custom resize handle](#custom-resize-handle).                                                  |
| `renderDragPreview`  | `ComponentType< DragPreviewRenderProps >`  | —        | Wrap the dragged-clone visual mounted inside `<DragOverlay>`. See [Custom drag preview](#custom-drag-preview).                                          |
| `renderGridOverlay`  | `ComponentType< GridOverlayRenderProps >`  | —        | Override the default edit-mode overlay that visualizes the column and row tracks. Receives the resolved `columns`, `rows`, `rowHeight`, and `isActive`. |
| `className`          | `string`                                   | —        | Extra class on the grid root.                                                                                                                           |
| `style`              | `CSSProperties`                            | —        | Inline styles on the grid root; the grid's own layout styles win over them.                                                                             |

`DashboardGrid` forwards refs to its root `<div>`, and standard
`<div>` attributes (`id`, `aria-*`, `data-*`, event handlers,
`style`, etc.) flow through. The grid's own layout styles
(`gridTemplateColumns`, `gridAutoRows`) override any user-supplied
`style` for those properties. Tile gap is owned by a design-system
token; override it with `--wp-grid-gap` (see [Theming with CSS
variables](#theming-with-css-variables)).

#### Child-level props

Children render with the layout entry that matches their `key`. An
optional prop read off the child lets you keep controls interactive
while edit mode is on:

| Child prop       | Type        | Description                                                                                                                                     |
| ---------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `actionableArea` | `ReactNode` | Content rendered above the draggable surface of the grid item. Useful for close buttons, menus, or links that must stay clickable in edit mode. |

### Modes

#### Fixed columns

```jsx
<DashboardGrid layout={ layout } columns={ 12 }>
	{ children }
</DashboardGrid>
```

#### Responsive

Columns are computed from container width using `minColumnWidth` as
the lower bound per column. A `ResizeObserver` recomputes on
container resize.

```jsx
<DashboardGrid layout={ layout } minColumnWidth={ 240 }>
	{ children }
</DashboardGrid>
```

In responsive mode, layout items can provide an `order` to control
display order independently of array position.

#### Edit mode

When `editMode` is true:

-   Items become draggable (powered by `@dnd-kit`). The original tile
    stays in place as a dashed placeholder while a clone follows the
    cursor through `<DragOverlay>`.
-   A resize handle appears on the bottom-right of each item. A
    solid outline previews the target size as the cursor moves.
-   While any tile is dragging or resizing, `actionableArea` content
    on every tile is set `inert` so hovers on other tiles can't steal
    the gesture.
-   `onChangeLayout` fires after drop or resize with the new layout.
-   `onPreviewLayout` fires continuously during the interaction for
    live feedback; the committed layout is still emitted via
    `onChangeLayout`.
-   Sibling tiles animate into their new positions when the layout
    reflows.

---

## `DashboardLanes`

A masonry-style surface aligned with `display: grid-lanes`. Items
declare a column span; heights are driven by content; placement
follows a source-ordered, shortest-lane skyline with a
`flow-tolerance` tiebreaker.

The layout model and the placement algorithm are described in
[Introducing CSS Grid Lanes](https://webkit.org/blog/17660/introducing-css-grid-lanes/)
on the WebKit blog. This package implements the same model in
JavaScript so it works today on browsers that do not yet support
`display: grid-lanes` natively; the skyline + tolerance core is
adapted from Simon Willison's
[CSS Grid Lanes Polyfill](https://tools.simonwillison.net/grid-lanes-polyfill.js)
(MIT). Once native support lands across browsers, the polyfill can
be removed without any public API change.

### Usage

```jsx
import { DashboardLanes } from '@wordpress/grid';

const layout = [
	{ key: 'a' },
	{ key: 'hero', width: 2 },
	{ key: 'b' },
	{ key: 'c' },
];

function Pinboard() {
	const [ current, setCurrent ] = useState( layout );

	return (
		<DashboardLanes
			layout={ current }
			columns={ 4 }
			editMode
			onChangeLayout={ setCurrent }
		>
			<Tile key="a">A</Tile>
			<Tile key="hero">Hero (spans 2 lanes)</Tile>
			<Tile key="b">B</Tile>
			<Tile key="c">C</Tile>
		</DashboardLanes>
	);
}
```

Each child **must** have a `key` prop that matches an entry in the
`layout` array. Children without a matching layout entry render at
the end of the surface without explicit placement and fall through
the lanes auto-flow.

### Layout model

```ts
interface DashboardLanesLayoutItem {
	key: string; // matches child key
	width?: number; // lanes to span (default 1)
	lane?: number; // 0-indexed: pin to a specific lane
	order?: number; // lower values render first
}
```

There is no `height` field: lanes pack tiles vertically using each
tile's intrinsic content height.

There is no `'fill'`: with auto-placement, no item is "left over"
in a row; the algorithm always finds a lane.

`'full'` (span the entire surface width) is expressed by setting
`width` to the lane count.

To anchor a tile to a specific column, set `lane` to its 0-indexed
position. Pinned tiles are placed before auto-placed ones, so auto
items flow around them; out-of-range values (negative, or beyond
`columns - width`) are clamped.

### Props

| Prop                 | Type                                       | Default | Description                                                                                                                                                                                             |
| -------------------- | ------------------------------------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `layout`             | `DashboardLanesLayoutItem[]`               | —       | Required. Span and order keyed by child `key`.                                                                                                                                                          |
| `children`           | `ReactNode`                                | —       | Required. Each child needs a `key` matching a layout entry.                                                                                                                                             |
| `columns`            | `number`                                   | `6`     | Total lanes (fixed mode).                                                                                                                                                                               |
| `minColumnWidth`     | `number`                                   | —       | If set, enables responsive mode: lane count derived from container width. Mutually exclusive with `columns`.                                                                                            |
| `flowTolerance`      | `number`                                   | `16`    | Pixel tolerance for source-order tiebreaking when two candidate lanes have similar baselines. Larger values keep tiles closer to reading order at the cost of bigger empty regions.                     |
| `rowUnit`            | `number`                                   | `4`     | Snap unit for the polyfill's `grid-row-start` math. Smaller values produce sharper placement at the cost of a larger implicit row count. Ignored on browsers with native `display: grid-lanes` support. |
| `editMode`           | `boolean`                                  | `false` | Enables drag-to-reorder and horizontal resize.                                                                                                                                                          |
| `onChangeLayout`     | `( layout ) => void`                       | —       | Fired when the user commits a drag or resize.                                                                                                                                                           |
| `onPreviewLayout`    | `( layout ) => void`                       | —       | Fired continuously during a drag or resize.                                                                                                                                                             |
| `renderResizeHandle` | `ComponentType< ResizeHandleRenderProps >` | —       | Override the default side-grip resize handle. See [Custom resize handle](#custom-resize-handle).                                                                                                        |
| `renderDragPreview`  | `ComponentType< DragPreviewRenderProps >`  | —       | Wrap the dragged-clone visual mounted inside `<DragOverlay>`. See [Custom drag preview](#custom-drag-preview).                                                                                          |
| `renderGridOverlay`  | `ComponentType< GridOverlayRenderProps >`  | —       | Override the default edit-mode overlay that visualizes the lane tracks. Receives the resolved `columns` and `isActive`; lanes pass no row metrics because heights are content-driven.                   |
| `className`          | `string`                                   | —       | Extra class on the surface root.                                                                                                                                                                        |
| `style`              | `CSSProperties`                            | —       | Inline styles on the surface root; the surface's own layout styles win over them.                                                                                                                       |

### Native vs polyfill

`DashboardLanes` checks `CSS.supports( 'display', 'grid-lanes' )`
once at mount.

-   When supported (Safari 26+, others as the spec ships), the
    component emits `display: grid-lanes` and the spec's CSS, and lets
    the engine handle layout. The placement layer mounts no per-tile
    observers; the only `ResizeObserver` left is the container-width
    one used for responsive mode and resize-step math.
-   When unsupported, an internal hook (`useLanePlacement`) measures
    each tile's height with a `ResizeObserver`, runs the source-ordered
    shortest-lane algorithm, and emits explicit `grid-column-start`
    and `grid-row-start` / `grid-row-end: span N` values on each tile.

The same DOM contract is preserved in both paths; the visual is the
same.

### Edit mode

Drag-to-reorder works the same as in `DashboardGrid`. Resize is
**horizontal-only**: tile heights are content-driven, so there is
no vertical resize gesture. The default handle is a vertical bar
centered on the trailing edge; the cursor is `ew-resize`.

Sibling tiles animate into their new positions when the layout
reflows.

---

## Shared topics

### Performance

`onPreviewLayout` re-renders the parent on every gesture frame. To
keep the components' internal children walk from re-running each
frame, **memoize the children array** when its content is stable:

```jsx
const tiles = useMemo(
	() => layout.map( ( item ) => <Tile key={ item.key }>...</Tile> ),
	[ layout ]
);

return (
	<DashboardLanes layout={ layout } editMode onPreviewLayout={ ... }>
		{ tiles }
	</DashboardLanes>
);
```

Without it the surface still works but walks the children on every
preview update; the overhead is minor up to ~50 tiles and grows
from there. For `DashboardLanes`, placement runs in a
`useLayoutEffect` throttled to one frame per measurement burst.

### Accessibility

Drag-to-reorder is operable from the keyboard via `@dnd-kit`'s
keyboard sensor:

-   `Tab` to focus a tile.
-   `Space` to pick it up.
-   Arrow keys to move it between positions.
-   `Space` to drop, or `Escape` to cancel.

Resize handles are currently pointer-only.

### Custom resize handle

Both components accept a `renderResizeHandle` prop to override the
default visual. The surface owns the resize math (column/row
stepping, throttled delta loop, layout commit) and passes the
gesture wiring (`ref`, `listeners`, `attributes`) as props for the
consumer to spread on the element that should receive pointer
events. The dnd-kit `<DndContext>` for the resize gesture is
internal to the handle wrapper; consumers do not need to mount
their own.

```jsx
import { Icon } from '@wordpress/ui';
import { resizeCornerNE } from '@wordpress/icons';

function CustomResizeHandle( {
	ref,
	listeners,
	attributes,
	verticalResizable,
} ) {
	return (
		<div
			ref={ ref }
			{ ...listeners }
			{ ...attributes }
			style={ {
				position: 'absolute',
				bottom: 4,
				insetInlineEnd: 4,
				cursor: verticalResizable ? 'nwse-resize' : 'ew-resize',
			} }
		>
			<Icon icon={ resizeCornerNE } size={ 16 } />
		</div>
	);
}

<DashboardGrid
	layout={ layout }
	editMode
	renderResizeHandle={ CustomResizeHandle }
>
	{ tiles }
</DashboardGrid>;
```

The component receives:

| Prop                | Type                                | Description                                                                                                           |
| ------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `ref`               | `( node ) => void`                  | dnd-kit ref; assign on the gesture-bearing element.                                                                   |
| `listeners`         | `SyntheticListenerMap \| undefined` | Pointer/keyboard listeners; spread on the same element.                                                               |
| `attributes`        | `DraggableAttributes`               | Accessibility/dnd-kit attributes; spread alongside `listeners`.                                                       |
| `verticalResizable` | `boolean`                           | False on `DashboardLanes` and on `DashboardGrid` with `rowHeight: 'auto'`. Useful for adapting cursor or visual cue.  |
| `isResizing`        | `boolean`                           | True while the user is actively dragging this handle. Use it to swap colors, icons, or transforms during the gesture. |
| `itemId`            | `string`                            | Owning tile's `key`.                                                                                                  |

The handle is only mounted while the surface is in edit mode
(`editMode={ true }`), so the custom component never has to
short-circuit on a disabled state.

### Custom drag preview

While a tile is being dragged, dnd-kit clones it into a `<DragOverlay>`
that follows the cursor. Both surfaces wrap that clone with a thin
**functional frame** (`scale`, `cursor: grabbing`, `pointer-events:
none`) that advertises the lift, but they do not impose visual
chrome on top: any styles the consumer applied to the tile children
carry through to the dragged clone unchanged.

When the dragged state should look structurally different from the
persistent tile (a stronger shadow, a different border, an extra
badge…), pass a `renderDragPreview` component. The surface mounts
it inside the functional frame and supplies the cloned children
plus the active tile's `key`:

```jsx
import { DashboardGrid } from '@wordpress/grid';
import type { DragPreviewRenderProps } from '@wordpress/grid';

function DragPreview( { children }: DragPreviewRenderProps ) {
	return (
		<div className="my-tile-while-dragging">
			{ children }
		</div>
	);
}

<DashboardGrid
	layout={ layout }
	editMode
	renderDragPreview={ DragPreview }
>
	{ tiles }
</DashboardGrid>;
```

The component receives:

| Prop       | Type        | Description                                                                                                                 |
| ---------- | ----------- | --------------------------------------------------------------------------------------------------------------------------- |
| `children` | `ReactNode` | The cloned tile content the surface mounts inside `<DragOverlay>`. Place it where the visual wrapper expects the tile body. |
| `itemId`   | `string`    | Owning tile's `key`. Useful when chrome varies by tile.                                                                     |

For token-only tweaks (lift scale, placeholder opacity, outline
color, placeholder radius), prefer the [CSS variables](#theming-with-css-variables)
below; reach for `renderDragPreview` only when the dragged state
needs markup the persistent tile does not have.

### Theming with CSS variables

Both surfaces expose a small set of CSS custom properties for
visuals that need to flex between consumers without writing a render
prop. Override them on any ancestor of the surface root (or on the
root itself via `style`). All values fall back to sensible defaults.

| Variable                                 | Default                                             | Applies to                                                                                                            |
| ---------------------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--wp-grid-gap`                          | `var(--wpds-dimension-gap-xl)`                      | Gap between tiles on `DashboardGrid`, `DashboardLanes`, and the edit overlay.                                         |
| `--wp-grid-drag-preview-scale`           | `1.05`                                              | Lift scale of the drag-preview functional frame. Set to `1` to disable the lift.                                      |
| `--wp-grid-drag-preview-radius`          | `0`                                                 | Border radius of the drag-preview functional frame so the lift shadow follows the consumer's tile shape.              |
| `--wp-grid-placeholder-opacity`          | `0.4`                                               | Opacity of the placeholder tile (the original item while a drag is in flight).                                        |
| `--wp-grid-placeholder-outline-style`    | `dashed`                                            | Outline style of the drag placeholder (for example `solid` or `dotted`).                                              |
| `--wp-grid-resize-preview-outline-style` | `solid`                                             | Border style of the resize-preview overlay (for example `dashed` or `dotted`).                                        |
| `--wp-grid-placeholder-outline-color`    | `var(--wpds-color-stroke-interactive-brand)`        | Outline color of the placeholder and of the resize-preview overlay.                                                   |
| `--wp-grid-placeholder-radius`           | `0`                                                 | Border radius of the placeholder, used to match the consumer's tile shape so the outline traces the right silhouette. |
| `--wp-grid-overlay-tile-bg`              | `var(--wpds-color-background-surface-neutral-weak)` | Background of the marker tiles painted by the default edit-mode overlay.                                              |

---

## Contributing to this package

This is an individual package that's part of the Gutenberg project.
The project is organized as a monorepo. It's made up of multiple
self-contained software packages, each with a specific purpose. The
packages in this monorepo are published to [npm](https://www.npmjs.com/)
and used by [WordPress](https://make.wordpress.org/core/) as well as
other software projects.

To find out more about contributing to this package or Gutenberg as a
whole, please read the project's main
[contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
