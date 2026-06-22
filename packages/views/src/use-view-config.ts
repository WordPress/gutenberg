/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
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
	default_view: View;
	default_layouts: SupportedLayouts;
	view_list: Array< any >;
	form: Form | undefined;
} {
	// Stabilize the options object passed to the resolver so resolution is
	// deduplicated. The resolver keys its cache on the arguments array, and the
	// data layer compares the `options` object by reference, so a fresh literal
	// on each call would re-trigger the REST request on every store change.
	// Keying on the joined string also removes any need for callers to pass a
	// referentially-stable `fields` array.
	//
	// Normalize a comma-separated string or array to an array, then sort before
	// joining so the key is independent of the order in which callers list
	// fields; `['title','author']` and `['author','title']` request the same
	// data and should share a single cache entry. The resolver accepts either
	// form too (via `getNormalizedCommaSeparable`), so keep the hook lenient.
	const fieldList = Array.isArray( fields ) ? fields : fields?.split( ',' );
	const fieldsKey = fieldList
		? [ ...fieldList ].sort().join( ',' )
		: undefined;
	const options = useMemo(
		() => ( { fields } ),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[ fieldsKey ]
	);
	return useSelect(
		( select ) => {
			return unlock( select( coreStore ) ).getViewConfig(
				kind,
				name,
				options
			);
		},
		[ kind, name, options ]
	);
}
