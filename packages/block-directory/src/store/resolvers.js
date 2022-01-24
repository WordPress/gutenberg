/**
 * External dependencies
 */
import { camelCase, mapKeys } from 'lodash';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { fetchDownloadableBlocks, receiveDownloadableBlocks } from './actions';

export const getDownloadableBlocks = ( filterValue ) => async ( {
	dispatch,
} ) => {
	if ( ! filterValue ) {
		return;
	}

	try {
		dispatch( fetchDownloadableBlocks( filterValue ) );
		const results = await apiFetch( {
			path: `wp/v2/block-directory/search?term=${ filterValue }`,
		} );
		const blocks = results.map( ( result ) =>
			mapKeys( result, ( value, key ) => camelCase( key ) )
		);

		dispatch( receiveDownloadableBlocks( blocks, filterValue ) );
	} catch {}
};
