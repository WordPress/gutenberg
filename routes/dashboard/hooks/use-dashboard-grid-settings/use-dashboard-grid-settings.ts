import { useSelect } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
import {
	DEFAULT_GRID,
	DEFAULT_ROW_HEIGHT,
	normalizeGridSettings,
	ROW_HEIGHT_PRESETS,
} from '@wordpress/widget-dashboard';
import type { WidgetGridSettings } from '@wordpress/widget-dashboard';

const SCOPE = 'core/dashboard';
const KEY = 'dashboardGridSettings';

/**
 * The column policy of the wp-admin dashboard: one column from 0px, two
 * from 600px, four from 960px of container width. The page decides this,
 * not the package. The removed Columns and Minimum tile width controls
 * persisted other values into the preference; stating the policy on read
 * keeps those stale values inert.
 */
const COLUMN_POLICY: Pick< WidgetGridSettings, 'columns' | 'minColumnWidth' > =
	{
		columns: { 0: 1, 600: 2, 960: 4 },
		minColumnWidth: undefined,
	};

/**
 * The removed Row height control wrote presets into the preference. The
 * package now honors any positive row height, so the page keeps snapping
 * the stored value to the nearest preset, the way it always rendered it.
 *
 * @param rowHeight Stored row height in pixels.
 * @return The nearest preset.
 */
function snapRowHeight( rowHeight: number ): number {
	return Object.values( ROW_HEIGHT_PRESETS ).reduce( ( closest, preset ) =>
		Math.abs( preset - rowHeight ) < Math.abs( closest - rowHeight )
			? preset
			: closest
	);
}

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
			WidgetGridSettings | undefined;
		const settings = {
			...normalizeGridSettings(
				stored ?? DEFAULT_GRID,
				DEFAULT_ROW_HEIGHT
			),
			...COLUMN_POLICY,
		};
		return settings.model === 'masonry'
			? settings
			: {
					...settings,
					rowHeight: snapRowHeight(
						settings.rowHeight ?? DEFAULT_ROW_HEIGHT
					),
				};
	}, [] );
}
