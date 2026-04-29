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
