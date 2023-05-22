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

export function getBlockEditingMode( state, clientId = '' ) {
	while (
		! state.blockEditingModes.has( clientId ) &&
		state.blocks.parents.has( clientId )
	) {
		clientId = state.blocks.parents.get( clientId );
	}
	return state.blockEditingModes.get( clientId ) ?? 'default';
}
