/**
 * Widget type definitions.
 *
 * The widget-related exports in this file (`WidgetName`,
 * `WidgetStyleVariation`, `WidgetTypeMetadata`, `WidgetType`) are defined
 * locally so the engine stays self-contained while its surface stabilises.
 * The canonical home for them is `@wordpress/widget-types` — once that
 * package publishes the matching exports, swap these definitions for
 * re-exports and keep the rest of the engine untouched. Until then, treat
 * any change here as something to sync with `@wordpress/widget-types`
 * when it catches up.
 */

/**
 * External dependencies
 */
import type { ComponentType, ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import type { Field } from '@wordpress/dataviews';
import type { DashboardGridLayoutItem } from '@wordpress/grid';

/**
 * Widget type identifier, structured as `<widget-namespace>/<widget-name>`.
 * Both segments are lowercase, kebab-case; the full character pattern is
 * enforced by the `widget.json` schema at authoring time.
 */
export type WidgetName = `${ string }/${ string }`;

/**
 * Style variation entry — one per item in `WidgetTypeMetadata.styles`.
 * Mirrors the `widget.json` `styles[]` shape.
 */
export interface WidgetStyleVariation {
	name: string;
	label: string;
	isDefault?: boolean;
}

/**
 * Literal contents of a widget's `widget.json` metadata file.
 *
 * Captures the *authoring* shape only — module entry points and style
 * assets are discovered by convention from the widget directory
 * (`render.*`, `widget.*`, `render.scss`), not declared here.
 *
 * Consumed by tooling (IDE autocomplete, validation, the build pipeline).
 * The dashboard engine consumes the richer `WidgetType` below, which
 * extends this shape with runtime-only fields produced by the build
 * manifest.
 *
 * This is a local mirror. Once `@wordpress/widget-types` publishes the
 * canonical type, replace this with a re-export.
 */
export interface WidgetTypeMetadata {
	/**
	 * Version of the Widget API used by the widget.
	 */
	apiVersion: number;

	/**
	 * Stable type identifier. See `WidgetName` for the shape.
	 */
	name: WidgetName;

	/**
	 * Display title; shown in the inserter.
	 */
	title: string;

	/**
	 * Short description shown in the widget inspector.
	 */
	description?: string;

	/**
	 * Dashicon slug used as the visual identifier.
	 */
	icon?: string;

	/**
	 * Grouping category. Core provides `dashboard`; plugins and themes may
	 * register custom categories.
	 */
	category?: string;

	/**
	 * Search aliases used to surface the widget from the inserter.
	 */
	keywords?: string[];

	/**
	 * Widget version — used for asset cache invalidation.
	 */
	version?: string;

	/**
	 * Gettext text domain for translations.
	 */
	textdomain?: string;

	/**
	 * Experiment gate — boolean `true`, or a specific experiment name.
	 */
	__experimental?: string | boolean;

	/**
	 * Declarative attribute schema, reusing the DataViews `Field` shape so
	 * the dashboard can render forms via `DataForm` without per-widget
	 * form wiring. `Field< any >` is used here because the array is
	 * heterogeneous — each widget narrows `Item` to its own attribute
	 * type at the point of registration.
	 */
	attributes?: Field< any >[];

	/**
	 * Visual style variations. Each entry adds a class name to the widget
	 * wrapper that themes can target via CSS.
	 */
	styles?: WidgetStyleVariation[];

	/**
	 * Structured example data for the Inspector Help Panel preview, and
	 * the default attributes applied by `createWidgetInstance` when no
	 * initial attributes are supplied.
	 */
	example?: {
		attributes?: Record< string, unknown >;
	};
}

/**
 * Runtime widget type consumed by the dashboard engine.
 *
 * Extends `WidgetTypeMetadata` (the authoring shape of `widget.json`) with
 * runtime-only fields produced by the build pipeline — notably
 * `renderModule`, which maps each widget to its discovered script-module
 * entry point.
 *
 * Surfaces consume `WidgetType[]` via the `widgetTypes` prop; the
 * dashboard never reads the widget-types store directly.
 */
export interface WidgetType extends WidgetTypeMetadata {
	/**
	 * Script-module identifier resolved to a React component at render
	 * time by `ResolveWidgetModule`. Produced by the build pipeline from
	 * the conventional `render.*` / `widget.*` entry points; not declared
	 * in `widget.json`.
	 */
	renderModule: string;
}

/**
 * A widget instance on the dashboard.
 *
 * A `WidgetType` describes the blueprint. A `WidgetInstance` is a concrete
 * placement of that type on a specific dashboard: its unique id, the type it
 * references, user-configured attributes, and its `placement` in the grid.
 *
 * The `Placement` generic defaults to the packed grid's item shape
 * (`DashboardGridLayoutItem` minus `key`, which the engine derives from
 * `uuid`). A different grid model — masonry, stack, absolute — would use a
 * different `Placement` shape; the widget identity stays unchanged.
 */
export interface WidgetInstance<
	Item = unknown,
	Placement = Omit< DashboardGridLayoutItem, 'key' >,
> {
	/**
	 * Unique instance identifier.
	 */
	uuid: string;

	/**
	 * Widget type name — must match a `WidgetType.name` in `widgetTypes`.
	 */
	type: WidgetName;

	/**
	 * User-configured attributes for this instance.
	 */
	attributes?: Item;

	/**
	 * Grid-model-specific placement (column/row spans, ordering, etc.).
	 */
	placement?: Placement;
}

/**
 * Badge displayed in the widget header.
 *
 * Surfaced by chrome (`WidgetDashboard.Widget`); not part of the widget
 * render contract.
 */
export interface WidgetBadge {
	value: string | number;
	ariaLabel?: string;
	info?: string;
	intent?: 'positive' | 'warning' | 'negative';
}

/**
 * Error configuration surfaced by the chrome wrapper when a widget fails to
 * render or explicitly reports an error upstream.
 */
export interface WidgetErrorConfig {
	message?: string;
	icon?: React.ReactElement;
	action?: {
		label: string;
		onClick: () => void;
	};
}

/**
 * Props passed to every widget render component.
 *
 * Intentionally minimal. Removal, badges, and error reporting are surface
 * concerns handled by the chrome wrapper — widgets never see them. This
 * mirrors the `BlockEdit` contract: blocks do not receive "remove this block"
 * callbacks either.
 */
export interface WidgetRenderProps< Item = unknown > {
	/**
	 * Widget attributes configured by the user.
	 */
	attributes: Item;

	/**
	 * Update the attributes of this instance. Fires `onLayoutChange` on the
	 * dashboard with the updated layout.
	 */
	setAttributes?: ( next: Partial< Item > ) => void;
}

/**
 * Identity of a widget within the rendering tree. Returned by
 * `useWidgetContext()`; `null` when called outside a widget render subtree.
 */
export interface WidgetContextValue {
	/**
	 * Widget instance id.
	 */
	uuid: string;

	/**
	 * Widget type name.
	 */
	name: WidgetName;

	/**
	 * Index of the instance in the `layout` array.
	 */
	position: number;
}

/**
 * Identity of the dashboard itself. Returned by
 * `useWidgetDashboardContext()` from anywhere inside a `WidgetDashboard`
 * subtree. Used to scope persistence keys, extension filters, and analytics.
 */
export interface WidgetDashboardContextValue {
	/**
	 * Stable identifier passed as `WidgetDashboard`'s `id` prop.
	 */
	id: string;
}

/**
 * Widget render module shape returned by the module resolver.
 */
export interface WidgetModule {
	default: ComponentType< WidgetRenderProps< unknown > >;
}

/**
 * Resolver hook: maps a `WidgetType.renderModule` id to a React component.
 * Defaults to a dynamic `import()`; override for tests, Storybook, or to load
 * from a non-URL source.
 */
export type ResolveWidgetModule = (
	moduleId: string
) => Promise< WidgetModule >;

/**
 * Props for `WidgetDashboard`.
 *
 * Follows the DataViews stateless pattern: the consumer owns layout state,
 * and every mutation fires `onLayoutChange` with the fully updated array.
 */
export interface WidgetDashboardProps {
	/**
	 * Stable identifier for this dashboard instance. Required so consumers
	 * can scope persistence keys and extensions (`core/dashboard`,
	 * `woocommerce/dashboard`, etc.).
	 */
	id: string;

	/**
	 * Widget instances to render. Consumer owns this state.
	 */
	layout: WidgetInstance[];

	/**
	 * Called on every layout mutation (reorder, resize, add, remove).
	 */
	onLayoutChange: ( layout: WidgetInstance[] ) => void;

	/**
	 * Widget types available for rendering. The dashboard never queries a
	 * store directly — consumers scope and filter via this prop.
	 */
	widgetTypes: WidgetType[];

	/**
	 * Whether the dashboard is in edit mode (enables drag/resize).
	 */
	editMode?: boolean;

	/**
	 * Called when edit mode toggles via `WidgetDashboard.Actions`.
	 */
	onEditChange?: ( next: boolean ) => void;

	/**
	 * Overrides the default `import()` resolution of
	 * `WidgetType.renderModule`. Useful for tests, Storybook, or future
	 * remote-URL loading.
	 */
	resolveWidgetModule?: ResolveWidgetModule;

	/**
	 * Fixed column count. Mutually exclusive with `minColumnWidth`.
	 */
	columns?: number;

	/**
	 * Responsive minimum column width in pixels.
	 *
	 * @default 350
	 */
	minColumnWidth?: number;

	/**
	 * Container width below which the grid collapses to a single column.
	 *
	 * @default 640
	 */
	collapseWidth?: number;

	/**
	 * Row height in pixels, or `'auto'`.
	 *
	 * @default 200
	 */
	rowHeight?: number | 'auto';

	/**
	 * Grid gap multiplier (multiplied by 4px).
	 *
	 * @default 4
	 */
	spacing?: number;

	/**
	 * Called when a widget reports an error via chrome.
	 */
	onWidgetError?: (
		uuid: string,
		error: WidgetErrorConfig | true | null
	) => void;

	/**
	 * Custom empty-state content rendered when `layout` is empty.
	 */
	empty?: ReactNode;

	children?: ReactNode;
}
