/**
 * External dependencies
 */
import type { useDraggable } from '@dnd-kit/core';

// `useDraggable`'s `listeners` and `attributes` types are not exported
// from `@dnd-kit/core`'s public surface, so derive them from the hook
// itself rather than via a deep import.
type DraggableBindings = ReturnType< typeof useDraggable >;

/**
 * Cursor offset reported by the resize handle, in pixels relative to
 * the gesture start. Width and height are independent so the grid can
 * step columns and rows separately.
 */
export type ResizeDelta = {
	width: number;
	height: number;
};

/**
 * Dashboard grid layout item definition.
 *
 * `width` accepts either a numeric column span or a discriminated string:
 * - `number` spans that many columns (clamped to the grid's column count).
 * - `'fill'` spans the remaining columns in the current row.
 * - `'full'` spans all columns (`grid-column: 1 / -1`).
 */
export type DashboardGridLayoutItem = {
	/**
	 * Unique key that matches a child component key.
	 */
	key: string;

	/**
	 * Number of columns this item spans, or a string discriminator
	 * (`'fill'` or `'full'`).
	 */
	width?: number | 'fill' | 'full';

	/**
	 * Number of rows this item spans.
	 *
	 * @default 1
	 */
	height?: number;

	/**
	 * Display order for the item. Lower values render first. When
	 * omitted, the item falls back to its index in the `layout` array.
	 */
	order?: number;
};

/**
 * Props received by a custom resize handle component. Spread `listeners`
 * and `attributes` onto the element that should respond to the gesture,
 * and assign `ref` to the same element so dnd-kit can track it.
 */
export interface ResizeHandleRenderProps {
	/**
	 * Ref callback to attach to the gesture-bearing element.
	 */
	ref: DraggableBindings[ 'setNodeRef' ];

	/**
	 * Pointer/keyboard event listeners that initiate the drag.
	 */
	listeners: DraggableBindings[ 'listeners' ];

	/**
	 * Accessibility and dnd-kit attributes (role, aria-*, tabIndex…).
	 */
	attributes: DraggableBindings[ 'attributes' ];

	/**
	 * Whether vertical resizing is allowed for this tile. Useful for
	 * adapting the cursor or visual cue.
	 */
	verticalResizable: boolean;

	/**
	 * True while the user is actively dragging this handle. Use it to
	 * swap colors, icons, or transforms during the gesture.
	 */
	isResizing: boolean;

	/**
	 * Owning grid item's `key`. Available so consumers can render
	 * per-tile content if needed.
	 */
	itemId?: string;
}

/**
 * Props for the internal `<ResizeHandle />` wrapper.
 */
export interface ResizeHandleProps {
	/**
	 * Owning grid item's `key`. Forwarded as `data.itemId` on the
	 * draggable so the parent can correlate the gesture with a tile
	 * if needed.
	 */
	itemId?: string;

	/**
	 * Whether the handle should track vertical movement. When false,
	 * the handle still appears but only emits horizontal deltas, and
	 * the cursor is constrained to the column resize axis.
	 *
	 * @default true
	 */
	verticalResizable?: boolean;

	/**
	 * Callback fired while the handle is being dragged. Receives the
	 * cursor offset from the gesture start in pixels.
	 */
	onResize?: ( delta: ResizeDelta ) => void;

	/**
	 * Callback fired when the gesture ends.
	 */
	onResizeEnd?: () => void;

	/**
	 * Component that overrides the default corner triangle with a
	 * custom element. Receives gesture wiring (`ref`, `listeners`,
	 * `attributes`) plus context. The grid keeps ownership of the
	 * `<DndContext>` and the throttled delta loop; consumers are only
	 * responsible for the visual.
	 */
	renderResizeHandle?: React.ComponentType< ResizeHandleRenderProps >;
}

/**
 * Props for the internal `<GridItem />` wrapper.
 */
