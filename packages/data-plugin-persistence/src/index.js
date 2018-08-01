/**
 * WordPress dependencies
 */
import isShallowEqual from '@wordpress/is-shallow-equal';

// Defaults to the local storage.
let persistenceStorage;

/**
 * Sets a different persistence storage.
 *
 * @param {Object} storage Persistence storage.
 */
export function setPersistenceStorage( storage ) {
	persistenceStorage = storage;
}

/**
 * Get the persistence storage handler.
 *
 * @return {Object} Persistence storage.
 */
export function getPersistenceStorage() {
	return persistenceStorage || window.localStorage;
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

		return nextState;
	};
}

export function createPersistencePlugin( storageKey ) {
	return ( registry ) => {
		const { namespaces, subscribe } = registry;
		const persisted = Object.create( null );

		// Load initially persisted value
		const persistedString = getPersistenceStorage().getItem( storageKey );
		const persistedData = persistedString ? JSON.parse( persistedString ) : {};
		let previousValue = null;

		const triggerPersist = () => {
			const newValue = Object.entries( namespaces )
				.filter( ( [ reducerKey ] ) => persisted[ reducerKey ] )
				.reduce( ( memo, [ reducerKey, { reducer, store } ] ) => {
					const action = { type: 'SERIALIZE' };
					if ( previousValue ) {
						action.previousState = previousValue[ reducerKey ];
					}

					memo[ reducerKey ] = reducer( store.getState(), action );
					return memo;
				}, {} );

			if ( ! isShallowEqual( newValue, previousValue ) ) {
				getPersistenceStorage().setItem( storageKey, JSON.stringify( newValue ) );
			}

			previousValue = newValue;
		};

		function withInitialState( reducerKey, reducer ) {
			return ( state, action ) => {
				if ( state === undefined ) {
					state = persistedData[ reducerKey ];
				}

				return reducer( state, action );
			};
		}

		// Persist updated preferences
		subscribe( triggerPersist );

		return {
			registerStore( reducerKey, options ) {
				options = {
					...options,
					reducer: withInitialState( reducerKey, options.reducer ),
				};

				if ( options.persist ) {
					persisted[ reducerKey ] = true;

					if ( Array.isArray( options.persist ) ) {
						options.reducer = options.persist.reduce(
							restrictPersistence,
							options.reducer,
						);
					}
				}

				return registry.registerStore( reducerKey, options );
			},
		};
	};
}
