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

`<WidgetDashboard>` renders `<WidgetDashboard.Widgets />` by default. Pass `children` to compose the dashboard — header, empty state, footer — around the grid:

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

Optional. Called when edit mode toggles via `WidgetDashboard.Actions` (or any consumer-built toggle). When omitted, `WidgetDashboard.Actions` renders nothing.

#### `resolveWidgetModule`: `( moduleId: string ) => Promise< { default: ComponentType } >`

Optional. Maps a `WidgetType.renderModule` id to the React component that renders the widget. Defaults to a dynamic `import( /* webpackIgnore */ moduleId )`. Override for tests, Storybook, or remote-URL loading.

#### `gridSettings`: `WidgetGridSettings`

Optional. Configures the underlying grid.

#### `children`: `ReactNode`

Optional. Composition slot for arbitrary dashboard markup. When omitted, the engine renders `<WidgetDashboard.Widgets />` directly.

## Compound components

#### `<WidgetDashboard.Widgets />`

Iterates `layout`, renders each entry through `<WidgetDashboard.WidgetChrome />`, and feeds the resulting tree into the underlying grid (`@wordpress/grid`).

#### `<WidgetDashboard.WidgetChrome />`

Per-instance wrapper (the `DashboardWidgetChrome` component). Provides widget identity to the render tree via context and hosts the widget's render module under a `Suspense` boundary and an error boundary. The instance is read from `layout`; consumers don't pass it manually.

#### `<WidgetDashboard.NoWidgetsState>`

Renders its children only when `layout` is empty. Pair it with `<WidgetDashboard.Widgets />` so the empty state shows up in place of the grid until widgets are added.

#### `<WidgetDashboard.Actions />`

Edit-mode toggle: a "Customize" button while `editMode` is off, and "Add widget", "Layout settings" (when `onGridSettingsChange` is provided), "Cancel", "Done" while it is on. Layout settings is only available in customize mode. Clicking "Customize" or "Done" fires `onEditChange` with the toggled value. Clicking "Add widget" opens the inserter (see below). Returns `null` when the dashboard is mounted without `onEditChange`, so surfaces that don't expose edit mode can keep `Actions` in their tree unconditionally.

`<Page>` from `@wordpress/admin-ui` exposes an `actions` slot used across admin screens (DataViews, WidgetDashboard, …). Plug `Actions` straight into it:

```tsx
import { Page } from '@wordpress/admin-ui';

<WidgetDashboard
	layout={ layout }
	onLayoutChange={ setLayout }
	widgetTypes={ widgetTypes }
	editMode={ editMode }
	onEditChange={ setEditMode }
>
	<Page
		title={ __( 'My Dashboard' ) }
		actions={ <WidgetDashboard.Actions /> }
	>
		<WidgetDashboard.Widgets />
	</Page>
</WidgetDashboard>
```

`<Page>` is optional. The compound renders inside any container, so a bare `<header>` or custom chrome works just as well.

## Inserting widgets

A modal-based inserter is mounted automatically inside `WidgetDashboard`. It stays hidden until the "Add widget" button in `<WidgetDashboard.Actions />` is clicked. The inserter lists every entry in the `widgetTypes` prop as a grid of live previews (each preview renders the type's `example` attributes through its own render module), supports search, and exposes a single "Select" action with bulk support so users can insert one or several widgets in a single layout change.

On confirmation, the inserter creates instances via `createDashboardWidget( widgetType )` (using each type's `example.attributes` as the initial values) and appends them to `layout` through `onLayoutChange`. The dialog closes after a successful insertion or when the user dismisses it.

The inserter has no opt-out today; hosts that want a custom widget-picking experience should compose their own UI alongside `<WidgetDashboard.Widgets />` and avoid rendering `<WidgetDashboard.Actions />` (which exposes the trigger).

## Authoring widgets

Widget render modules receive only what they need to render and edit:

```ts
interface WidgetRenderProps< Item = unknown > {
	attributes: Item;
	setAttributes?: ( next: Partial< Item > ) => void;
}
```

`setAttributes` flows back through `onLayoutChange` on the dashboard. Removal, badges, and error chrome are not part of this contract — those belong to the host.

## Types

- `DashboardWidget` — a placement of a widget on the dashboard. Carries `uuid`, `type`, `attributes`, `placement`.
- `WidgetType` — runtime widget type. Extends the `widget.json` shape with `renderModule`.
- `WidgetRenderProps` — widget render contract.
- `ResolveWidgetModule` — module resolver signature.
- `WidgetGridSettings` — grid configuration.

The widget contract types (`WidgetName`, `WidgetType`, `WidgetRenderProps`, `ResolveWidgetModule`) are defined in `widget-primitives` and imported from there directly; this engine does not re-export them.
