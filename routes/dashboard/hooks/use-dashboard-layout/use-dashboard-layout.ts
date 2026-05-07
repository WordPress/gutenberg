/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import type { DashboardWidget } from '../../widget-dashboard';

const SCOPE = 'core/dashboard';
const KEY = 'dashboardLayout';

/**
 * Hook for managing dashboard layout preferences.
 *
 * Returns the persisted layout, a setter that writes through to the
 * preferences store, and a reset action that clears the layout to its
 * empty state. Plugin-provided defaults will replace the empty fallback
 * once the defaults source lands.
 *
 * @return Tuple `[ layout, setLayout, resetLayout ]`.
 */
function useDashboardLayout(): [
	DashboardWidget[],
	( layout: DashboardWidget[] ) => void,
	() => void,
] {
	const layout = useSelect(
		( select ) =>
			( select( preferencesStore ).get( SCOPE, KEY ) as
				| DashboardWidget[]
				| undefined ) ?? [],
		[]
	);

	const { set } = useDispatch( preferencesStore );

	function setLayout( newLayout: DashboardWidget[] ) {
		void set( SCOPE, KEY, newLayout );
	}

	function resetLayout() {
		void set( SCOPE, KEY, [] );
	}

	return [ layout, setLayout, resetLayout ];
}

export default useDashboardLayout;
