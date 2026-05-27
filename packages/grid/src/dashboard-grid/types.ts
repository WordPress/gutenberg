/**
 * Internal dependencies
 */
import type {
	DragPreviewRenderProps,
	GridOverlayRenderProps,
	ResizeDelta,
	ResizeHandleRenderProps,
} from '../shared/types';
import type { ResizeSnapSize } from '../shared/resize-snap';

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
	 * resized. Drives the drag activator cursor.
	 *
	 * @default false
	 */
	interacting?: boolean;

	/**
	 * Whether a tile drag is in progress. Mutes each tile's
	 * `actionableArea` with `inert` so hovers on other tiles' controls
	 * do not steal the gesture.
	 *
	 * @default false
	 */
	dragging?: boolean;

	/**
	 * The content to be displayed within the grid item.
	 */
	children: React.ReactNode;

	/**
	 * Content rendered above the draggable area that stays interactive
	 * in edit mode, typically action buttons, menus, or links. While
	 * a tile drag is in progress, this content is set `inert` so hovers
	 * on other tiles can't steal the gesture. During resize, visibility
	 * is controlled by grid-level CSS hooks.
	 */
	actionableArea?: React.ReactNode;

	/**
	 * Callback fired while the item is being resized. Receives the
	 * item's `key` plus the cursor offset from the gesture start in
	 * pixels. The grid derives snapped spans from the delta and passes
	 * them back through `resizeSnapPreview`.
	 */
	onResize: ( id: string, delta: ResizeDelta ) => void;

	/**
	 * Snapped grid size in pixels for the resize-preview outline. The
	 * tile content resizes continuously with the cursor; this outline
	 * shows the span the layout will commit to on release.
	 */
	resizeSnapPreview?: ResizeSnapSize | null;

	/**
	 * Minimum tile width while resizing, in pixels (one column track).
	 */
	minResizeWidthPx: number;

	/**
	 * Minimum tile height while resizing, in pixels (one row track).
	 * Omitted when vertical resize is disabled.
	 */
	minResizeHeightPx?: number;

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
 * Props for `DashboardGrid`. Extends the standard div props so consumers
 * can pass `id`, `aria-*`, `data-*`, event handlers, etc., directly on
 * the grid root.
 *
 * `columns` and `minColumnWidth` compose as a layered model:
 * - `columns` alone: fixed N columns; each tile scales with the container.
 * - `minColumnWidth` alone: column count derives from container width,
 *   floored by the per-tile minimum, down to 1 column.
 * - Both together: `columns` caps the count, `minColumnWidth` enforces a
 *   per-tile width floor that can reduce the count below the cap on
 *   narrow containers ("up to N columns, but never narrower than W px").
 */
export interface DashboardGridProps
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
	 * entry in `layout`; children without a match render at the end
	 * of the grid without explicit placement and fall through CSS
	 * Grid's auto-flow.
	 */
	children: React.ReactNode;

	/**
	 * Additional CSS class on the grid root.
	 */
	className?: string;

	/**
	 * Inline styles applied to the grid root. Merged underneath the
	 * grid's own layout styles, so the layout (`gridTemplateColumns`,
	 * `gridAutoRows`) always wins. The gap between tiles is owned by
	 * the design-system gap token and is not configurable per
	 * instance; override it via a theme or density change.
	 */
	style?: React.CSSProperties;

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

	/**
	 * through) and mounts this component inside it; the consumer
	 * owns the visual chrome (shadow, radius, padding).
	 *
	 * When omitted, the cloned children render directly inside the
	 * functional frame so any chrome the consumer applied to the
	 * persistent tile carries through unchanged.
	 *
	 * Token-only adjustments (lift scale, placeholder opacity,
	 * outline color, placeholder radius) flow through CSS custom
	 * properties documented in the README.
	 */
	renderDragPreview?: React.ComponentType< DragPreviewRenderProps >;

	/**
	 * Override the default edit-mode overlay (row-marker tiles per
	 * column) with a custom component. The grid supplies the resolved
	 * column count, row height, and row count; the consumer is
	 * responsible for the visual.
	 *
	 * The overlay only renders when `editMode` is true. When omitted,
	 * the package's default visual is used.
	 */
	renderGridOverlay?: React.ComponentType< GridOverlayRenderProps >;

	/**
	 * Target column count (cap). When set alone, the grid renders this
	 * many columns and tiles scale with the container.
	 *
	 * Composes with `minColumnWidth`: if both are set, the effective
	 * column count is `min( columns, fitsAtMinWidth )`. When omitted
	 * but `minColumnWidth` is set, the count is uncapped and derives
	 * purely from the container width. When both are omitted, the
	 * grid renders six columns.
	 */
	columns?: number;

	/**
	 * Per-tile minimum width in pixels. The effective column count is
	 * derived from container width, floored by this value, down to 1.
	 *
	 * Composes with `columns`: when both are set, this acts as a floor
	 * that can reduce the count below `columns` on narrow containers.
	 */
	minColumnWidth?: number;
}
