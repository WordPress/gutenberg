# Grid

CSS-Grid-based layout component with drag-to-reorder and resize handles,
designed for dashboard-style surfaces where users arrange tiles.

Ported from `@automattic/grid` (~400 LOC) and adapted to Gutenberg
conventions.

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
import { Grid } from '@wordpress/grid';

const layout = [
	{ key: 'a', width: 2, height: 2 },
	{ key: 'b', width: 4, height: 1 },
	{ key: 'c', fillWidth: true, height: 1 },
	{ key: 'd', fullWidth: true, height: 1 },
];

function Dashboard() {
	const [ current, setCurrent ] = useState( layout );

	return (
		<Grid
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
		</Grid>
	);
}
```

Each child **must** have a `key` prop that matches an entry in the `layout`
array. Children without a matching layout entry are ignored.

## Layout model

```ts
interface GridLayoutItem {
	key: string;      // matches child key
	width?: number;   // columns to span
	height?: number;  // rows to span
	order?: number;   // lower values render first (responsive mode)
	fullWidth?: boolean; // spans all columns (grid-column: 1 / -1)
	fillWidth?: boolean; // fills remaining columns in the row
}
```

`fullWidth` and `fillWidth` are mutually exclusive. `fillWidth` is
resolved per-row against remaining free space — see
`resolve-fill-widths.ts` for the algorithm and `src/test/` for the
exhaustive unit tests.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `layout` | `GridLayoutItem[]` | — | Required. Positions and sizes keyed by child `key`. |
| `children` | `ReactNode` | — | Required. Each child needs a `key` matching a layout entry. |
| `columns` | `number` | `6` | Total columns (fixed mode). |
| `minColumnWidth` | `number` | — | If set, enables responsive mode: columns derived from container width. Mutually exclusive with `columns`. |
| `spacing` | `number` | `2` | Gap multiplier. Effective gap = `spacing * 4px`. |
| `rowHeight` | `number \| 'auto'` | `'auto'` | Row height in pixels, or `'auto'` to let content size rows. |
| `editMode` | `boolean` | `false` | Enables drag-to-reorder and resize handles. |
| `onChangeLayout` | `( layout ) => void` | — | Fired when the user commits a drag or resize. |
| `onPreviewLayout` | `( layout ) => void` | — | Fired continuously during a drag or resize with the in-progress layout. Use for live feedback; `onChangeLayout` still emits the committed result. |
| `className` | `string` | — | Extra class on the grid root. |

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
<Grid layout={ layout } columns={ 12 }>
	{ children }
</Grid>
```

### Responsive

Columns are computed from container width using `minColumnWidth` as the
lower bound per column. A `ResizeObserver` recomputes on container
resize.

```jsx
<Grid layout={ layout } minColumnWidth={ 240 }>
	{ children }
</Grid>
```

In responsive mode, layout items can provide an `order` to control
display order independently of array position.

### Edit mode

When `editMode` is true:

- Items become draggable (powered by `@dnd-kit`).
- A resize handle appears on the bottom-right of each item.
- `onChangeLayout` fires after drop or resize with the new layout.
- `onPreviewLayout` fires continuously during the interaction for
  live feedback; the committed layout is still emitted via
  `onChangeLayout`.

During an interaction the component uses an internal `temporaryLayout`
to preview changes without triggering parent re-renders; the final
state is only emitted once the interaction commits. The underlying
`SortableContext` is intentionally configured with a no-op strategy —
visual reordering is driven by `temporaryLayout` + CSS Grid re-render,
not by dnd-kit's built-in transforms.

## Accessibility

Edit mode is operable from the keyboard via `@dnd-kit`'s keyboard
sensor:

- `Tab` to focus a grid item.
- `Space` to pick it up.
- Arrow keys to move it between positions.
- `Space` to drop, or `Escape` to cancel.

Resize is currently pointer-only. Improving keyboard and screen-reader
support for resize is tracked as a follow-up.

## Architecture

```
Grid                 orchestrator: columns, gap, edit mode, DndContext
 ├─ GridItem         per-cell: drag source + sortable + resize host
 │   └─ ResizeHandle bottom-right corner grab
 └─ resolveFillWidths  computes widths for fillWidth items per row
```

### Dependencies

- `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` —
  drag-and-drop primitives
- `@wordpress/compose` — `useResizeObserver`, `useDebounce`, `useEvent`
- `@wordpress/element` — React re-exports

### Consumer responsibility

`Grid` is a **layout primitive** and is agnostic about what each
tile contains — children can be widgets, plain text, blocks, or any
React node. The consumer owns the layout state (positions, sizes)
and decides how each tile's content is rendered:

```jsx
import { Grid } from '@wordpress/grid';

function Surface( { items, layout, onChangeLayout } ) {
	return (
		<Grid layout={ layout } editMode onChangeLayout={ onChangeLayout }>
			{ items.map( ( item ) => (
				<div key={ item.key }>{ item.content }</div>
			) ) }
		</Grid>
	);
}
```

## Follow-ups

This package is a direct port from `@automattic/grid` to unblock
Radical Speed Month. Two potential follow-ups, with very different
scope, are worth separating:

- **Swap the custom resize handle for a shared resize primitive**,
  which would also let us drop the nested drag context currently
  used inside each handle.
- **Replace the sortable layer with a Gutenberg-native sortable.**
  Not a drop-in: drop-zone hooks only provide drop-target detection.
  A full sortable experience (pick-up, transform, reorder, keyboard
  nav) would have to be rebuilt on top. Defer until there is a clear
  reason beyond dependency reduction.

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
