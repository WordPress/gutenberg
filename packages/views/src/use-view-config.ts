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
 * A custom hook that retrieves the view configuration for a given entity
 * from the core data store.
 *
 * @param {Object} params
 * @param {string} params.kind The kind of the entity.
 * @param {string} params.name The name of the entity.
 * @return {Object} An object containing the `defaultView` and `defaultLayouts` configuration for the entity.
 */
export function useViewConfig( {
	kind,
	name,
}: {
	kind: string;
	name: string;
} ): { defaultView: View; defaultLayouts: SupportedLayouts } {
	return useSelect(
		( select ) => {
			const config = unlock( select( coreStore ) ).getViewConfig(
				kind,
				name
			);
			return {
				defaultView: config?.default_view,
				defaultLayouts: config?.default_layouts,
				viewList: config?.view_list,
			};
		},
		[ kind, name ]
	);
}
