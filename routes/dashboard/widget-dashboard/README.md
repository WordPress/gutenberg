# `WidgetDashboard`

Stateless rendering engine for widget dashboards. Renders an editable grid of widget instances, with drag-to-reorder and resize when edit mode is on.
Widget types flow in as a prop and every layout mutation fires `onLayoutChange` with the fully updated array.
The engine owns no data of its own.

## Usage

```tsx
import { useState } from '@wordpress/element';
import { WidgetDashboard } from './widget-dashboard';

function Dashboard() {
	const [ layout, setLayout ] = useState( defaultLayout );

	return (
		<WidgetDashboard
			layout={ layout }
			onLayoutChange={ setLayout }
			widgetTypes={ widgetTypes }
		/>
	);
}
```

`<WidgetDashboard>` renders `<WidgetDashboard.Widgets />` by default. Pass `children` to compose the surface — header, empty state, footer — around the grid:

```tsx
<WidgetDashboard
	layout={ layout }
	onLayoutChange={ setLayout }
	widgetTypes={ widgetTypes }
>
	<WidgetDashboard.NoWidgetsState>
		<p>{ __( 'No widgets yet.' ) }</p>
	</WidgetDashboard.NoWidgetsState>
	<WidgetDashboard.Widgets />
</WidgetDashboard>
```

## Properties

#### `layout`: `DashboardWidget[]`

Widget instances to render. Each instance carries a stable `uuid`, a `type` reference, optional `attributes`, and a `placement` describing its slot in the grid.

#### `onLayoutChange`: `( layout: DashboardWidget[] ) => void`

Called on every mutation — reorder, resize, or `setAttributes` from a widget render module. Receives the fully updated array; the consumer owns the storage.

#### `widgetTypes`: `WidgetType[]`

The widget types available to the dashboard.

#### `editMode`: `boolean`

When `true`, the grid enables drag and resize. Defaults to `false`.

#### `onEditChange`: `( next: boolean ) => void`

Optional. Called when edit mode toggles via a future `WidgetDashboard.Actions` compound.

#### `resolveWidgetModule`: `( moduleId: string ) => Promise< { default: ComponentType } >`

Optional. Maps a `WidgetType.renderModule` id to the React component that renders the widget. Defaults to a dynamic `import( /* webpackIgnore */ moduleId )`. Override for tests, Storybook, or remote-URL loading.

#### `gridSettings`: `WidgetGridSettings`

Optional. Configures the underlying grid.

#### `children`: `ReactNode`

Optional. Composition slot for arbitrary surface markup. When omitted, the engine renders `<WidgetDashboard.Widgets />` directly.

## Compound components

#### `<WidgetDashboard.Widgets />`

Iterates `layout`, renders each entry through `<WidgetDashboard.Widget />`, and feeds the resulting tree into the underlying grid (`@wordpress/grid`).

#### `<WidgetDashboard.Widget />`

Per-instance wrapper. Provides widget identity to the render tree via context and hosts the widget's render module under a `Suspense` boundary and an error boundary. The instance is read from `layout`; consumers don't pass it manually.

#### `<WidgetDashboard.NoWidgetsState>`

Renders its children only when `layout` is empty. Pair it with `<WidgetDashboard.Widgets />` so the empty state shows up in place of the grid until widgets are added.

## Authoring widgets

Widget render modules receive only what they need to render and edit:

```ts
interface WidgetRenderProps< Item = unknown > {
	attributes: Item;
	setAttributes?: ( next: Partial< Item > ) => void;
}
```

`setAttributes` flows back through `onLayoutChange` on the dashboard. Removal, badges, and error chrome are not part of this contract — those belong to the surface.

## Types

- `DashboardWidget` — a placement of a widget on the dashboard. Carries `uuid`, `type`, `attributes`, `placement`.
- `WidgetType` — runtime widget type. Extends the `widget.json` shape with `renderModule`.
- `WidgetRenderProps` — widget render contract.
- `ResolveWidgetModule` — module resolver signature.
- `WidgetGridSettings` — grid configuration.

`WidgetName`, `WidgetTypeMetadata`, and `WidgetType` are declared locally in `types.ts` until `@wordpress/widget-types` lands in trunk; at that point those three collapse into a re-export from the package.
