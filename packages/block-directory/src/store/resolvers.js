/**
 * External dependencies
 */
import { camelCase, mapKeys } from 'lodash';

/**
 * WordPress dependencies
 */
import { apiFetch } from '@wordpress/data-controls';

/**
 * Internal dependencies
 */
import { fetchDownloadableBlocks, receiveDownloadableBlocks } from './actions';

export default {
	*getDownloadableBlocks( filterValue ) {
		if ( ! filterValue ) {
			return;
		}

		try {
			yield fetchDownloadableBlocks( filterValue );
			const results = yield apiFetch( {
				path: `wp/v2/block-directory/search?term=${ filterValue }`,
			} );
			const blocks = results.map( ( result ) =>
				mapKeys( result, ( value, key ) => {
					return camelCase( key );
				} )
			);

			yield receiveDownloadableBlocks( blocks, filterValue );
		} catch ( error ) {}
	},
};
