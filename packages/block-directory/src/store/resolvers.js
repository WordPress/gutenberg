/**
 * External dependencies
 */
import { camelCase, mapKeys } from 'lodash';

/**
 * Internal dependencies
 */
import { apiFetch } from './controls';
import { fetchDownloadableBlocks, receiveDownloadableBlocks, setInstallBlocksPermission } from './actions';

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
			if ( error.code === 'rest_user_cannot_view' ) {
				yield setInstallBlocksPermission( false );
			}
		}
	},
	* hasInstallBlocksPermission() {
		try {
			yield apiFetch( {
				path: `__experimental/block-directory/search?term=`,
			} );
			yield setInstallBlocksPermission( true );
		} catch ( error ) {
			if ( error.code === 'rest_user_cannot_view' ) {
				yield setInstallBlocksPermission( false );
			}
		}
	},
};
