import { addQueryArgs } from '@wordpress/url';
import { withWeakMapCache, getNormalizedCommaSeparable } from '../utils';
import type { Query, QueryParts } from './types';

/**
 * Given a query object, returns an object of parts, including pagination
 * details (`page` and `perPage`, or default values). All other properties are
 * encoded into a stable (idempotent) `stableKey` value.
 *
 * @param query Optional query object.
 *
 * @return Query parts.
 */
export function getQueryParts( query: Query ): QueryParts {
	const parts: QueryParts = {
		stableKey: '',
		page: 1,
		perPage: 10,
		offset: null,
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

			case 'offset': {
				const numericOffset = Number( value );
				if ( Number.isFinite( numericOffset ) ) {
					parts.offset = numericOffset;
				}
				break;
			}

			case 'context':
				// The REST API context is a string.
				parts.context = value as string;
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
					if ( typeof value === 'number' ) {
						value = value.toString();
					}
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
