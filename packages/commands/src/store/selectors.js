/**
 * WordPress dependencies
 */
import { createSelector } from '@wordpress/data';

/**
 * Returns the registered static commands.
 *
 * @param {Object}  state      State tree.
 * @param {boolean} contextual Whether to return only contextual commands.
 *
 * @return {import('./actions').WPCommandConfig[]} The list of registered commands.
 */
export const getCommands = createSelector(
	( state, contextual = false ) =>
		Object.values( state.commands ).filter( ( command ) => {
			const isContextual =
				command.context && command.context === state.context;
			return contextual ? isContextual : ! isContextual;
		} ),
	( state ) => [ state.commands, state.context ]
);

/**
 * Returns the registered command loaders.
 *
 * @param {Object}  state      State tree.
 * @param {boolean} contextual Whether to return only contextual command loaders.
 *
 * @return {import('./actions').WPCommandLoaderConfig[]} The list of registered command loaders.
 */
export const getCommandLoaders = createSelector(
	( state, contextual = false ) =>
		Object.values( state.commandLoaders ).filter( ( loader ) => {
			const isContextual =
				loader.context && loader.context === state.context;
			return contextual ? isContextual : ! isContextual;
		} ),
	( state ) => [ state.commandLoaders, state.context ]
);

/**
 * Returns whether the command palette is open.
 *
 * @param {Object} state State tree.
 *
 * @return {boolean} Returns whether the command palette is open.
 */
export function isOpen( state ) {
	return state.isOpen;
}

/**
 * Returns whether the active context.
 *
 * @param {Object} state State tree.
 *
 * @return {string} Context.
 */
export function getContext( state ) {
	return state.context;
}
