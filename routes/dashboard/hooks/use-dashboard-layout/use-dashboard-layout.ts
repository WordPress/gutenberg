/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import type { DashboardWidget } from '../../widget-dashboard';

const SCOPE = 'core/dashboard';
const KEY = 'dashboardLayout';

/**
 * Identifier of a dashboard, structured as `<plugin>_<page>` to mirror
 * the underscore form produced by the wp-build pipeline (see
 * `{{PREFIX}}_{{PAGE_SLUG_UNDERSCORE}}` in the page templates).
 */
export type DashboardName = `${ string }_${ string }`;

/**
 * Hook for managing dashboard layout preferences.
 *
 * Returns the persisted layout, a setter that writes through to the
 * preferences store, and a reset action that fetches the dashboard's
 * registered default from the REST API and applies it locally.
 *
 * @param dashboardName Identifier of the dashboard as produced by the
 *                      build pipeline. Used as the `{name}` segment of
 *                      the default-layout route.
 * @return Tuple `[ layout, setLayout, resetLayout ]`.
 */
export function useDashboardLayout(
	dashboardName: DashboardName
): [
	DashboardWidget[],
	( layout: DashboardWidget[] ) => void,
	() => Promise< void >,
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

	async function resetLayout() {
		const fresh = ( await apiFetch( {
			path: `/wp/v2/dashboards/${ dashboardName }/default-layout`,
		} ) ) as DashboardWidget[];

		void set( SCOPE, KEY, fresh );
	}

	return [ layout, setLayout, resetLayout ];
}
