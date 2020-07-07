/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { apiFetch, dispatch, select } from '@wordpress/data-controls';

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
 * Action triggered to install a block plugin.
 *
 * @param {Object} block The block item returned by search.
 *
 * @return {boolean} Whether the block was successfully installed & loaded.
 */
export function* installBlockType( block ) {
	const { id, assets } = block;
	let success = false;
	yield clearErrorNotice( id );
	try {
		if ( ! Array.isArray( assets ) || ! assets.length ) {
			throw new Error( __( 'Block has no assets.' ) );
		}
		yield setIsInstalling( block.id, true );
		const response = yield apiFetch( {
			path: 'wp/v2/plugins',
			data: {
				slug: block.id,
				status: 'active',
			},
			method: 'POST',
		} );
		const endpoint = response?._links?.self[ 0 ]?.href;
		yield addInstalledBlockType( { ...block, endpoint } );

		yield loadAssets( assets );
		const registeredBlocks = yield select( 'core/blocks', 'getBlockTypes' );
		if (
			! registeredBlocks.length ||
			! registeredBlocks.filter( ( i ) => i.name === block.name ).length
		) {
			throw new Error(
				__( 'Error registering block. Try reloading the page.' )
			);
		}

		success = true;
	} catch ( error ) {
		let message = error.message || __( 'An error occurred.' );

		// Errors we throw are fatal
		let isFatal = error instanceof Error;

		// Specific API errors that are fatal
		const fatalAPIErrors = {
			folder_exists: __(
				'This block is already installed. Try reloading the page.'
			),
			unable_to_connect_to_filesystem: __(
				'Error installing block. You can reload the page and try again.'
			),
			plugin_wp_php_incompatible: sprintf(
				// translators: 1. WordPress version number, 2. PHP version number
				__(
					'WordPress version >= %1$s and PHP version >= %2$s is required.'
				),
				block.requires,
				block.requiresPhp
			),
			plugin_wp_incompatible: sprintf(
				// translators: WordPress version number: Ie: 5.4
				__( 'WordPress version >= %s is required.' ),
				block.requires
			),

			plugin_php_incompatible: sprintf(
				// translators: PHP version number: Ie: 5.4
				__( 'PHP version >= %s is required.' ),
				block.requiresPhp
			),
		};

		if ( fatalAPIErrors[ error.code ] ) {
			isFatal = true;
			message = fatalAPIErrors[ error.code ];
		}

		yield setErrorNotice( id, message, isFatal );
	}
	yield setIsInstalling( block.id, false );
	return success;
}

/**
 * Action triggered to uninstall a block plugin.
 *
 * @param {Object} block The blockType object.
 */
export function* uninstallBlockType( block ) {
	try {
		yield apiFetch( {
			url: block.endpoint,
			data: {
				status: 'inactive',
			},
			method: 'PUT',
		} );
		yield apiFetch( {
			url: block.endpoint,
			method: 'DELETE',
		} );
		yield removeInstalledBlockType( block );
	} catch ( error ) {
		yield dispatch(
			'core/notices',
			'createErrorNotice',
			error.message || __( 'An error occurred.' )
		);
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
 * Returns an action object used to remove a newly installed block type.
 *
 * @param {string} item The block item with the block id and name.
 *
 * @return {Object} Action object.
 */
export function removeInstalledBlockType( item ) {
	return {
		type: 'REMOVE_INSTALLED_BLOCK_TYPE',
		item,
	};
}

/**
 * Returns an action object used to indicate install in progress
 *
 * @param {string} blockId
 * @param {boolean} isInstalling
 *
 * @return {Object} Action object.
 */
export function setIsInstalling( blockId, isInstalling ) {
	return {
		type: 'SET_INSTALLING_BLOCK',
		blockId,
		isInstalling,
	};
}

/**
 * Sets an error notice string to be displayed to the user
 *
 * @param {string} blockId The ID of the block plugin. eg: my-block
 * @param {string} message  The message shown in the notice.
 * @param {boolean} isFatal Whether the user can recover from the error
 *
 * @return {Object} Action object.
 */
export function setErrorNotice( blockId, message, isFatal = false ) {
	return {
		type: 'SET_ERROR_NOTICE',
		blockId,
		message,
		isFatal,
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
		type: 'CLEAR_ERROR_NOTICE',
		blockId,
	};
}
