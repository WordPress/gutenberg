import apiFetch from '@wordpress/api-fetch';
import type { RenderBlocks } from '@wordpress/widget-primitives';

/*
 * WordPress implementations of the seams `@wordpress/widget-primitives`
 * declares but cannot implement without binding itself to wp-admin.
 *
 * Nothing here is a dashboard decision: any WordPress host would write the
 * same code, so this module is the extraction point once a second one exists.
 * Host decisions (navigation, notices, field-type vocabulary) belong elsewhere.
 */

const RENDER_PATH = '/wp/v2/widget-defs/render';

/* Resolved renders, keyed by markup and attributes, which together determine
   the output. Cleared on rejection so the next mount retries. */
const cache = new Map< string, Promise< string > >();

function cacheKey(
	markup: string,
	attributes: Record< string, unknown >
): string {
	const sorted = Object.keys( attributes )
		.sort()
		.reduce< Record< string, unknown > >( ( acc, key ) => {
			acc[ key ] = attributes[ key ];
			return acc;
		}, {} );

	return markup + '|' + JSON.stringify( sorted );
}

export const renderBlocks: RenderBlocks = ( markup, attributes ) => {
	const key = cacheKey( markup, attributes );
	const cached = cache.get( key );

	if ( cached ) {
		return cached;
	}

	const request = apiFetch< { rendered?: string } >( {
		path: RENDER_PATH,
		method: 'POST',
		data: { content: markup, attributes },
	} )
		.then( ( response ) => response.rendered ?? '' )
		.catch( ( error ) => {
			cache.delete( key );
			throw error;
		} );

	cache.set( key, request );

	return request;
};
