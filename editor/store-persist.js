const DEFAULT_STORAGE_KEY = 'REDUX_PERSIST';

/**
 * Store enhancer to persist a specified reducer key
 * @param {String}     reducerKey The reducer key to persist
 * @param {String}     storageKey The storage key to use
 *
 * @return {Function}             Store enhancer
 */
export default function storePersist( reducerKey, storageKey = DEFAULT_STORAGE_KEY ) {
	return ( createStore ) => ( reducer, preloadedState, enhancer ) => {
		// EnhancedReducer with auto-rehydration
		const enhancedReducer = ( state, action ) => {
			const nextState = reducer( state, action );

			if ( action.type === 'REDUX_REHYDRATE' ) {
				return {
					...nextState,
					[ reducerKey ]: action.payload,
				};
			}

			return nextState;
		};

		const store = createStore( enhancedReducer, preloadedState, enhancer );

		// Load initially persisted value
		const persistedString = window.localStorage.getItem( storageKey );
		if ( persistedString ) {
			const persistedState = JSON.parse( persistedString );
			store.dispatch( {
				type: 'REDUX_REHYDRATE',
				payload: persistedState,
			} );
		}

		// Persist updated preferences
		let currentStateValue = store.getState()[ reducerKey ];
		store.subscribe( () => {
			const newStateValue = store.getState()[ reducerKey ];
			if ( newStateValue !== currentStateValue ) {
				currentStateValue = newStateValue;
				window.localStorage.setItem( storageKey, JSON.stringify( currentStateValue ) );
			}
		} );

		return store;
	};
}
