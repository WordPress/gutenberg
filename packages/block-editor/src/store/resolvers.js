/**
 * WordPress dependencies
 */

/**
 * Internal dependencies
 */
import { apiFetch } from './controls';
import { setDiscoverBlocks } from './actions';

export default {
	* getDiscoverBlocks() {
		const discoverblocks = yield apiFetch( {
			path: '__experimental/blocks',
		} );
		return setDiscoverBlocks( discoverblocks );
	},
};
