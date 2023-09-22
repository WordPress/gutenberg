export function combineReducers( reducers ) {
	const keys = Object.keys( reducers );

	function getNextState( state, action ) {
		const nextState = {};
		for ( const key of keys ) {
			nextState[ key ] = reducers[ key ]( state[ key ], action );
		}
		return nextState;
	}

	return function combinedReducer( state, action ) {
		// Assumed changed if initial state.
		if ( state === undefined ) {
			return getNextState( {}, action );
		}

		const nextState = getNextState( state, action );

		// Determine whether state has changed.
		if ( keys.some( ( key ) => state[ key ] !== nextState[ key ] ) ) {
			return nextState;
		}

		return state;
	};
}
