# Grid

<div class="callout callout-alert">
This package is still experimental. "Experimental" means this is an early implementation subject to drastic and breaking changes. The entire API is exposed through <code>@wordpress/private-apis</code> and is not intended for use by themes or plugins; it may change or be removed at any time without a deprecation cycle.
</div>

A collection of grid layout components for arranging tiles in
dashboard-style surfaces.

This package currently exposes a single component, `DashboardGrid`,
which implements a **2D packed grid**: items have explicit
`(width, height)` spans in column/row units and can span multiple
columns **and** multiple rows. It does not implement other grid
models such as masonry (column-flow) or justified rows (equal-height
rows).

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

The components in this package are distributed through
[`@wordpress/private-apis`](https://github.com/WordPress/gutenberg/tree/HEAD/packages/private-apis).
Consuming packages must opt in to the private APIs system and unlock
the exports:

```js
// In the consumer package, e.g. packages/your-package/src/lock-unlock.js
import { __dangerousOptInToUnstableAPIsOnlyForCoreModules } from '@wordpress/private-apis';

export const { unlock } = __dangerousOptInToUnstableAPIsOnlyForCoreModules(
	'I acknowledge private features are not for use in themes or plugins and doing so will break in the next version of WordPress.',
	'@wordpress/your-package'
);
```

```jsx
import { privateApis } from '@wordpress/grid';
import { unlock } from './lock-unlock';

const { DashboardGrid } = unlock( privateApis );

const layout = [
	{ key: 'a', width: 2, height: 2 },
	{ key: 'b', width: 4, height: 1 },
	{ key: 'c', fillWidth: true, height: 1 },
	{ key: 'd', fullWidth: true, height: 1 },
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
	key: string;      // matches child key
	width?: number;   // columns to span
	height?: number;  // rows to span
	order?: number;   // lower values render first (responsive mode)
	fullWidth?: boolean; // spans all columns (grid-column: 1 / -1)
	fillWidth?: boolean; // fills remaining columns in the row
}
```

`fullWidth` and `fillWidth` are mutually exclusive. `fillWidth` is
resolved per-row against the remaining free space.

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

- Items become draggable (powered by `@dnd-kit`).
- A resize handle appears on the bottom-right of each item.
- `onChangeLayout` fires after drop or resize with the new layout.
- `onPreviewLayout` fires continuously during the interaction for
  live feedback; the committed layout is still emitted via
  `onChangeLayout`.

## Accessibility

Edit mode is operable from the keyboard via `@dnd-kit`'s keyboard
sensor:

- `Tab` to focus a grid item.
- `Space` to pick it up.
- Arrow keys to move it between positions.
- `Space` to drop, or `Escape` to cancel.

Resize handles are currently pointer-only.

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
