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
				[ action.group ]: {
					...state[ action.group ],
					[ action.name ]: {
						name: action.name,
						label: action.label,
						group: action.group,
						callback: action.callback,
					},
				},
			};
		case 'UNREGISTER_COMMAND': {
			const { [ action.name ]: _, ...remainingState } =
				state?.[ action.group ];
			return {
				...state,
				[ action.group ]: remainingState,
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
				[ action.group ]: {
					...state[ action.group ],
					[ action.name ]: {
						name: action.name,
						hook: action.hook,
					},
				},
			};
		case 'UNREGISTER_COMMAND_LOADER': {
			const { [ action.name ]: _, ...remainingState } =
				state?.[ action.group ];
			return {
				...state,
				[ action.group ]: remainingState,
			};
		}
	}

	return state;
}

const reducer = combineReducers( {
	commands,
	commandLoaders,
} );

export default reducer;
