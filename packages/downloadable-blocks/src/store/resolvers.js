/**
 * External dependencies
 */
import { camelCase, mapKeys } from 'lodash';

/**
 * Internal dependencies
 */
import { apiFetch } from './controls';
import { fetchDiscoverBlocks, receiveDiscoverBlocks, setInstallBlocksPermission } from './actions';

export default {
	* getDiscoverBlocks( filterValue ) {
		if ( ! filterValue ) {
			return;
		}

		try {
			yield fetchDiscoverBlocks( filterValue );
			const results = yield apiFetch( {
				path: `__experimental/blocks?search=${ filterValue }`,
			} );
			const blocks = results.map( ( result ) => mapKeys( result, ( value, key ) => {
				return camelCase( key );
			} ) );

			yield receiveDiscoverBlocks( blocks, filterValue );
		} catch ( error ) {
			if ( error.code === 'rest_user_cannot_view' ) {
				yield setInstallBlocksPermission( false );
			}
		}
	},
};
