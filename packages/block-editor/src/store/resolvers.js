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
			path: 'https://discoverblocks.free.beeceptor.com/blocks',
		} );
		return setDiscoverBlocks( discoverblocks );
	},
};
