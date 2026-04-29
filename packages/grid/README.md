# Grid

A collection of grid layout components for arranging tiles in
dashboard-style surfaces.

This package currently exposes a single component, `DashboardGrid`,
which implements a **2D packed grid**: items have explicit
`(width, height)` spans in column/row units and can span multiple
columns **and** multiple rows. It does not implement other grid
models such as masonry (column-flow) or justified rows (equal-height
rows).

## Relation to `@wordpress/components`'s `__experimentalGrid`

`@wordpress/components` already exports a `__experimentalGrid` (often
imported as `Grid`). The two solve different problems:

- **`__experimentalGrid`** is a low-level CSS Grid layout primitive:
  it accepts `columns`, `gap`, `templateColumns`, `alignment`, etc.,
  and renders children in a static grid. There is no concept of an
  item having a span, no drag, no resize, no per-item state.
- **`DashboardGrid`** is a higher-level component for user-arrangeable
  tile surfaces. Items declare `(width, height)` spans, can be
  reordered via drag-and-drop and resized via handles in edit mode,
  and the resulting layout is emitted to the consumer through
  `onChangeLayout`.

Reach for `__experimentalGrid` when you only need static CSS Grid
ergonomics. Reach for `DashboardGrid` when the user — not the
developer — places and resizes the tiles.

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

## Usage

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
			spacing={ 2 }
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

Each child **must** have a `key` prop that matches an entry in the `layout`
array. Children without a matching layout entry are ignored.

## Layout model

```ts
interface DashboardGridLayoutItem {
	key: string;                       // matches child key
	width?: number | 'fill' | 'full';  // column span (see below)
	height?: number;                   // rows to span
	order?: number;                    // lower values render first (responsive mode)
}
```

`width` is a discriminated value:

