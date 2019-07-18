/**
 * Internal dependencies
 */
import { apiFetch } from './controls';
import { setDiscoverBlocks, setInstallBlocksPermission } from './actions';

export default {
	* getDiscoverBlocks( filterValue ) {
		try {
			const blocks = yield apiFetch( {
				path: `__experimental/blocks?search=${ filterValue }`,
			} );
			return setDiscoverBlocks( blocks, filterValue );
		} catch ( error ) {
			if ( error.code === 'rest_user_cannot_view' ) {
				return setInstallBlocksPermission( false );
			}
		}
	},
};
