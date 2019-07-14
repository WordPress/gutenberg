/**
 * WordPress dependencies
 */

/**
 * Internal dependencies
 */
import { apiFetch } from './controls';
import { setDiscoverBlocks } from './actions';

export default {
	* getDiscoverBlocks( filterValue ) {
		const discoverblocks = yield apiFetch( {
			path: `__experimental/blocks?search=${ filterValue }`,
		} );
		return setDiscoverBlocks( discoverblocks );
	},
};