- `number` — span that many columns (clamped to the grid's column count).
- `'fill'` — fill the remaining columns in the current row.
- `'full'` — span every column (`grid-column: 1 / -1`), forcing a row break.

`'fill'` is resolved per-row against the remaining free space.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `layout` | `DashboardGridLayoutItem[]` | — | Required. Positions and sizes keyed by child `key`. |
| `children` | `ReactNode` | — | Required. Each child needs a `key` matching a layout entry. |
| `columns` | `number` | `6` | Total columns (fixed mode). |
| `minColumnWidth` | `number` | — | If set, enables responsive mode: columns derived from container width. Mutually exclusive with `columns`. |
| `spacing` | `number` | `2` | Gap multiplier. Effective gap = `spacing * 4px`. |
| `rowHeight` | `number \| 'auto'` | `'auto'` | Row height in pixels, or `'auto'` to let content size rows. |
| `editMode` | `boolean` | `false` | Enables drag-to-reorder and resize handles. |
| `onChangeLayout` | `( layout ) => void` | — | Fired when the user commits a drag or resize. |
| `onPreviewLayout` | `( layout ) => void` | — | Fired continuously during a drag or resize with the in-progress layout. Use for live feedback; `onChangeLayout` still emits the committed result. |
| `renderResizeHandle` | `( props ) => ReactNode` | — | Override the default corner-triangle resize handle with a custom element. Receives gesture wiring (`ref`, `listeners`, `attributes`) plus `disabled`, `verticalResizable`, and `itemId`. The grid keeps ownership of the `<DndContext>` and the throttled delta loop. |
| `className` | `string` | — | Extra class on the grid root. |

`DashboardGrid` forwards refs to its root `<div>`, and standard `<div>`
attributes (`id`, `aria-*`, `data-*`, event handlers, `style`, etc.)
flow through. The grid's own layout styles
(`gridTemplateColumns`, `gridAutoRows`, `gap`) override any user-supplied
`style` for those properties.

### Child-level props

Children render with the layout entry that matches their `key`. An optional
prop read off the child lets you keep controls interactive while edit mode
is on:

| Child prop | Type | Description |
|------------|------|-------------|
| `actionableArea` | `ReactNode` | Content rendered above the draggable surface of the grid item. Useful for close buttons, menus, or links that must stay clickable in edit mode. |

## Modes

### Fixed columns

```jsx
<DashboardGrid layout={ layout } columns={ 12 }>
	{ children }
</DashboardGrid>
```

### Responsive

Columns are computed from container width using `minColumnWidth` as the
lower bound per column. A `ResizeObserver` recomputes on container
resize.

```jsx
<DashboardGrid layout={ layout } minColumnWidth={ 240 }>
	{ children }
</DashboardGrid>
```

In responsive mode, layout items can provide an `order` to control
display order independently of array position.

### Edit mode

When `editMode` is true:

- Items become draggable (powered by `@dnd-kit`). The original tile
  stays in place as a dashed placeholder while a clone follows the
  cursor through `<DragOverlay>`.
- A resize handle appears on the bottom-right of each item. A dashed
  outline previews the target size as the cursor moves.
- While any tile is dragging or resizing, `actionableArea` content on
  every tile is set `inert` so hovers on other tiles can't steal the
  gesture.
- `onChangeLayout` fires after drop or resize with the new layout.
- `onPreviewLayout` fires continuously during the interaction for
  live feedback; the committed layout is still emitted via
  `onChangeLayout`.

## Performance

`onPreviewLayout` typically causes the parent to re-render on every
gesture frame. To prevent the grid's internal children walk from
re-running on each of those frames, **memoize the children array**
when its content is stable across re-renders:

```jsx
const tiles = useMemo(
	() => layout.map( ( item ) => <Tile key={ item.key }>...</Tile> ),
	[ layout ]
);

return (
	<DashboardGrid layout={ layout } editMode onPreviewLayout={ ... }>
		{ tiles }
	</DashboardGrid>
);
```

Without memoization the grid still works, but it walks the children
on every preview update. For typical N (10–50 tiles) the overhead is
minor; for larger grids it adds up.

## Accessibility

Drag-to-reorder is operable from the keyboard via `@dnd-kit`'s
keyboard sensor:

- `Tab` to focus a grid item.
- `Space` to pick it up.
- Arrow keys to move it between positions.
- `Space` to drop, or `Escape` to cancel.

Resize handles are currently pointer-only.

## Custom resize handle

The default handle is a small corner triangle on the bottom-right of
each tile. To swap it for a custom element (icon, button, branded
shape…), pass `renderResizeHandle`. The grid still owns the gesture
— `<DndContext>`, throttled delta loop, step-to-grid logic — and
passes the wiring to your render prop. Spread `listeners` and
`attributes` and assign `ref` on the element that should receive
pointer events.

```jsx
import { Icon } from '@wordpress/ui';
import { resizeCornerNE } from '@wordpress/icons';

<DashboardGrid
	layout={ layout }
	editMode
	renderResizeHandle={ ( {
		ref,
		listeners,
		attributes,
		verticalResizable,
	} ) => (
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
	) }
>
	{ tiles }
</DashboardGrid>;
```

The render prop receives:

| Field | Type | Description |
|-------|------|-------------|
| `ref` | `( node ) => void` | dnd-kit ref; assign on the gesture-bearing element. |
| `listeners` | `SyntheticListenerMap \| undefined` | Pointer/keyboard listeners; spread on the same element. |
| `attributes` | `DraggableAttributes` | Accessibility/dnd-kit attributes; spread alongside `listeners`. |
| `verticalResizable` | `boolean` | False when `rowHeight: 'auto'` — useful for adapting cursor or visual cue. |
| `isResizing` | `boolean` | True while the user is actively dragging this handle. Use it to swap colors, icons, or transforms during the gesture. |
| `itemId` | `string` | Owning tile's `key`. |

The handle is only mounted while the grid is in edit mode (`editMode={ true }`),
so the consumer's render prop never has to short-circuit on a disabled state.

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
