import { combineReducers } from '@wordpress/data';
import type { Action, State } from './types';

/**
 * Reducer returning the registered commands
 *
 * @param state  Current state.
 * @param action Dispatched action.
 *
 * @return Updated state.
 */
function commands(
	state: State[ 'commands' ] = {},
	action: Action
): State[ 'commands' ] {
	switch ( action.type ) {
		case 'REGISTER_COMMAND':
			return {
				...state,
				[ action.name ]: {
					name: action.name,
					label: action.label,
					searchLabel: action.searchLabel,
					context: action.context,
					category: action.category,
					callback: action.callback,
					icon: action.icon,
					keywords: action.keywords,
				},
			};
		case 'UNREGISTER_COMMAND': {
			const { [ action.name ]: _, ...remainingState } = state;
			return remainingState;
		}
	}

	return state;
}

/**
 * Reducer returning the command loaders
 *
 * @param state  Current state.
 * @param action Dispatched action.
 *
 * @return Updated state.
 */
function commandLoaders(
	state: State[ 'commandLoaders' ] = {},
	action: Action
): State[ 'commandLoaders' ] {
	switch ( action.type ) {
		case 'REGISTER_COMMAND_LOADER':
			return {
				...state,
				[ action.name ]: {
					name: action.name,
					context: action.context,
					category: action.category,
					hook: action.hook,
				},
			};
		case 'UNREGISTER_COMMAND_LOADER': {
			const { [ action.name ]: _, ...remainingState } = state;
			return remainingState;
		}
	}

	return state;
}

/**
 * Reducer returning the command palette open state.
 *
 * @param state  Current state.
 * @param action Dispatched action.
 *
 * @return Updated state.
 */
function isOpen( state: boolean = false, action: Action ): boolean {
	switch ( action.type ) {
		case 'OPEN':
			return true;
		case 'CLOSE':
			return false;
	}

	return state;
}

/**
 * Reducer returning the command palette's active context.
 *
 * @param state  Current state.
 * @param action Dispatched action.
 *
 * @return Updated state.
 */
function context( state: string = 'root', action: Action ): string {
	switch ( action.type ) {
		case 'SET_CONTEXT':
			return action.context;
	}

	return state;
}

function loaderStates(
	state: State[ 'loaderStates' ] = {},
	action: Action
): State[ 'loaderStates' ] {
	switch ( action.type ) {
		case 'SET_LOADER_LOADING':
			return {
				...state,
				[ action.name ]: action.isLoading,
			};
	}

	return state;
}

const reducer = combineReducers( {
	commands,
	commandLoaders,
	isOpen,
	context,
	loaderStates,
} );

export default reducer;
