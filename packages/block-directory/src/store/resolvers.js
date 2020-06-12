/**
 * External dependencies
 */
import { camelCase, get, hasIn, includes, mapKeys } from 'lodash';

/**
 * WordPress dependencies
 */
import { apiFetch } from '@wordpress/data-controls';

/**
 * Internal dependencies
 */
import {
	fetchDownloadableBlocks,
	receiveDownloadableBlocks,
	setInstallBlocksPermission,
} from './actions';

export default {
	*getDownloadableBlocks( filterValue ) {
		if ( ! filterValue ) {
			return;
		}

		try {
			yield fetchDownloadableBlocks( filterValue );
			const results = yield apiFetch( {
				path: `__experimental/block-directory/search?term=${ filterValue }`,
			} );
			const blocks = results.map( ( result ) =>
				mapKeys( result, ( value, key ) => {
					return camelCase( key );
				} )
			);

			yield receiveDownloadableBlocks( blocks, filterValue );
		} catch ( error ) {
			if ( error.code === 'rest_block_directory_cannot_view' ) {
				yield setInstallBlocksPermission( false );
			}
		}
	},
	*hasInstallBlocksPermission() {
		try {
			const response = yield apiFetch( {
				method: 'OPTIONS',
				path: `__experimental/block-directory/search`,
				parse: false,
			} );

			let allowHeader;
			if ( hasIn( response, [ 'headers', 'get' ] ) ) {
				// If the request is fetched using the fetch api, the header can be
				// retrieved using the 'get' method.
				allowHeader = response.headers.get( 'allow' );
			} else {
				// If the request was preloaded server-side and is returned by the
				// preloading middleware, the header will be a simple property.
				allowHeader = get( response, [ 'headers', 'Allow' ], '' );
			}

			const isAllowed = includes( allowHeader, 'GET' );
			yield setInstallBlocksPermission( isAllowed );
		} catch ( error ) {
			yield setInstallBlocksPermission( false );
		}
	},
};
