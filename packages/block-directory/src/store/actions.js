/**
 * External dependencies
 */
import { pick } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	store as blocksStore,
	unstable__bootstrapServerSideBlockDefinitions, // eslint-disable-line camelcase
} from '@wordpress/blocks';
import { __, sprintf } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { store as noticesStore } from '@wordpress/notices';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { loadAssets } from './load-assets';
import getPluginUrl from './utils/get-plugin-url';

/**
 * Returns an action object used in signalling that the downloadable blocks
 * have been requested and are loading.
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
export const installBlockType = ( block ) => async ( {
	registry,
	dispatch,
} ) => {
	const { id, name } = block;
	let success = false;
	dispatch.clearErrorNotice( id );
	try {
		dispatch.setIsInstalling( id, true );

		// If we have a wp:plugin link, the plugin is installed but inactive.
		const url = getPluginUrl( block );
		let links = {};
		if ( url ) {
			await apiFetch( {
				method: 'PUT',
				url,
				data: { status: 'active' },
			} );
		} else {
			const response = await apiFetch( {
				method: 'POST',
				path: 'wp/v2/plugins',
				data: { slug: id, status: 'active' },
			} );
			// Add the `self` link for newly-installed blocks.
			links = response._links;
		}

		dispatch.addInstalledBlockType( {
			...block,
			links: { ...block.links, ...links },
		} );

		// Ensures that the block metadata is propagated to the editor when registered on the server.
		const metadataFields = [
			'api_version',
			'title',
			'category',
			'parent',
			'icon',
			'description',
			'keywords',
			'attributes',
			'provides_context',
			'uses_context',
			'supports',
			'styles',
			'example',
			'variations',
		];
		await apiFetch( {
			path: addQueryArgs( `/wp/v2/block-types/${ name }`, {
				_fields: metadataFields,
			} ),
		} )
			// Ignore when the block is not registered on the server.
			.catch( () => {} )
			.then( ( response ) => {
				if ( ! response ) {
					return;
				}
				unstable__bootstrapServerSideBlockDefinitions( {
					[ name ]: pick( response, metadataFields ),
				} );
			} );

		await loadAssets();
		const registeredBlocks = registry.select( blocksStore ).getBlockTypes();
		if ( ! registeredBlocks.some( ( i ) => i.name === name ) ) {
			throw new Error(
				__( 'Error registering block. Try reloading the page.' )
			);
		}

		registry.dispatch( noticesStore ).createInfoNotice(
			sprintf(
				// translators: %s is the block title.
				__( 'Block %s installed and added.' ),
				block.title
			),
			{
				speak: true,
				type: 'snackbar',
			}
		);
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
		};

		if ( fatalAPIErrors[ error.code ] ) {
			isFatal = true;
			message = fatalAPIErrors[ error.code ];
		}

		dispatch.setErrorNotice( id, message, isFatal );
		registry.dispatch( noticesStore ).createErrorNotice( message, {
			speak: true,
			isDismissible: true,
		} );
	}
	dispatch.setIsInstalling( id, false );
	return success;
};

/**
 * Action triggered to uninstall a block plugin.
 *
 * @param {Object} block The blockType object.
 */
export const uninstallBlockType = ( block ) => async ( {
	registry,
	dispatch,
} ) => {
	try {
		const url = getPluginUrl( block );
		await apiFetch( {
			method: 'PUT',
			url,
			data: { status: 'inactive' },
		} );
		await apiFetch( {
			method: 'DELETE',
			url,
		} );
		dispatch.removeInstalledBlockType( block );
	} catch ( error ) {
		registry
			.dispatch( noticesStore )
			.createErrorNotice( error.message || __( 'An error occurred.' ) );
	}
};

/**
 * Returns an action object used to add a block type to the "newly installed"
 * tracking list.
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
 * Returns an action object used to remove a block type from the "newly installed"
 * tracking list.
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
 * Returns an action object used to indicate install in progress.
 *
 * @param {string}  blockId
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
 * Sets an error notice to be displayed to the user for a given block.
 *
 * @param {string}  blockId The ID of the block plugin. eg: my-block
 * @param {string}  message The message shown in the notice.
 * @param {boolean} isFatal Whether the user can recover from the error.
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
 * Sets the error notice to empty for specific block.
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