export type GridItemProps = {
	/**
	 * The layout item containing grid positioning information.
	 */
	item: DashboardGridLayoutItem;

	/**
	 * The maximum number of columns in the grid.
	 */
	maxColumns: number;

	/**
	 * Whether drag and resize interactions are disabled.
	 *
	 * @default false
	 */
	disabled?: boolean;

	/**
	 * Whether the item can be resized vertically. Disabled when the
	 * grid uses `rowHeight: 'auto'`, where row height is driven by
	 * content rather than by the user.
	 *
	 * @default true
	 */
	verticalResizable?: boolean;

	/**
	 * Whether any tile in the grid is currently being dragged or
	 * resized. When true, the item mutes its `actionableArea` with
	 * `inert` so pointer hovers over buttons in other tiles do not
	 * steal the in-progress gesture.
	 *
	 * @default false
	 */
	interacting?: boolean;

	/**
	 * The content to be displayed within the grid item.
	 */
	children: React.ReactNode;

	/**
	 * Content rendered above the draggable area that stays interactive
	 * in edit mode — typically action buttons, menus, or links. While
	 * any tile in the grid is being dragged or resized, this content
	 * is set `inert` so hovers on other tiles can't steal the gesture.
	 */
	actionableArea?: React.ReactNode;

	/**
	 * Callback fired while the item is being resized. Receives the
	 * item's `key` plus the cursor offset from the gesture start in
	 * pixels; the grid converts the offset to column/row spans.
	 */
	onResize: ( id: string, delta: ResizeDelta ) => void;

	/**
	 * Callback fired when the resize gesture ends.
	 */
	onResizeEnd: () => void;

	/**
	 * Component forwarded to `<ResizeHandle />` to override the default
	 * corner triangle. See `DashboardGridProps.renderResizeHandle`.
	 */
	renderResizeHandle?: React.ComponentType< ResizeHandleRenderProps >;
};

/**
 * Props shared by fixed and responsive DashboardGrid variants. Extends
 * the standard div props so consumers can pass `id`, `aria-*`, `data-*`,
 * event handlers, etc., directly on the grid root.
 */
interface BaseDashboardGridProps
	extends Omit<
		React.ComponentPropsWithoutRef< 'div' >,
		'children' | 'className' | 'style'
	> {
	/**
	 * Array of layout items.
	 */
	layout: DashboardGridLayoutItem[];

	/**
	 * Grid children. Each child must carry a `key` that matches an
	 * entry in `layout`; children without a match are rendered outside
	 * the grid.
	 */
	children: React.ReactNode;

	/**
	 * Additional CSS class on the grid root.
	 */
	className?: string;

	/**
	 * Inline styles applied to the grid root. Merged underneath the
	 * grid's own layout styles, so the layout (`gridTemplateColumns`,
	 * `gridAutoRows`, `gap`) always wins.
	 */
	style?: React.CSSProperties;

	/**
	 * Grid gap multiplier size (e.g., a spacing of 2 results in a gap
	 * of 8px, it's multiplied by 4).
	 *
	 * @default 2
	 */
	spacing?: number;

	/**
	 * Height of each row in pixels, or `'auto'` to let the tallest
	 * tile in the row size it.
	 *
	 * @default 'auto'
	 */
	rowHeight?: number | 'auto';

	/**
	 * Whether the grid is in edit mode (allows dragging and
	 * repositioning items).
	 *
	 * @default false
	 */
	editMode?: boolean;

	/**
	 * Callback fired when the user commits a drag or resize. Receives
	 * the resulting layout.
	 */
	onChangeLayout?: ( newLayout: DashboardGridLayoutItem[] ) => void;

	/**
	 * Callback fired continuously during a drag or resize interaction
	 * with the in-progress layout. Useful for live feedback in the
	 * surface (e.g., displaying the current width/position). The final
	 * committed layout is still emitted via `onChangeLayout`.
	 */
	onPreviewLayout?: ( previewLayout: DashboardGridLayoutItem[] ) => void;

	/**
	 * Override the default corner-triangle resize handle with a custom
	 * component. The grid still owns the gesture (dnd-kit `<DndContext>`,
	 * throttled delta loop) and passes the wiring to the consumer:
	 * spread `listeners` and `attributes` and assign `ref` on the
	 * element that should receive the gesture. Use `disabled` and
	 * `verticalResizable` to adapt the visual to context.
	 */
	renderResizeHandle?: React.ComponentType< ResizeHandleRenderProps >;
}

interface FixedDashboardGridProps extends BaseDashboardGridProps {
	/**
	 * Total number of columns in the grid.
	 *
	 * @default 6
	 */
	columns: number;

	minColumnWidth?: never;
}

interface ResponsiveDashboardGridProps extends BaseDashboardGridProps {
	/**
	 * Minimum width in pixels per column. Enables responsive mode:
	 * the column count is derived from container width, down to a
	 * minimum of 1 column. Mutually exclusive with `columns`.
	 */
	minColumnWidth?: number;

	columns?: never;
}

export type DashboardGridProps =
	| FixedDashboardGridProps
	| ResponsiveDashboardGridProps;
