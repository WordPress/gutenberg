/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import type { View, SupportedLayouts, Form } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import { unlock } from './lock-unlock';

/**
 * A hook that retrieves the view configuration for a given entity
 * from the core data store.
 *
 * @param {Object}             params
 * @param {string}             params.kind     The kind of the entity.
 * @param {string}             params.name     The name of the entity.
 * @param {?(string|string[])} [params.fields] Subset of top-level config
 *                                             properties to request, as an array
 *                                             or a comma-separated string
 *                                             (mapped to the REST API `_fields`
 *                                             parameter). When omitted, the full
 *                                             config is requested.
 * @return {Object} An object containing the `default_view`, `default_layouts`, `view_list`, and `form` configuration for the entity.
 */
export function useViewConfig( {
	kind,
	name,
	fields,
}: {
	kind: string;
	name: string;
	fields?: string | string[];
} ): {
	default_view: View | undefined;
	default_layouts: SupportedLayouts | undefined;
	view_list: Array< any > | undefined;
	form: Form | undefined;
} {
	// Sort fields so the cache key is independent of the order callers list
	// them; `['title','author']` and `['author','title']` request the same data.
	const fieldList = Array.isArray( fields ) ? fields : fields?.split( ',' );
	const fieldsKey = fieldList
		? [ ...fieldList ].sort().join( ',' )
		: undefined;
	return useSelect(
		( select ) => {
			return unlock( select( coreStore ) ).getViewConfig( kind, name, {
				fields: fieldsKey,
			} );
		},
		[ kind, name, fieldsKey ]
	);
}
