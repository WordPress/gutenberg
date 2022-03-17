/**
 * WordPress dependencies
 */
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { withWeakMapCache, getNormalizedCommaSeparable } from '../utils';

/**
 * An object of properties describing a specific query.
 *
 * @typedef {Object} WPQueriedDataQueryParts
 *
 * @property {number}      page      The query page (1-based index, default 1).
 * @property {number}      perPage   Items per page for query (default 10).
 * @property {string}      stableKey An encoded stable string of all non-
 *                                   pagination, non-fields query parameters.
 * @property {?(string[])} fields    Target subset of fields to derive from
 *                                   item objects.
 * @property {?(number[])} include   Specific item IDs to include.
 * @property {string}      context   Scope under which the request is made;
 *                                   determines returned fields in response.
 */

/**
 * Given a query object, returns an object of parts, including pagination
 * details (`page` and `perPage`, or default values). All other properties are
 * encoded into a stable (idempotent) `stableKey` value.
 *
 * @param {Object} query Optional query object.
 *
 * @return {WPQueriedDataQueryParts} Query parts.
 */
export function getQueryParts( query ) {
	/**
	 * @type {WPQueriedDataQueryParts}
	 */
	const parts = {
		stableKey: '',
		page: 1,
		perPage: 10,
		fields: null,
		include: null,
		context: 'default',
	};

	// Ensure stable key by sorting keys. Also more efficient for iterating.
	const keys = Object.keys( query ).sort();

	for ( let i = 0; i < keys.length; i++ ) {
		const key = keys[ i ];
		let value = query[ key ];

		switch ( key ) {
			case 'page':
				parts[ key ] = Number( value );
				break;

			case 'per_page':
				parts.perPage = Number( value );
				break;

			case 'context':
				parts.context = value;
				break;

			default:
				// While in theory, we could exclude "_fields" from the stableKey
				// because two request with different fields have the same results
				// We're not able to ensure that because the server can decide to omit
				// fields from the response even if we explicitly asked for it.
				// Example: Asking for titles in posts without title support.
				if ( key === '_fields' ) {
					parts.fields = getNormalizedCommaSeparable( value ) ?? [];
					// Make sure to normalize value for `stableKey`
					value = parts.fields.join();
				}

				// Two requests with different include values cannot have same results.
				if ( key === 'include' ) {
					parts.include = (
						getNormalizedCommaSeparable( value ) ?? []
					).map( Number );
					// Normalize value for `stableKey`.
					value = parts.include.join();
				}

				// While it could be any deterministic string, for simplicity's
				// sake mimic querystring encoding for stable key.
				//
				// TODO: For consistency with PHP implementation, addQueryArgs
				// should accept a key value pair, which may optimize its
				// implementation for our use here, vs. iterating an object
				// with only a single key.
				parts.stableKey +=
					( parts.stableKey ? '&' : '' ) +
					addQueryArgs( '', { [ key ]: value } ).slice( 1 );
		}
	}

	return parts;
}

export default withWeakMapCache( getQueryParts );
