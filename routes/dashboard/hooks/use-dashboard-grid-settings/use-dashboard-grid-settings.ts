import { useSelect } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
import {
	DEFAULT_GRID,
	DEFAULT_ROW_HEIGHT,
	normalizeGridSettings,
	WIDGET_DASHBOARD_COLUMN_COUNT,
} from '@wordpress/widget-dashboard';
import type { WidgetGridSettings } from '@wordpress/widget-dashboard';

const SCOPE = 'core/dashboard';
const KEY = 'dashboardGridSettings';

/**
 * Reads the persisted dashboard grid-settings preference, normalized, with
 * the bundled defaults as fallback. The dashboard renders these settings but
 * does not edit them, so the preference is read-only and shared across
 * dashboards.
 *
 * @return The grid settings to render with.
 */
export function useDashboardGridSettings(): WidgetGridSettings {
	return useSelect( ( select ) => {
		const stored = select( preferencesStore ).get( SCOPE, KEY ) as
			| WidgetGridSettings
			| undefined;
		return {
			...normalizeGridSettings(
				stored ?? DEFAULT_GRID,
				DEFAULT_ROW_HEIGHT
			),
			// The removed Columns control persisted other counts into this
			// preference; pinning on read keeps those stale values inert.
			columns: WIDGET_DASHBOARD_COLUMN_COUNT,
		};
	}, [] );
}
