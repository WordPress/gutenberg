/**
 * External dependencies
 */
import type { ComponentType, ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import type { DashboardGridLayoutItem } from '@wordpress/grid';

/**
 * Metadata for a widget type.
 *
 * This shape is a minimal local mirror of what `@wordpress/widget-types` will
 * expose once that package is scaffolded. Surfaces consume `WidgetType[]` via
 * the `widgetTypes` prop; the dashboard package never reads the widget-types
 * store directly.
 */
export interface WidgetType {
	/**
	 * Stable type identifier (namespaced, e.g. `core/activity`).
	 */
	name: string;

	/**
	 * Human-readable title shown in chrome and pickers.
	 */
	title: string;

	/**
	 * Description shown in the inserter.
	 */
	description?: string;

	/**
	 * Script-module identifier resolved to a React component at render time.
	 */
	render_module: string;

	/**
	 * Default attributes used by `createWidgetInstance` when no initial
	 * attributes are supplied.
	 */
	example?: unknown;
}

/**
 * A widget instance on the dashboard.
 *
 * A `WidgetType` describes the blueprint. A `WidgetInstance` is a concrete
 * placement of that type on a specific dashboard: its unique id, the type it
 * references, user-configured attributes, and layout position.
 *
 * Layout fields (`width`, `height`, `order`) mirror `DashboardGridLayoutItem`
 * from `@wordpress/grid` so that the grid bridge stays trivial — `width`
 * accepts either a numeric column span, `'fill'` (remaining columns in the
 * row), or `'full'` (every column).
 */
export interface WidgetInstance< Item = unknown > {
	/**
	 * Unique instance identifier.
	 */
	uid: string;

	/**
	 * Widget type name — must match a `WidgetType.name` in `widgetTypes`.
	 */
	type: string;

	/**
	 * User-configured attributes for this instance.
	 */
	attributes?: Item;

	/**
	 * Column span, or `'fill'` / `'full'` discriminator.
	 */
	width?: DashboardGridLayoutItem[ 'width' ];

	/**
	 * Row span.
	 */
	height?: DashboardGridLayoutItem[ 'height' ];

	/**
	 * Display order within the grid.
	 */
	order?: DashboardGridLayoutItem[ 'order' ];
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
	uid: string;

	/**
	 * Widget type name.
	 */
	name: string;

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
 * Resolver hook: maps a `WidgetType.render_module` id to a React component.
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
	 * `WidgetType.render_module`. Useful for tests, Storybook, or future
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
		uid: string,
		error: WidgetErrorConfig | true | null
	) => void;

	/**
	 * Custom empty-state content rendered when `layout` is empty.
	 */
	empty?: ReactNode;

	children?: ReactNode;
}
