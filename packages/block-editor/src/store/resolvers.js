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
			const blocks = yield apiFetch( {
				path: `__experimental/blocks?search=${ filterValue }`,
			} );
			yield receiveDiscoverBlocks( blocks, filterValue );
		} catch ( error ) {
			if ( error.code === 'rest_user_cannot_view' ) {
				yield setInstallBlocksPermission( false );
			}
		}
	},
};
