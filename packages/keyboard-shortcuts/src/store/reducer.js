/**
 * Reducer returning the registered shortcuts
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
function reducer( state = {}, action ) {
	switch ( action.type ) {
		case 'REGISTER_SHORTCUT':
			return {
				...state,
				[ action.name ]: {
					category: action.category,
					keyCombination: action.keyCombination,
					aliases: action.aliases,
					description: action.description,
				},
			};
		case 'UNREGISTER_SHORTCUT':
			const { [ action.name ]: actionName, ...remainingState } = state;
			return remainingState;
	}

	return state;
}

export default reducer;
