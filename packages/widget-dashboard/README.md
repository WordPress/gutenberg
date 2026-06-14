# Widget Dashboard

<div class="callout callout-alert">
This package is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes. While it is published as 0.x, breaking changes may ship in minor releases.
</div>

Stateless rendering engine for widget dashboards. `WidgetDashboard` renders an editable grid of widget instances, all behind a consumer-controlled edit mode: drag-to-reorder, resize, and a set of composable overlays (a modal inserter, per-widget settings, a layout-settings drawer, command palette integration) that ship in the default composition and can be composed individually.

The engine owns no data. Widget types flow in via the `widgetTypes` prop (see [`@wordpress/widget-primitives`](https://github.com/WordPress/gutenberg/tree/HEAD/packages/widget-primitives)), the consumer owns the committed `layout` array, and in-progress edits accumulate in an internal staging layer until the user commits them, at which point `onLayoutChange` fires with the fully updated array. Grid placement renders through [`@wordpress/grid`](https://github.com/WordPress/gutenberg/tree/HEAD/packages/grid).

For how the widget system fits together (authoring, build, server registry, hosts), see the [dashboard widget system architecture document](https://github.com/WordPress/gutenberg/blob/HEAD/docs/explanations/architecture/dashboard-widgets.md).

## Installation

Install the module:

```bash
npm install @wordpress/widget-dashboard --save
```

_This package assumes that your code will run in an **ES2015+** environment.
If you're using an environment that has limited or no support for such
language features and APIs, you should include [the polyfill shipped in
`@wordpress/babel-preset-default`](https://github.com/WordPress/gutenberg/tree/HEAD/packages/babel-preset-default#polyfill)
in your code._

## Setup

Component styles are CSS Modules injected at runtime when a component
mounts; there is no stylesheet to enqueue or import.

Visual defaults read the design tokens that `@wordpress/theme` publishes as
`--wpds-*` CSS custom properties. In WordPress screens managed by Gutenberg
the tokens stylesheet is loaded centrally and no setup is needed. Elsewhere,
install and load it in your application:

```bash
npm install @wordpress/theme
```

```js
import '@wordpress/theme/design-tokens.css';
```

Command palette integration is part of the default composition; when
passing custom children, compose `<WidgetDashboard.Commands />` (see
[Compound components](#compound-components)) to keep it. Commands register
through `@wordpress/commands` and surface wherever the host application
mounts the command palette.

## Usage

```tsx
import { useState } from '@wordpress/element';
import { WidgetDashboard } from '@wordpress/widget-dashboard';

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

Widget instances to render. Each instance carries a stable `uuid`, a `type` reference, optional `attributes`, and a `placement` describing its slot in the grid. The consumer owns this state.

#### `onLayoutChange`: `( layout: DashboardWidget[] ) => void`

Called when the user commits in-progress edits via the Done action. Receives the full layout array as it should be persisted. In-progress mutations (reorder, resize, add, remove, attribute edits) accumulate in the dashboard's internal staging layer and do not fire this callback until commit.

#### `onLayoutReset`: `() => void`

Optional. Reset action surfaced by `<WidgetDashboard.Actions />` and the command palette. When omitted, the reset entry points are hidden.

#### `widgetTypes`: `WidgetType[]`

The widget types available to the dashboard. The dashboard never queries a store directly — consumers scope and filter via this prop.

#### `isResolvingWidgetTypes`: `boolean`

Optional. When `true`, widget types are still loading: instances whose type is not yet in `widgetTypes` show a loading state instead of a missing state.

#### `editMode`: `boolean`

When `true`, the grid enables drag and resize. Defaults to `false`.

#### `onEditChange`: `( next: boolean ) => void`

Optional. Called when edit mode toggles via `WidgetDashboard.Actions` (or any consumer-built toggle). When omitted, `WidgetDashboard.Actions` renders nothing.

#### `resolveWidgetModule`: `( moduleId: string ) => Promise< { default: ComponentType } >`

Optional. Maps a `WidgetType.renderModule` id to the React component that renders the widget. Defaults to a dynamic `import( /* webpackIgnore */ moduleId )`. Override for tests, Storybook, or remote-URL loading.

#### `gridSettings`: `WidgetGridSettings`

Optional. Grid model configuration; see [Grid settings](#grid-settings). Defaults to `DEFAULT_GRID`.

#### `onGridSettingsChange`: `( gridSettings: WidgetGridSettings ) => void`

Optional. Called when the user commits grid-settings edits. When omitted, the layout-settings entry points are hidden, since there is nowhere to persist the change.

#### `children`: `ReactNode`

Optional. Composition slot for arbitrary dashboard markup. When omitted, the engine renders the default composition: the empty state, the actions, the widgets grid, the command palette integration, the layout-settings drawer, the inserter, and the per-widget settings drawer. When provided, compose whichever of those overlays you need.

## Compound components

#### `<WidgetDashboard.Widgets />`

Iterates `layout`, renders each entry through `<WidgetDashboard.WidgetChrome />`, and feeds the resulting tree into the underlying grid (`@wordpress/grid`).

#### `<WidgetDashboard.WidgetChrome />`

Per-instance wrapper. Provides widget identity to the render tree via context and hosts the widget's render module under a `Suspense` boundary and an error boundary. The instance is read from `layout`; consumers don't pass it manually.

#### `<WidgetDashboard.NoWidgetsState>`

Renders its children only when `layout` is empty. Pair it with `<WidgetDashboard.Widgets />` so the empty state shows up in place of the grid until widgets are added.

#### `<WidgetDashboard.Actions />`

Edit-mode toggle: a "Customize" button while `editMode` is off, and "Add widget", "Layout settings" (when `onGridSettingsChange` is provided), "Cancel", "Done" while it is on. Clicking "Customize" or "Done" fires `onEditChange` with the toggled value. Clicking "Add widget" opens the inserter (see below); "Layout settings" opens `<WidgetDashboard.LayoutSettingsDrawer />`, composed separately. Returns `null` when the dashboard is mounted without `onEditChange`, so surfaces that don't expose edit mode can keep `Actions` in their tree unconditionally.

#### `<WidgetDashboard.Commands />`

Command palette integration. It registers the dashboard's commands through `@wordpress/commands` (customize, add widgets, switch layout model, reset to default) and sets the active command context. It renders nothing. Ships in the default composition; when passing custom children, compose it to keep the integration. The "Reset to default" command opens the dialog hosted by `<WidgetDashboard.Actions />`, so pair the two.

#### `<WidgetDashboard.LayoutSettingsDrawer />`

Side drawer for grid-level settings (layout model, row height), editing the same staging layer as the rest of customize mode. Ships in the default composition; when passing custom children, compose it alongside `<WidgetDashboard.Actions />`, whose Layout settings button opens it. Renders nothing when `onGridSettingsChange` is omitted.

#### `<WidgetDashboard.WidgetInserter />`

Modal widget inserter (see [Inserting widgets](#inserting-widgets)). Ships in the default composition; when passing custom children, compose it to keep the "Add widget" flow, or omit it to provide a custom widget-picking experience. Reads its open state from context and renders nothing until the `Actions` "Add widget" button opens it.

#### `<WidgetDashboard.WidgetSettingsDrawer />`

Per-instance settings drawer. Opened by each tile's settings gear (in normal and customize mode), it edits the active widget's attributes through the staging layer. Ships in the default composition; when passing custom children, compose it to keep per-widget settings.

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
	<WidgetDashboard.Commands />
	<WidgetDashboard.LayoutSettingsDrawer />
	<WidgetDashboard.WidgetInserter />
	<WidgetDashboard.WidgetSettingsDrawer />
</WidgetDashboard>;
```

`<Page>` is optional. The compound renders inside any container, so a bare `<header>` or custom chrome works just as well.

## Inserting widgets

`<WidgetDashboard.WidgetInserter />` is a modal-based inserter, part of the default composition. It stays hidden until the "Add widget" button in `<WidgetDashboard.Actions />` is clicked. The inserter lists every entry in the `widgetTypes` prop as a grid of live previews (each preview renders the type's `example` attributes through its own render module), supports search, and exposes a single "Select" action with bulk support so users can insert one or several widgets in a single layout change.

On confirmation, the inserter creates instances (using each type's `example.attributes` as the initial values) and appends them to the staged layout. The dialog closes after a successful insertion or when the user dismisses it.

Hosts that want a custom widget-picking experience pass custom children: omit `<WidgetDashboard.WidgetInserter />`, compose their own UI alongside `<WidgetDashboard.Widgets />`, and skip the `<WidgetDashboard.Actions />` "Add widget" trigger.

## Grid settings

The dashboard supports two grid models, configured through the `gridSettings` prop: the 2D packed `grid` model, where tiles declare explicit spans over uniform rows, and the content-driven `masonry` model, where heights follow content and resize is horizontal-only. The package owns the definition and editing of these settings (`<WidgetDashboard.LayoutSettingsDrawer />` in customize mode, the model-switch commands); the host owns persistence.

The exported kit for building that persistence:

-   `WidgetGridSettings` — discriminated union of the per-model settings shapes.
-   `DEFAULT_GRID` — canonical default settings, applied when `gridSettings` is omitted. Treat it as the factory default in storage; for example, persist "back to default" as a cleared entry when the committed value deep-equals `DEFAULT_GRID`, so stored copies never drift from the code default.
-   `normalizeGridSettings( settings, defaultRowHeight )` — coerces legacy freeform row heights to the nearest preset. Run it over stored payloads before passing them in.
-   `ROW_HEIGHT_PRESETS` / `DEFAULT_ROW_HEIGHT` — the row-height presets (`small`, `medium`, `large`) the settings drawer offers.
-   `WIDGET_DASHBOARD_COLUMN_COUNT` — maximum column count on wide containers. The effective count steps down from container width; persisted `columns` values are ignored.

```tsx
const [ gridSettings, setGridSettings ] = useState( DEFAULT_GRID );

<WidgetDashboard
	layout={ layout }
	onLayoutChange={ setLayout }
	widgetTypes={ widgetTypes }
	gridSettings={ gridSettings }
	onGridSettingsChange={ setGridSettings }
/>;
```

## Authoring widgets

Widget render modules receive only what they need to render and edit:

```ts
interface WidgetRenderProps< Item = unknown > {
	attributes: Item;
	setAttributes?: ( next: Partial< Item > ) => void;
}
```

`setAttributes` flows back through the staging layer and reaches `onLayoutChange` on commit. Removal, badges, and error chrome are not part of this contract — those belong to the host.

## Types

-   `DashboardWidget` — a placement of a widget on the dashboard. Carries `uuid`, `type`, `attributes`, `placement`.
-   `WidgetGridSettings` — grid model configuration; see [Grid settings](#grid-settings).

The widget contract types (`WidgetName`, `WidgetType`, `WidgetRenderProps`, `ResolveWidgetModule`) are defined in `@wordpress/widget-primitives` and imported from there directly; this engine does not re-export them.

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
