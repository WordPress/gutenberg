/**
 * WordPress dependencies
 */
import { getBlockTypes } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { apiFetch, loadAssets } from './controls';

/** Returns an action object used in signalling that the discover blocks have been requested and is loading.
 *
 * @return {Object} Action object.
 */
export function fetchDownloadableBlocks() {
	return { type: 'FETCH_DISCOVER_BLOCKS' };
}

/** Returns an action object used in signalling that the discover blocks have been updated.
 * @param {Array} discoverBlocks Discoverable blocks.
 * @param {string} filterValue Search string.
 *
 * @return {Object} Action object.
 */
export function receiveDownloadableBlocks( discoverBlocks, filterValue ) {
	return { type: 'RECEIVE_DISCOVER_BLOCKS', discoverBlocks, filterValue };
}

/** Returns an action object used in signalling that the user does not have permission to install blocks.
* @param {boolean} hasPermission User has permission to install blocks.
*
* @return {Object} Action object.
*/
export function setInstallBlocksPermission( hasPermission ) {
	return { type: 'SET_INSTALL_BLOCKS_PERMISSION', hasPermission };
}

/**
 * Action triggered to download block assets.
 *
 * @param {Object} item The selected block item
 * @param {Function} onSuccess The callback function when the action has succeeded.
 * @param {Function} onError The callback function when the action has failed.
 */
export function* downloadBlock( item, onSuccess, onError ) {
	try {
		if ( ! item.assets.length ) {
			throw new Error( 'Block has no assets' );
		}

		yield loadAssets( item.assets );
		const registeredBlocks = getBlockTypes();
		if ( registeredBlocks.length ) {
			onSuccess( item );
		} else {
			throw new Error( 'Unable to get block types' );
		}
	} catch ( error ) {
		yield onError( error );
	}
}

/** Action triggered to install a block plugin.
* @param {string} slug The plugin slug for block.
* @param {Function} onSuccess The callback function when the action has succeeded.
* @param {Function} onError The callback function when the action has failed.
*
 */
export function* installBlock( slug, onSuccess, onError ) {
	try {
		const response = yield apiFetch( {
			path: '__experimental/blocks/install',
			data: {
				slug,
			},
			method: 'POST',
		} );
		if ( response.success === false ) {
			throw new Error( response.errorMessage );
		}
		onSuccess();
	} catch ( error ) {
		onError( error );
	}
}
