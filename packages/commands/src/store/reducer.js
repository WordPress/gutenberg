/**
 * WordPress dependencies
 */
import { combineReducers } from '@wordpress/data';

/**
 * Reducer returning the registered commands
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
function commands( state = {}, action ) {
	switch ( action.type ) {
		case 'REGISTER_COMMAND':
			return {
				...state,
				[ action.name ]: {
					name: action.name,
					label: action.label,
					searchLabel: action.searchLabel,
					context: action.context,
					callback: action.callback,
					icon: action.icon,
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
function commandLoaders( state = {}, action ) {
	switch ( action.type ) {
		case 'REGISTER_COMMAND_LOADER':
			return {
				...state,
				[ action.name ]: {
					name: action.name,
					context: action.context,
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
function isOpen( state = false, action ) {
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
 *
 * @return {boolean} Updated state.
 */
function context( state = 'root', action ) {
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
