/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { getBlockTypes } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { dispatch, apiFetch, loadAssets } from './controls';

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
 * Action triggered to load assets for a downloadable block.
 *
 * @param {Object} item The selected block item
 * @param {Function} onSelect The callback function when the assets are loaded.
 * @param {Function} retry The callback function when the user clicks retry on error notice.
 */
export function* handleDownloadableBlock( item, onSelect, retry ) {
	const onLoad = () => {
		const registeredBlocks = getBlockTypes();
		if ( registeredBlocks.length ) {
			onSelect( item );
		}
	};
	function* onError() {
		yield dispatch(
			'core/notices',
			'createErrorNotice',
			__( 'Block previews can\'t load.' ),
			{
				id: 'block-preview-error',
				actions: [
					{
						label: __( 'Retry' ),
						onClick: () => {
							retry( item );
						},
					},
				],
			} );
	}
	try {
		yield loadAssets( item.assets );
		onLoad();
	} catch {
		yield onError();
	}
}

/** Action triggered to install a block plugin
* @param {string} slug The plugin slug for block.
* @param {function} retry The callback function when user clicks Retry button on error notice.
* @param {function} remove The callback function when user clicks Remove button on error notice.
*
 */
export function* installBlock( slug, retry, remove ) {
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
	} catch ( error ) {
		yield dispatch(
			'core/notices',
			'createErrorNotice',
			__( 'Block previews can\'t install.' ),
			{
				id: 'block-install-error',
				actions: [
					{
						label: 'Retry',
						onClick: () => {
							retry();
						},
					},
					{
						label: 'Remove',
						onClick: () => {
							remove();
						},
					},
				],
			}
		);
	}
}
