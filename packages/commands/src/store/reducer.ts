/**
 * WordPress dependencies
 */
import { combineReducers } from '@wordpress/data';
import type { Action } from './actions';
import type { State } from './types';
import type { PrivateActions } from './private-actions';

/**
 * Reducer returning the registered commands
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
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
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
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
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {boolean} Updated state.
 */
function isOpen(
	state: State[ 'isOpen' ] = false,
	action: Action
): State[ 'isOpen' ] {
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
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 */
function context(
	state: State[ 'context' ] = 'root',
	action: PrivateActions
): State[ 'context' ] {
	switch ( action.type ) {
		case 'SET_CONTEXT':
			return action.context;
	}

	return state;
}

const reducer = combineReducers( {
	commands,
	commandLoaders,
	isOpen,
	context,
} );

export default reducer;
