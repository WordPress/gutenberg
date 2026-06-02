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
import type {
	DashboardGridLayoutItem,
	DashboardLanesLayoutItem,
} from '@wordpress/grid';

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
export type MasonryTilePlacement = Omit< DashboardLanesLayoutItem, 'key' >;

/**
 * Storage shape for a widget's placement.
 *
 * Structurally a union of every supported per-model shape, but the
 * intended invariant is stronger than the type suggests: every
 * placement in a given layout must match the shape of the currently
 * active `gridSettings.model`. `migrateLayout` is the only correct
 * way to transition placements across model changes; the render
 * layer is allowed to trust the active model and treat each
 * placement as the matching shape.
 *
 * The type system cannot enforce that invariant on its own (there is
 * no discriminator on the placement itself), so consider this union a
 * declaration of which shapes are *valid*, not which shape any given
 * placement happens to be at runtime.
 */
export type DashboardTilePlacement = GridTilePlacement | MasonryTilePlacement;

/**
 * A widget placed on the dashboard.
 *
 * A `WidgetType` describes the blueprint. A `DashboardWidget` is a
 * concrete placement of that type on a specific dashboard: its unique
 * id, the type it references, user-configured attributes, and its
 * `placement` in the grid.
 */
export interface DashboardWidget< Item = unknown > {
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
	 * Grid-model-specific placement (column/row spans, ordering,
	 * etc.). Must match the shape implied by the dashboard's active
	 * `gridSettings.model`; see `DashboardTilePlacement` for the
	 * invariant and `migrateLayout` for the transition mechanism.
	 */
	placement?: DashboardTilePlacement;
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
 * Identifier for the active grid model. Drives which `@wordpress/grid`
 * surface the dashboard mounts and which per-model settings the
 * `WidgetGridSettings` union admits.
 *
 * Model names describe user-facing concepts. The mapping to the
 * underlying `@wordpress/grid` component is an implementation detail
 * resolved in the render layer; `'masonry'` is rendered today through
 * `DashboardLanes` (skyline placement) but could swap to a future
 * native `display: grid-lanes` path without affecting the model name.
 */
export type WidgetGridModel = 'grid' | 'masonry';

/**
 * Settings common to every grid model. `columns` and `minColumnWidth`
 * compose as a layered model at runtime: `columns` caps the count and
 * `minColumnWidth` enforces a per-tile width floor that can reduce the
 * count on narrow containers. See `@wordpress/grid` for the resolution.
 *
 * `spacing` is intentionally absent: the gap between tiles is
 * presentational and lives with the design-system theme/density, not
 * with per-dashboard settings. The grid surface keeps the prop for
 * programmatic overrides, but the dashboard does not propagate it.
 */
interface BaseWidgetGridSettings {
	/**
	 * Target column count (cap). When omitted alongside
	 * `minColumnWidth`, the grid renders six columns.
	 */
	columns?: number;

	/**
	 * Per-tile minimum width in pixels. Acts as a floor that can
	 * reduce the effective column count below `columns` on narrow
	 * containers.
	 */
	minColumnWidth?: number;
}

/**
 * 2D packed grid settings. Items declare explicit width and height
 * spans; rows can be uniform-sized or content-sized via `rowHeight`.
 */
export interface WidgetGridLayoutSettings extends BaseWidgetGridSettings {
	model?: 'grid';

	/**
	 * Row height in pixels, or `'auto'` to let the tallest item in
	 * each row size it.
	 */
	rowHeight?: number | 'auto';
}

/**
 * Masonry settings. Heights are content-driven; resize is
 * horizontal-only. `flowTolerance` tunes how aggressively the placer
 * preserves source order vs. minimizing empty regions.
 */
export interface WidgetMasonryLayoutSettings extends BaseWidgetGridSettings {
	model: 'masonry';

	/**
	 * Pixel tolerance for source-order tiebreaking when two candidate
	 * columns have similar baselines.
	 */
	flowTolerance?: number;
}

/**
 * Discriminated union of supported grid-model configurations.
 *
 * When `model` is omitted the dashboard treats the settings as the
 * 2D packed grid (`'grid'`) for backwards compatibility with the
 * pre-union shape.
 */
export type WidgetGridSettings =
	| WidgetGridLayoutSettings
	| WidgetMasonryLayoutSettings;

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

	/**
	 * Called when the user commits in-progress grid-settings edits via
	 * the Done action. The dashboard maintains a staging copy of
	 * settings internally; mutations stay local until commit. When
	 * omitted, the `Layout settings` entry in the more-actions menu is
	 * hidden, since there is nowhere to persist the change.
	 */
	onGridSettingsChange?: ( gridSettings: WidgetGridSettings ) => void;

	children?: ReactNode;
}
