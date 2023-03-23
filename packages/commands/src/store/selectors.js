/**
 * External dependencies
 */
import createSelector from 'rememo';

export const getCommands = createSelector(
	( state, page ) => Object.values( state.commands[ page ] ),
	( state, page ) => [ state.commands[ page ] ]
);

export const getCommandLoader = createSelector(
	( state, page ) => Object.values( state.commandLoaders[ page ] ),
	( state, page ) => [ state.commandLoaders[ page ] ]
);
