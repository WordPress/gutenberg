/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * Returns true if application is requesting for discover blocks.
 *
 * @param {Object} state       Global application state.
 *
 * @return {Array} Discoverable blocks
 */
export function isRequestingDownloadableBlocks( state ) {
	return state.discoverBlocks.isRequestingDownloadableBlocks;
}

/**
 * Returns the available uninstalled blocks
 *
 * @param {Object} state       Global application state.
 * @param {string} filterValue Search string.
 *
 * @return {Array} Discoverable blocks
 */
export function getDownloadableBlocks( state, filterValue ) {
	if ( ! state.discoverBlocks.results[ filterValue ] ) {
		return [];
	}
	return state.discoverBlocks.results[ filterValue ];
}

/**
 * Returns true if user has permission to install blocks.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} User has permission to install blocks.
 */
export function hasInstallBlocksPermission( state ) {
	return state.discoverBlocks.hasPermission;
}

/**
 * Returns true if the block editor can search and install uninstalled blocks.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} Whether the downloadable blocks feature is enabled.
 */
export function getIsDownloadableBlocksEnabled( state ) {
	return get( state, [ 'settings', '__experimentalIsDownloadableBlocksEnabled' ], false );
}

/**
 * Returns the block types that have been installed on the server.
 *
 * @param {Object} state Global application state.
 *
 * @return {Array} Block type items.
 */
export function getInstalledBlockTypes( state ) {
	return get( state, [ 'discoverBlocks', 'installedBlockTypes' ], [] );
}
