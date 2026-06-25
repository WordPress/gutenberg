/**
 * Internal dependencies
 */
import { WIDGET_DASHBOARD_COLUMN_COUNT } from '../../types';

/**
 * Container width (px) below which the dashboard uses a single column.
 * Matches `@container widget-dashboard (max-width: …)` in widgets CSS.
 */
export const WIDGET_DASHBOARD_CONTAINER_BREAKPOINT_ONE_COLUMN = 600;

/**
 * Container width (px) below which the dashboard drops from four columns
 * to two. Above this threshold (and below the four-column cap) the
 * grid uses {@link WIDGET_DASHBOARD_COLUMN_COUNT}.
 */
export const WIDGET_DASHBOARD_CONTAINER_BREAKPOINT_TWO_COLUMNS = 960;

/**
 * Resolves the dashboard grid column count from the widget surface
 * container width. Uses discrete steps (4 → 2 → 1), not viewport
 * media queries.
 *
 * @param containerWidth Measured inline size of the dashboard grid container.
 * @return Column count for {@link @wordpress/grid} surfaces.
 */
export function resolveDashboardColumnCount( containerWidth: number ): number {
	if ( containerWidth <= 0 ) {
		return WIDGET_DASHBOARD_COLUMN_COUNT;
	}

	if ( containerWidth < WIDGET_DASHBOARD_CONTAINER_BREAKPOINT_ONE_COLUMN ) {
		return 1;
	}

	if ( containerWidth < WIDGET_DASHBOARD_CONTAINER_BREAKPOINT_TWO_COLUMNS ) {
		return 2;
	}

	return WIDGET_DASHBOARD_COLUMN_COUNT;
}
