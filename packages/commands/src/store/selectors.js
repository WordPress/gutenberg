/**
 * External dependencies
 */
import createSelector from 'rememo';

export const getCommands = createSelector(
	( state, contextual = false ) =>
		Object.values( state.commands ).filter( ( command ) => {
			const isContextual =
				command.context && command.context === state.context;
			return contextual ? isContextual : ! isContextual;
		} ),
	( state ) => [ state.commands ]
);

export const getCommandLoaders = createSelector(
	( state, contextual = false ) =>
		Object.values( state.commandLoaders ).filter( ( loader ) => {
			const isContextual =
				loader.context && loader.context === state.context;
			return contextual ? isContextual : ! isContextual;
		} ),
	( state ) => [ state.commandLoaders ]
);

export function isOpen( state ) {
	return state.isOpen;
}

export function getContext( state ) {
	return state.context;
}
