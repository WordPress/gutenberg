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
				[ action.page ]: {
					...state[ action.page ],
					[ action.name ]: {
						name: action.name,
						label: action.label,
						page: action.page,
						callback: action.callback,
					},
				},
			};
		case 'UNREGISTER_COMMAND': {
			const { [ action.name ]: _, ...remainingState } =
				state?.[ action.page ];
			return {
				...state,
				[ action.page ]: remainingState,
			};
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
				[ action.page ]: action.hook,
			};
		case 'UNREGISTER_COMMAND_LOADER': {
			const { [ action.page ]: _, ...remainingState } = state;
			return remainingState;
		}
	}

	return state;
}

/**
 * Reducer returning the page placeholders
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
function placeholders( state = {}, action ) {
	switch ( action.type ) {
		case 'REGISTER_COMMAND_LOADER':
			return {
				...state,
				[ action.page ]: action.placeholder,
			};
		case 'UNREGISTER_COMMAND_LOADER': {
			const { [ action.page ]: _, ...remainingState } = state;
			return remainingState;
		}
	}

	return state;
}

const reducer = combineReducers( {
	commands,
	commandLoaders,
	placeholders,
} );

export default reducer;
