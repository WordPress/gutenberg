/**
 * Dashboard-specific types: `DashboardWidget`, grid settings, and the
 * `WidgetDashboard` prop bag.
 *
 * The widget contract types (`WidgetName`, `WidgetType`, `WidgetRenderProps`,
 * `ResolveWidgetModule`) live in `@wordpress/widget-primitives` and are
 * imported from there directly; this module does not re-export them.
 */
import type { ReactNode } from 'react';
import type {
	ColumnSteps,
	DashboardGridLayoutItem,
	DashboardLanesLayoutItem,
} from '@wordpress/grid';
import type {
	WidgetName,
	WidgetType,
	ResolveWidgetModule,
} from '@wordpress/widget-primitives';

export type GridTilePlacement = Omit< DashboardGridLayoutItem, 'key' >;
export type MasonryTilePlacement = Omit< DashboardLanesLayoutItem, 'key' >;

/**
 * Storage shape for a widget's placement.
 *
 * Structurally a union of every supported per-model shape, but the
 * intended invariant is stronger than the type suggests: every
 * placement in a given layout must match the shape of the currently
 * active `gridSettings.model`. Consumers that switch the model must
 * supply placements in the new shape; the render layer is allowed to
 * trust the active model and treat each placement as the matching
 * shape.
 *
 * The type system cannot enforce that invariant on its own (there is
 * no discriminator on the placement itself), so consider this union a
 * declaration of which shapes are *valid*, not which shape any given
 * placement happens to be at runtime.
 */
export type DashboardTilePlacement = GridTilePlacement | MasonryTilePlacement;

/**
 * Attribute bag of a widget instance, as edited by the dashboard's
 * attribute surfaces.
 */
export type WidgetAttributeValues = Record< string, unknown >;

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
	 * invariant.
	 */
	placement?: DashboardTilePlacement;
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
 * Column count of the default policy on a wide container. A default, not
 * a ceiling: the package renders whatever the host asks for.
 */
export const WIDGET_DASHBOARD_COLUMN_COUNT = 4;

/**
 * Column policy used when the host sets neither `gridSettings.columns` nor
 * `gridSettings.minColumnWidth`: one column from 0px, two from 600px and
 * {@link WIDGET_DASHBOARD_COLUMN_COUNT} from 960px of container width. The
 * steps are data the host can replace; the package applies none of its own.
 */
export const WIDGET_DASHBOARD_COLUMN_STEPS: ColumnSteps = {
	0: 1,
	600: 2,
	960: WIDGET_DASHBOARD_COLUMN_COUNT,
};

/**
 * Settings common to every grid model. The column policy travels to the
 * `@wordpress/grid` surface untouched: the surface measures its own width
 * and resolves the count from `columns` and `minColumnWidth`.
 *
 * `spacing` is intentionally absent: the gap between tiles is
 * presentational and lives with the design-system theme/density, not
 * with per-dashboard settings. The grid surface keeps the prop for
 * programmatic overrides, but the dashboard does not propagate it.
 */
interface BaseWidgetGridSettings {
	/**
	 * Column count. A number applies at every width; a map applies a count
	 * from each container width up (`{ 0: 1, 600: 2, 960: 4 }` is one
	 * column from 0px, two from 600px, four from 960px). A step can be
	 * `'auto'`, which lifts the cap from that width up and leaves the count
	 * to `minColumnWidth`; with no floor set, the step is skipped and the
	 * count below it holds. Counts are floored at one with no ceiling.
	 * Absent, the policy is the default steps (`DEFAULT_GRID.columns`), or
	 * whatever `minColumnWidth` fits when that is set.
	 */
	columns?: number | ColumnSteps;

	/**
	 * Per-column floor in pixels. The surface fits as many columns as its
	 * width allows at this floor, capped by `columns` when set, down to one.
	 * A non-finite or non-positive value is unset.
	 */
	minColumnWidth?: number;
}

/**
 * 2D packed grid settings. Items declare explicit width and height
 * spans; rows use a uniform track height via `rowHeight`.
 */
export interface WidgetGridLayoutSettings extends BaseWidgetGridSettings {
	model?: 'grid';

	/**
	 * Row height in pixels. Any positive value is honored; `ROW_HEIGHT_PRESETS`
	 * suggests three. Every tile in a row fills the row vertically, and a
	 * tile's stored `height` counts rows of this size.
	 */
	rowHeight?: number;
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
	WidgetGridLayoutSettings | WidgetMasonryLayoutSettings;

/**
 * The operations that act on one placed widget.
 */
export type DashboardInstanceOperation = 'remove' | 'move' | 'resize' | 'edit';

/**
 * A request for an instance operation: the placed widget, and its type
 * when registered. The type is absent when it is not in `widgetTypes`
 * (a plugin gone, a module that failed to load): the engine still asks,
 * because the instance is still on the board, but a policy that keys
 * locks on the type has nothing to match.
 */
export interface DashboardInstanceOperationRequest {
	operation: DashboardInstanceOperation;
	widget: DashboardWidget;
	widgetType?: WidgetType;
}

/**
 * An operation the dashboard asks permission for, with its subject.
 * `customize` is entering customize mode; `reset` is restoring the default
 * layout; `insert` is offering a widget type in the inserter; `remove`,
 * `move`, `resize`, and `edit` act on a placed widget.
 */
export type DashboardOperationRequest =
	| { operation: 'customize' }
	| { operation: 'reset' }
	| { operation: 'insert'; widgetType: WidgetType }
	| DashboardInstanceOperationRequest;

/**
 * Answers whether an operation is allowed. Return `true` for operations
 * you do not govern: policies compose restrictively, so a default `false`
 * would deny every operation the engine adds later.
 */
export type CanPerformDashboardOperation = (
	request: DashboardOperationRequest
) => boolean;

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
	 * When true, widget types are still loading. Instances whose type is
	 * not yet in `widgetTypes` show a loading state instead of missing.
	 */
	isResolvingWidgetTypes?: boolean;

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
	 * Read-only for the dashboard: the consumer owns the settings and
	 * their persistence.
	 */
	gridSettings?: WidgetGridSettings;

	children?: ReactNode;
}
