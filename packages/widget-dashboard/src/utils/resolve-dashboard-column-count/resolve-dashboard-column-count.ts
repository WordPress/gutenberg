import { WIDGET_DASHBOARD_COLUMN_COUNT } from '../../types';

/**
 * Container width (px) below which the dashboard uses a single column.
 * Matches `@container widget-dashboard (max-width: …)` in widgets CSS.
 */
export const WIDGET_DASHBOARD_CONTAINER_BREAKPOINT_ONE_COLUMN = 600;

/**
 * Container width (px) below which the dashboard drops from the column
 * cap to two. Above this threshold the grid uses the cap itself.
 */
export const WIDGET_DASHBOARD_CONTAINER_BREAKPOINT_TWO_COLUMNS = 960;

/**
 * Resolves the wide-container column count a host asked for. A finite value
 * is floored, with a floor of one and no ceiling: how many columns a surface
 * can carry is the host's decision, not the package's. An absent or
 * non-finite value resolves to {@link WIDGET_DASHBOARD_COLUMN_COUNT}.
 *
 * @param columns Host-provided `gridSettings.columns`, if any.
 * @return Column count for wide containers.
 */
export function resolveDashboardColumnCap( columns?: number ): number {
	if ( typeof columns !== 'number' || ! Number.isFinite( columns ) ) {
		return WIDGET_DASHBOARD_COLUMN_COUNT;
	}

	return Math.max( 1, Math.floor( columns ) );
}

/**
 * Resolves the dashboard grid column count from the widget surface
 * container width. Uses discrete steps (cap → 2 → 1), not viewport
 * media queries.
 *
 * @param containerWidth Measured inline size of the dashboard grid container.
 * @param maxColumns     Column cap for wide containers; see
 *                       {@link resolveDashboardColumnCap}.
 * @return Column count for {@link @wordpress/grid} surfaces.
 */
export function resolveDashboardColumnCount(
	containerWidth: number,
	maxColumns: number = WIDGET_DASHBOARD_COLUMN_COUNT
): number {
	if ( containerWidth <= 0 ) {
		return maxColumns;
	}

	if ( containerWidth < WIDGET_DASHBOARD_CONTAINER_BREAKPOINT_ONE_COLUMN ) {
		return 1;
	}

	if ( containerWidth < WIDGET_DASHBOARD_CONTAINER_BREAKPOINT_TWO_COLUMNS ) {
		// A cap of one must not step up to two in the middle band.
		return Math.min( 2, maxColumns );
	}

	return maxColumns;
}
