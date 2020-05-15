/**
 * WordPress dependencies
 */
import { apiFetch, select } from '@wordpress/data-controls';

/**
 * Internal dependencies
 */
import { loadAssets } from './controls';

/**
 * Returns an action object used in signalling that the downloadable blocks
 * have been requested and is loading.
 *
 * @param {string} filterValue Search string.
 *
 * @return {Object} Action object.
 */
export function fetchDownloadableBlocks( filterValue ) {
	return { type: 'FETCH_DOWNLOADABLE_BLOCKS', filterValue };
}

/**
 * Returns an action object used in signalling that the downloadable blocks
 * have been updated.
 *
 * @param {Array}  downloadableBlocks Downloadable blocks.
 * @param {string} filterValue        Search string.
 *
 * @return {Object} Action object.
 */
export function receiveDownloadableBlocks( downloadableBlocks, filterValue ) {
	return {
		type: 'RECEIVE_DOWNLOADABLE_BLOCKS',
		downloadableBlocks,
		filterValue,
	};
}

/**
 * Returns an action object used in signalling that the user does not have
 * permission to install blocks.
 *
 * @param {boolean} hasPermission User has permission to install blocks.
 *
 * @return {Object} Action object.
 */
export function setInstallBlocksPermission( hasPermission ) {
	return { type: 'SET_INSTALL_BLOCKS_PERMISSION', hasPermission };
}

/**
 * Action triggered to install a block plugin.
 *
 * @param {Object} item The block item returned by search.
 */
export function* installBlockType( { id, name, assets } ) {
	yield clearErrorNotice( id );
	try {
		if ( ! Array.isArray( assets ) || ! assets.length ) {
			throw new Error( 'Block has no assets' );
		}
		const response = yield apiFetch( {
			path: '__experimental/block-directory/install',
			data: {
				slug: id,
			},
			method: 'POST',
		} );
		if ( response.success !== true ) {
			throw new Error( response.errorMessage );
		}
		yield addInstalledBlockType( { id, name } );

		yield loadAssets( assets );
		const registeredBlocks = yield select( 'core/blocks', 'getBlockTypes' );
		if ( ! registeredBlocks.length ) {
			throw new Error( 'Unable to get block types' );
		}
	} catch ( error ) {
		yield setErrorNotice( id, error.message );
	}
}

/**
 * Returns an action object used to add a newly installed block type.
 *
 * @param {Object} item The block item with the block id and name.
 *
 * @return {Object} Action object.
 */
export function addInstalledBlockType( item ) {
	return {
		type: 'ADD_INSTALLED_BLOCK_TYPE',
		item,
	};
}

/**
 * Returns an action object used to indicate install in progress
 *
 * @param {boolean} isInstalling
 *
 * @return {Object} Action object.
 */
export function setIsInstalling( isInstalling ) {
	return {
		type: 'SET_INSTALLING_BLOCK',
		isInstalling,
	};
}

/**
 * Sets an error notice string to be displayed to the user
 *
 * @param {string} blockId The ID of the block plugin. eg: my-block
 * @param {string} notice  The message shown in the notice.
 *
 * @return {Object} Action object.
 */
export function setErrorNotice( blockId, notice ) {
	return {
		type: 'SET_ERROR_NOTICE',
		blockId,
		notice,
	};
}

/**
 * Sets the error notice to empty for specific block
 *
 * @param {string} blockId The ID of the block plugin. eg: my-block
 *
 * @return {Object} Action object.
 */
export function clearErrorNotice( blockId ) {
	return {
		type: 'SET_ERROR_NOTICE',
		blockId,
		notice: false,
	};
}
