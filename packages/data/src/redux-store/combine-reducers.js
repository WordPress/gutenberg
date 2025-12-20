export function combineReducers( reducers ) {
	const keys = Object.keys( reducers );

	return function combinedReducer( state = {}, action ) {
		const nextState = {};
		let hasChanged = false;
		for ( const key of keys ) {
			const reducer = reducers[ key ];
			const prevStateForKey = state[ key ];
			const nextStateForKey = reducer( prevStateForKey, action );
			nextState[ key ] = nextStateForKey;
			hasChanged = hasChanged || nextStateForKey !== prevStateForKey;
		}

		return hasChanged ? nextState : state;
	};
}
