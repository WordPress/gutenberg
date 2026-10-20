import type { WidgetGridSettings } from '@wordpress/widget-dashboard';

/**
 * The geometry of the wp-admin dashboard, decided by the page: one column
 * from 0px, two from 600px and four from 960px of container width, over
 * 40px rows. The removed Layout settings drawer persisted other values into
 * the `core/dashboard.dashboardGridSettings` preference; the dashboard no
 * longer renders with them, and the layout hook reads that preference only
 * to tell under which row height a layout without a stamp was saved.
 */
export const WP_ADMIN_GRID: WidgetGridSettings = {
	model: 'grid',
	columns: { 0: 1, 600: 2, 960: 4 },
	rowHeight: 40,
};

/**
 * The grid settings the dashboard renders with. The dashboard renders
 * these settings but does not edit them.
 *
 * @return The grid settings to render with.
 */
export function useDashboardGridSettings(): WidgetGridSettings {
	return WP_ADMIN_GRID;
}
