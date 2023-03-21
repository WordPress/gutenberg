/**
 * Reducer returning the registered commands
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
function reducer( state = {}, action ) {
	switch ( action.type ) {
		case 'REGISTER_COMMAND':
			return {
				...state,
				[ action.name ]: {
					name: action.name,
					label: action.label,
					callback: action.callback,
				},
			};
		case 'UNREGISTER_COMMAND':
			const { [ action.name ]: actionName, ...remainingState } = state;
			return remainingState;
	}

	return state;
}

export default reducer;
