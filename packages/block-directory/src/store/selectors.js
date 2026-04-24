/**
 * WordPress dependencies
 */
import { createSelector, createRegistrySelector } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

const EMPTY_ARRAY = [];

/**
 * Returns true if application is requesting for downloadable blocks.
 *
 * @param {Object} state       Global application state.
 * @param {string} filterValue Search string.
 *
 * @return {boolean} Whether a request is in progress for the blocks list.
 */
export function isRequestingDownloadableBlocks( state, filterValue ) {
	return state.downloadableBlocks[ filterValue ]?.isRequesting ?? false;
}

/**
 * Returns the available uninstalled blocks.
 *
 * @param {Object} state       Global application state.
 * @param {string} filterValue Search string.
 *
 * @return {Array} Downloadable blocks.
 */
export function getDownloadableBlocks( state, filterValue ) {
	return state.downloadableBlocks[ filterValue ]?.results ?? EMPTY_ARRAY;
}

/**
 * Returns the block types that have been installed on the server in this
 * session.
 *
 * @param {Object} state Global application state.
 *
 * @return {Array} Block type items
 */
export function getInstalledBlockTypes( state ) {
	return state.blockManagement.installedBlockTypes;
}

/**
 * Returns block types that have been installed on the server and used in the
 * current post.
 *
 * @param {Object} state Global application state.
 *
 * @return {Array} Block type items.
 */
export const getNewBlockTypes = createRegistrySelector( ( select ) =>
	createSelector(
		( state ) => {
			const installedBlockTypes = getInstalledBlockTypes( state );
			if ( ! installedBlockTypes.length ) {
				return EMPTY_ARRAY;
			}

			const { getBlockName, getClientIdsWithDescendants } =
				select( blockEditorStore );
			const installedBlockNames = installedBlockTypes.map(
				( blockType ) => blockType.name
			);
			const foundBlockNames = getClientIdsWithDescendants().flatMap(
				( clientId ) => {
					const blockName = getBlockName( clientId );
					return installedBlockNames.includes( blockName )
						? blockName
						: [];
				}
			);
			const newBlockTypes = installedBlockTypes.filter( ( blockType ) =>
				foundBlockNames.includes( blockType.name )
			);

			return newBlockTypes.length > 0 ? newBlockTypes : EMPTY_ARRAY;
		},
		( state ) => [
			getInstalledBlockTypes( state ),
			select( blockEditorStore ).getClientIdsWithDescendants(),
		]
	)
);

/**
 * Returns the block types that have been installed on the server but are not
 * used in the current post.
 *
 * @param {Object} state Global application state.
 *
 * @return {Array} Block type items.
 */
export const getUnusedBlockTypes = createRegistrySelector( ( select ) =>
	createSelector(
		( state ) => {
			const installedBlockTypes = getInstalledBlockTypes( state );
			if ( ! installedBlockTypes.length ) {
				return EMPTY_ARRAY;
			}

			const { getBlockName, getClientIdsWithDescendants } =
				select( blockEditorStore );
			const installedBlockNames = installedBlockTypes.map(
				( blockType ) => blockType.name
			);
			const foundBlockNames = getClientIdsWithDescendants().flatMap(
				( clientId ) => {
					const blockName = getBlockName( clientId );
					return installedBlockNames.includes( blockName )
						? blockName
						: [];
				}
			);
			const unusedBlockTypes = installedBlockTypes.filter(
				( blockType ) => ! foundBlockNames.includes( blockType.name )
			);

			return unusedBlockTypes.length > 0 ? unusedBlockTypes : EMPTY_ARRAY;
		},
		( state ) => [
			getInstalledBlockTypes( state ),
			select( blockEditorStore ).getClientIdsWithDescendants(),
		]
	)
);

/**
 * Returns true if a block plugin install is in progress.
 *
 * @param {Object} state   Global application state.
 * @param {string} blockId Id of the block.
 *
 * @return {boolean} Whether this block is currently being installed.
 */
export function isInstalling( state, blockId ) {
	return state.blockManagement.isInstalling[ blockId ] || false;
}

/**
 * Returns all block error notices.
 *
 * @param {Object} state Global application state.
 *
 * @return {Object} Object with error notices.
 */
export function getErrorNotices( state ) {
	return state.errorNotices;
}

/**
 * Returns the error notice for a given block.
 *
 * @param {Object} state   Global application state.
 * @param {string} blockId The ID of the block plugin. eg: my-block
 *
 * @return {string|boolean} The error text, or false if no error.
 */
export function getErrorNoticeForBlock( state, blockId ) {
	return state.errorNotices[ blockId ];
}
