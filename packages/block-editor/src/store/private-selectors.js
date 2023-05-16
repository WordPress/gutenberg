/**
 * External dependencies
 */
import createSelector from 'rememo';

/**
 * WordPress dependencies
 */
import { createRegistrySelector } from '@wordpress/data';
import { store as blocksStore } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import {
	getBlockParents,
	getTemplateLock,
	getBlockName,
	__unstableGetClientIdWithClientIdsTree,
	getBlockOrder,
} from './selectors';

/**
 * Returns true if the block interface is hidden, or false otherwise.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} Whether the block toolbar is hidden.
 */
export function isBlockInterfaceHidden( state ) {
	return state.isBlockInterfaceHidden;
}

/**
 * Gets the client ids of the last inserted blocks.
 *
 * @param {Object} state Global application state.
 * @return {Array|undefined} Client Ids of the last inserted block(s).
 */
export function getLastInsertedBlocksClientIds( state ) {
	return state?.lastBlockInserted?.clientIds;
}

/**
 * Returns whether or not the given block is a _content locking_ block.
 *
 * A block is _content locking_ if it is the top-most block that has a
 * `templateLock` attribute set to `'contentOnly'`.
 *
 * @param {Object} state    Global application state.
 * @param {string} clientId The client ID of the block to check.
 *
 * @return {boolean} Whether or not the block is a _content locking_ block.
 */
export const isContentLockingBlock = ( state, clientId ) =>
	getContentLockingBlock( state, clientId ) === clientId;

/**
 * Returns the client ID of the _content locking_ block that contains the given
 * block, or `undefined` if the block is not nested within a _content locking_
 * block.
 *
 * A block is _content locking_ if it is the top-most block that has a
 * `templateLock` attribute set to `'contentOnly'`.
 *
 * @param {Object} state    Global application state.
 * @param {string} clientId The client ID of the block to check.
 *
 * @return {string|undefined} The client ID of the _content locking_ block that
 * 						      contains the given block, if it exists.
 */
export const getContentLockingBlock = createSelector(
	( state, clientId ) => {
		if ( getTemplateLock( state ) === 'contentOnly' ) {
			return;
		}

		return [ ...getBlockParents( state, clientId ), clientId ].find(
			( candidateClientId ) =>
				getTemplateLock( state, candidateClientId ) === 'contentOnly'
		);
	},
	( state ) => [
		state.settings.templateLock,
		state.blocks.parents,
		state.blockListSettings,
	]
);

/**
 * Returns whether or not the given block is a _content block_.
 *
 * A block is _content block_ if its block type is in
 * `settings.contentBlockTypes` or if it has an attribute with the `'content'`
 * role.
 *
 * @param {Object} state    Global application state.
 * @param {string} clientId The client ID of the block to check.
 *
 * @return {boolean} Whether or not the block is a _content block_.
 */
export const isContentBlock = createRegistrySelector(
	( select ) => ( state, clientId ) => {
		const blockName = getBlockName( state, clientId );
		return state.settings.contentBlockTypes
			? state.settings.contentBlockTypes.includes( blockName )
			: select( blocksStore ).__experimentalHasContentRoleAttribute(
					blockName
			  );
	}
);

/**
 * Returns all of the _content blocks_. If a `rootClientId` is provided, only
 * the _content blocks_ that are descendants of that block are returned.
 *
 * The resultant array is a tree of block objects containing only the `clientId`
 * and `innerBlocks` properties.
 *
 * @see isContentBlock
 *
 * @param {Object} state        Global application state.
 * @param {string} rootClientId Optional root client ID of block list.
 *
 * @return {Object[]} Array of block obejcts containing `clientId` and `innerBlocks`.
 */
export const getContentClientIdsTree = createSelector(
	( state, rootClientId = null ) => {
		return getBlockOrder( state, rootClientId ).flatMap( ( clientId ) =>
			isContentBlock( state, clientId )
				? [ __unstableGetClientIdWithClientIdsTree( state, clientId ) ]
				: getContentClientIdsTree( state, clientId )
		);
	},
	( state ) => [ state.blocks.order ]
);

/**
 * Returns the client ID of the block that is temporarily unlocked, or null if
 * no block is temporarily unlocked.
 *
 * Used to allow the user to temporarily edit a _content locked_ block.
 *
 * @param {Object} state Global application state.
 *
 * @return {string|null} Client ID of the temporarily unlocked block, or null.
 */
export function getTemporarilyUnlockedBlock( state ) {
	return state.temporarilyUnlockedBlock;
}
