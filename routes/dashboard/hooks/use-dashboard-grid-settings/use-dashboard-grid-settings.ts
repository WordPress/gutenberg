/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import type { WidgetGridSettings } from '../../widget-dashboard/types';

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
	columns: 6,
	minColumnWidth: 350,
	rowHeight: 200,
};

/**
 * Hook for managing dashboard grid-settings preferences.
 *
 * Returns the persisted settings, a setter that writes through to the
 * preferences store, and a reset action that applies the bundled
 * defaults. The preference is shared across dashboard surfaces today;
 * if a per-dashboard split is needed later, the signature can grow a
 * surface-identifying parameter without touching call sites that pass
 * the dashboard's name through.
 *
 * @return Tuple `[ settings, setSettings, resetSettings ]`.
 */
export function useDashboardGridSettings(): [
	WidgetGridSettings,
	( settings: WidgetGridSettings ) => void,
	() => void,
] {
	const settings = useSelect(
		( select ) =>
			( select( preferencesStore ).get( SCOPE, KEY ) as
				| WidgetGridSettings
				| undefined ) ?? DEFAULT_GRID_SETTINGS,
		[]
	);

	const { set } = useDispatch( preferencesStore );

	function setSettings( next: WidgetGridSettings ) {
		void set( SCOPE, KEY, next );
	}

	function resetSettings() {
		void set( SCOPE, KEY, DEFAULT_GRID_SETTINGS );
	}

	return [ settings, setSettings, resetSettings ];
}
