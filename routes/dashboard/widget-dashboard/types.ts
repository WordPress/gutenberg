/**
 * Widget type definitions for the dashboard engine.
 *
 * The widget identity types (`WidgetName`, `WidgetTypeMetadata`,
 * `WidgetType`) live in `routes/dashboard/widget-types/types` and are
 * re-exported here so dashboard internals can pull every type they need
 * from a single module. The local declarations below cover the
 * dashboard-specific surface area: `DashboardWidget`, render props,
 * module resolver, grid settings, and the `WidgetDashboard` prop bag.
 */

/**
 * External dependencies
 */
import type { ComponentType, ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import type { DashboardGridLayoutItem } from '@wordpress/grid';

/**
 * Internal dependencies
 */
import type {
	WidgetName,
	WidgetTypeMetadata,
	WidgetType,
} from '../widget-types/types';

export type { WidgetName, WidgetTypeMetadata, WidgetType };

export type GridTilePlacement = Omit< DashboardGridLayoutItem, 'key' >;

/**
 * A widget placed on the dashboard.
 *
 * A `WidgetType` describes the blueprint. A `DashboardWidget` is a concrete
 * placement of that type on a specific dashboard: its unique id, the type it
 * references, user-configured attributes, and its `placement` in the grid.
 *
 * The `Placement` generic defaults to the packed grid's item shape
 * (`DashboardGridLayoutItem` minus `key`, which the engine derives from
 * `uuid`). A different grid model — masonry, stack, absolute — would use a
 * different `Placement` shape; the widget identity stays unchanged.
 */
export interface DashboardWidget<
	Item = unknown,
	Placement = GridTilePlacement,
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
 * Props passed to every widget render component.
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
	 * Index of the widget in the `layout` array.
	 */
	index: number;
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
 * Grid-model configuration. Today maps to `@wordpress/grid`'s settings.
 * When alternative grid models (masonry, stack, ...) ship, this type
 * becomes a discriminated union keyed by the chosen model and per-model
 * settings are inferred from the model's own props.
 *
 * `columns` and `minColumnWidth` are mutually exclusive at runtime — set
 * either one or the other depending on whether you want a fixed or
 * responsive grid. The dashboard does not enforce the xor at the type
 * level so `react-docgen-typescript` (Storybook) can serialize the prop
 * cleanly; the underlying grid component handles the conflict.
 */
export interface WidgetGridSettings {
	/**
	 * Fixed column count. Mutually exclusive with `minColumnWidth`.
	 */
	columns?: number;

	/**
	 * Responsive minimum column width in pixels. Mutually exclusive with
	 * `columns`.
	 */
	minColumnWidth?: number;

	/**
	 * Row height in pixels, or `'auto'`.
	 */
	rowHeight?: number | 'auto';

	/**
	 * Grid gap multiplier (multiplied by 4px).
	 */
	spacing?: number;
}

/**
 * Props for `WidgetDashboard`.
 *
 * The consumer owns the committed layout state; the dashboard maintains
 * a staging copy internally for in-progress edits, and `onLayoutChange`
 * fires only when the user commits via the Done action.
 */
export interface WidgetDashboardProps {
	/**
	 * Widget instances to render. Consumer owns this state.
	 */
	layout: DashboardWidget[];

	/**
	 * Called when the user commits in-progress edits via the Done action.
	 * Receives the full layout array as it should be persisted. In-progress
	 * mutations (reorder, resize, add, remove, attribute edits) accumulate
	 * in the dashboard's internal staging layer and do not fire this
	 * callback until commit.
	 */
	onLayoutChange: ( layout: DashboardWidget[] ) => void;

	/**
	 * Called when the layout is reset to the default.
	 */
	onLayoutReset?: () => void;

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
	 * Grid model configuration. See `WidgetGridSettings` for the shape.
	 */
	gridSettings?: WidgetGridSettings;

	children?: ReactNode;
}
