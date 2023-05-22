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
	getBlockRootClientId,
	getTemplateLock,
	getBlockName,
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

export const getBlockEditingMode = createRegistrySelector(
	( select ) => ( state, clientId ) => {
		const explicitEditingMode = getExplcitBlockEditingMode(
			state,
			clientId
		);
		const rootClientId = getBlockRootClientId( state, clientId );
		const templateLock = getTemplateLock( state, rootClientId );
		const name = getBlockName( state, clientId );
		const isContent =
			select( blocksStore ).__experimentalHasContentRoleAttribute( name );
		if (
			explicitEditingMode === 'disabled' ||
			( templateLock === 'contentOnly' && ! isContent )
		) {
			return 'disabled';
		}
		if (
			explicitEditingMode === 'contentOnly' ||
			( templateLock === 'contentOnly' && isContent )
		) {
			return 'contentOnly';
		}
		return 'default';
	}
);

const getExplcitBlockEditingMode = createSelector(
	( state, clientId = '' ) => {
		while (
			! state.blockEditingModes.has( clientId ) &&
			state.blocks.parents.has( clientId )
		) {
			clientId = state.blocks.parents.get( clientId );
		}
		return state.blockEditingModes.get( clientId ) ?? 'default';
	},
	( state ) => [ state.blockEditingModes, state.blocks.parents ]
);
