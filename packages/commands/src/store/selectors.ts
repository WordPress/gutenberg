import { createSelector } from '@wordpress/data';
import type { State } from './types';

/**
 * Returns the registered static commands.
 *
 * @param state      State tree.
 * @param contextual Whether to return only contextual commands.
 *
 * @return The list of registered commands.
 */
export const getCommands = createSelector(
	( state: State, contextual: boolean = false ) =>
		Object.values( state.commands ).filter( ( command ) => {
			const isContextual =
				command.context && command.context === state.context;
			return contextual ? isContextual : ! isContextual;
		} ),
	( state: State ) => [ state.commands, state.context ]
);

/**
 * Returns the registered command loaders.
 *
 * @param state      State tree.
 * @param contextual Whether to return only contextual command loaders.
 *
 * @return The list of registered command loaders.
 */
export const getCommandLoaders = createSelector(
	( state: State, contextual: boolean = false ) =>
		Object.values( state.commandLoaders ).filter( ( loader ) => {
			const isContextual =
				loader.context && loader.context === state.context;
			return contextual ? isContextual : ! isContextual;
		} ),
	( state: State ) => [ state.commandLoaders, state.context ]
);

/**
 * Returns whether the command palette is open.
 *
 * @param state State tree.
 *
 * @return Returns whether the command palette is open.
 */
export function isOpen( state: State ) {
	return state.isOpen;
}

/**
 * Returns whether the active context.
 *
 * @param state State tree.
 *
 * @return Context.
 */
export function getContext( state: State ) {
	return state.context;
}
