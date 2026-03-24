/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import type { View, SupportedLayouts } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import { unlock } from './lock-unlock';

/**
 * A hook that retrieves the view configuration for a given entity
 * from the core data store.
 *
 * @param {Object} params
 * @param {string} params.kind The kind of the entity.
 * @param {string} params.name The name of the entity.
 * @return {Object} An object containing the `default_view`, `default_layouts`, and `view_list` configuration for the entity.
 */
export function useViewConfig( {
	kind,
	name,
}: {
	kind: string;
	name: string;
} ): {
	default_view: View;
	default_layouts: SupportedLayouts;
	view_list: Array< any >;
} {
	return useSelect(
		( select ) => {
			return unlock( select( coreStore ) ).getViewConfig( kind, name );
		},
		[ kind, name ]
	);
}
