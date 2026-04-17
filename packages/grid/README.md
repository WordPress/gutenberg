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
| `className` | `string` | — | Extra class on the grid root. |

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

During an interaction the component uses an internal `temporaryLayout`
to preview changes without triggering parent re-renders; the final
state is only emitted once the interaction commits.

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

### Relationship to `@wordpress/widget-types`

`Grid` is a **layout primitive**, not a widget surface. It knows
nothing about widget types, the `core/widget-types` store, or the
dashboard. A surface combines the two:

```jsx
const types = useSelect( ( s ) => s( widgetTypesStore ).getWidgetTypes() );

<Grid layout={ userLayout } editMode onChangeLayout={ save }>
	{ types.map( ( type ) => (
		<WidgetChrome key={ type.name } type={ type } />
	) ) }
</Grid>
```

Layout state (positions, sizes) belongs to the surface that persists
user preferences — never to the widget type itself.

## Follow-ups

This package is a direct port from Calypso to unblock Radical Speed
Month. Post-sprint, the DnD layer should be rewritten on top of
Gutenberg primitives (`useDropZone`, `ResizableBox` / `re-resizable`)
to reduce the external surface area.

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
