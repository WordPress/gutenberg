/**
 * Base properties shared by all dashboard grid layout items.
 */
interface DashboardGridLayoutItemBase {
	/**
	 * Unique key that matches a child component key.
	 */
	key: string;

	/**
	 * Number of columns this item spans.
	 */
	width?: number;

	/**
	 * Number of rows this item spans.
	 */
	height?: number;

	/**
	 * Optional order value for responsive mode (lower values displayed first)
	 */
	order?: number;
}

/**
 * Dashboard grid layout item definition.
 *
 * `fullWidth` and `fillWidth` are mutually exclusive:
 * - `fullWidth` spans all columns (`grid-column: 1 / -1`).
 * - `fillWidth` spans the remaining columns in the current row.
 */
export type DashboardGridLayoutItem =
	| ( DashboardGridLayoutItemBase & {
			fullWidth?: false | undefined;
			fillWidth?: boolean;
	  } )
	| ( DashboardGridLayoutItemBase & {
			fullWidth: true;
			fillWidth?: false | undefined;
	  } );

/**
 * Props shared by fixed and responsive DashboardGrid variants.
 */
interface BaseDashboardGridProps {
	/**
	 * Array of layout items.
	 */
	layout: DashboardGridLayoutItem[];

	/**
	 * Grid children.
	 */
	children: React.ReactNode;

	/**
	 * Additional CSS class.
	 */
	className?: string;

	/**
	 * Grid gap multiplier size (e.g., a spacing of 2 results in a gap
	 * of 8px, it's multiplied by 4).
	 *
	 * @default 2
	 */
	spacing?: number;

	/**
	 * Height of each row in pixels or auto.
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
	 * Callback fired when layout changes due to item dragging.
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
	 * Minimum width in pixels for each column in responsive mode.
	 * If provided, enables responsive mode which automatically
	 * adjusts columns based on container width.
	 */
	minColumnWidth?: number;

	columns?: never;
}

export type DashboardGridProps =
	| FixedDashboardGridProps
	| ResponsiveDashboardGridProps;
