/**
 * Internal dependencies
 */
import type {
	DragPreviewRenderProps,
	ResizeHandleRenderProps,
} from '../shared/types';

/**
 * Lanes layout item definition.
 *
 * Mirrors the public surface of `display: grid-lanes`: column span,
 * an optional pinned lane, and an optional source order. Heights are
 * content-driven; there is no `height` field. There is no `'fill'`
 * (lanes pack their items by skyline; nothing is "left over").
 * `'full'` is expressed by setting `width` to the lane count.
 */
export type DashboardLanesLayoutItem = {
	/**
	 * Unique key that matches a child component key.
	 */
	key: string;

	/**
	 * Number of lanes this item spans (`grid-column: span N`). Clamped
	 * to the surface's lane count.
	 *
	 * @default 1
	 */
	width?: number;

	/**
	 * Pin the item to a specific 0-indexed lane. Pinned items are
	 * placed before auto items, so the auto flow runs around them.
	 * Out-of-range values (negative, or beyond `columns - width`) are
	 * clamped to the available range.
	 */
	lane?: number;

	/**
	 * Display order. Lower values render first. When omitted, the
	 * item falls back to its index in the `layout` array.
	 */
	order?: number;
};

/**
 * Props shared by fixed and responsive `DashboardLanes` variants.
 */
interface BaseDashboardLanesProps
	extends Omit<
		React.ComponentPropsWithoutRef< 'div' >,
		'children' | 'className' | 'style'
	> {
	/**
	 * Array of layout items.
	 */
	layout: DashboardLanesLayoutItem[];

	/**
	 * Surface children. Each child must carry a `key` matching an
	 * entry in `layout`; children without a match render at the end
	 * of the surface without explicit placement and fall through the
	 * lanes auto-flow.
	 */
	children: React.ReactNode;

	/**
	 * Additional CSS class on the surface root.
	 */
	className?: string;

	/**
	 * Inline styles on the surface root. Merged underneath the
	 * surface's own layout styles, so `display`, `gridTemplateColumns`,
	 * and `gap` always win.
	 */
	style?: React.CSSProperties;

	/**
	 * Gap multiplier (effective gap = `spacing * 4px`).
	 *
	 * @default 2
	 */
	spacing?: number;

	/**
	 * `flow-tolerance` value in pixels. When two candidate lanes
	 * differ in baseline by no more than this, the earlier lane wins
	 * to preserve source order. Larger values keep tiles closer to
	 * reading order at the cost of bigger empty regions.
	 *
	 * @default 16
	 */
	flowTolerance?: number;

	/**
	 * Snap unit for the polyfill's `grid-row-start` / `grid-row-end:
	 * span N` math. Smaller values produce sharper placement at the
	 * cost of a larger implicit row count. Ignored on browsers with
	 * native `display: grid-lanes` support.
	 *
	 * @default 4
	 */
	rowUnit?: number;

	/**
	 * Whether the surface is in edit mode (drag-to-reorder, resize).
	 *
	 * @default false
	 */
	editMode?: boolean;

	/**
	 * Fired when the user commits a drag or resize.
	 */
	onChangeLayout?: ( newLayout: DashboardLanesLayoutItem[] ) => void;

	/**
	 * Fired continuously during a gesture with the in-progress
	 * layout. The committed result still emits via `onChangeLayout`.
	 */
	onPreviewLayout?: ( previewLayout: DashboardLanesLayoutItem[] ) => void;

	/**
	 * Override the default corner resize handle. See `DashboardGrid`
	 * for the full contract; on lanes the handle is horizontal-only
	 * because heights are content-driven.
	 */
	renderResizeHandle?: React.ComponentType< ResizeHandleRenderProps >;

	/**
	 * Custom wrapper for the dragged-clone visual mounted inside
	 * `<DragOverlay>`. The surface always wraps the clone with a thin
	 * functional frame (lift scale, grabbing cursor, pointer pass-
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
}

interface FixedDashboardLanesProps extends BaseDashboardLanesProps {
	/**
	 * Total number of lanes in the surface.
	 *
	 * @default 6
	 */
	columns: number;

	minColumnWidth?: never;
}

interface ResponsiveDashboardLanesProps extends BaseDashboardLanesProps {
	/**
	 * Minimum width in pixels per lane. Enables responsive mode: the
	 * lane count is derived from container width, down to 1.
	 */
	minColumnWidth?: number;

	columns?: never;
}

export type DashboardLanesProps =
	| FixedDashboardLanesProps
	| ResponsiveDashboardLanesProps;
