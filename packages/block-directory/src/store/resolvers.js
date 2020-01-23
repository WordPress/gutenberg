/**
 * External dependencies
 */
import { camelCase, mapKeys } from 'lodash';

/**
 * Internal dependencies
 */
import { apiFetch } from './controls';
import { fetchDownloadableBlocks, receiveDownloadableBlocks } from './actions';

export default {
	* getDownloadableBlocks( filterValue ) {
		if ( ! filterValue ) {
			return;
		}

		try {
			yield fetchDownloadableBlocks( filterValue );
			const results = yield apiFetch( {
				path: `__experimental/block-directory/search?term=${ filterValue }`,
			} );
			const blocks = results.map( ( result ) => mapKeys( result, ( value, key ) => {
				return camelCase( key );
			} ) );

			yield receiveDownloadableBlocks( blocks, filterValue );
		} catch ( error ) {
			// TODO trigger error state
		}
	},
};
