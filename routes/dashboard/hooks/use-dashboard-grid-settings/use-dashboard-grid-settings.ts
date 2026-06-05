/**
 * External dependencies
 */
import fastDeepEqual from 'fast-deep-equal/es6/index.js';

/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import type { WidgetGridSettings } from '../../widget-dashboard/types';
import { WIDGET_DASHBOARD_COLUMN_COUNT } from '../../widget-dashboard/types';
import { normalizeGridSettings } from '../../widget-dashboard/utils/normalize-grid-settings';
import { DEFAULT_ROW_HEIGHT } from '../../widget-dashboard/utils/row-height-presets';

const SCOPE = 'core/dashboard';
const KEY = 'dashboardGridSettings';

/**
 * Default grid settings applied when the preferences store has no
 * entry yet, and the value `resetGridSettings` writes back when the
 * user requests a reset. Kept aligned with the in-component default
 * in `WidgetDashboardProvider` so consumers see consistent values
 * whether or not they wire up this hook.
 */
const DEFAULT_GRID_SETTINGS: WidgetGridSettings = {
	model: 'grid',
	columns: WIDGET_DASHBOARD_COLUMN_COUNT,
	rowHeight: DEFAULT_ROW_HEIGHT,
};

/**
 * Hook for managing dashboard grid-settings preferences.
 *
 * Returns the persisted settings, a setter that writes through to the
 * preferences store, and a reset action that applies the bundled
 * defaults. The preference is shared across dashboards today; if a
 * per-dashboard split is needed later, the signature can grow a
 * dashboard-identifying parameter without touching call sites that
 * pass the dashboard's name through.
 *
 * @return Tuple `[ settings, setSettings, resetSettings ]`.
 */
export function useDashboardGridSettings(): [
	WidgetGridSettings,
	( settings: WidgetGridSettings ) => void,
	() => void,
] {
	const settings = useSelect( ( select ) => {
		const stored = select( preferencesStore ).get( SCOPE, KEY ) as
			| WidgetGridSettings
			| undefined;
		return normalizeGridSettings(
			stored ?? DEFAULT_GRID_SETTINGS,
			DEFAULT_ROW_HEIGHT
		);
	}, [] );

	const { set } = useDispatch( preferencesStore );

	function setSettings( next: WidgetGridSettings ) {
		// Persist "back to default" as a cleared preference rather than a stored
		// copy of the defaults: the dashboard then tracks the current code
		// default and the value can never drift. Reset routes through here (the
		// drawer commit fires the setter with the default), so this is what makes
		// Reset + Save truly clear the stored preference.
		if ( fastDeepEqual( next, DEFAULT_GRID_SETTINGS ) ) {
			void set( SCOPE, KEY, null );
			return;
		}
		void set( SCOPE, KEY, next );
	}

	function resetSettings() {
		void set( SCOPE, KEY, null );
	}

	return [ settings, setSettings, resetSettings ];
}
