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
			path: 'https://requestloggerbin.herokuapp.com/bin/6f2b14b8-d04d-4880-b9ff-7d30eb396c0a',
		} );
		return setDiscoverBlocks( discoverblocks );
	},
};
