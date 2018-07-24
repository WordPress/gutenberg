// Defaults to the local storage.
let persistenceStorage = window.localStorage;

/**
 * Sets a different persistence storage.
 *
 * @param {Object} storage Persistence storage.
 */
export function setPersistenceStorage( storage ) {
	persistenceStorage = storage;
}

/**
 * Adds the rehydration behavior to redux reducers.
 *
 * @param {Function} reducer    The reducer to enhance.
 * @param {string}   storageKey The storage key to use.
 *
 * @return {Function} Enhanced reducer.
 */
export function withRehydration( reducer ) {
	// EnhancedReducer with auto-rehydration
	const enhancedReducer = ( state, action ) => {
		if ( action.type === 'REDUX_REHYDRATE' ) {
			return reducer( action.payload, {
				...action,
				previousState: state,
			} );
		}

		return reducer( state, action );
	};

	return enhancedReducer;
}

/**
 * Higher-order reducer used to persist just one key from the reducer state.
 *
 * @param {function} reducer    Reducer function.
 * @param {string} keyToPersist The reducer key to persist.
 *
 * @return {function} Updated reducer.
 */
export function restrictPersistence( reducer, keyToPersist ) {
	return ( state, action ) => {
		const nextState = reducer( state, action );

		if ( action.type === 'SERIALIZE' ) {
			// Returning the same instance if the state is kept identical avoids reserializing again
			if (
				action.previousState &&
				action.previousState[ keyToPersist ] === nextState[ keyToPersist ]
			) {
				return action.previousState;
			}

			return { [ keyToPersist ]: nextState[ keyToPersist ] };
		}

		if ( action.type === 'REDUX_REHYDRATE' ) {
			return {
				...action.previousState,
				...state,
				[ keyToPersist ]: {
					...action.previousState[ keyToPersist ],
					...state[ keyToPersist ],
				},
			};
		}

		return nextState;
	};
}

/**
 * Get the persistence storage handler.
 *
 * @return {Object} Persistence storage.
 */
export function getPersistenceStorage() {
	return persistenceStorage;
}
