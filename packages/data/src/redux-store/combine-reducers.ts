import type {
	Reducer,
	Action,
	StateFromReducersMapObject,
	ActionFromReducersMapObject,
} from 'redux';

export function combineReducers< M >(
	reducers: M
): M[ keyof M ] extends Reducer< any, any > | undefined
	? Reducer<
			StateFromReducersMapObject< M >,
			ActionFromReducersMapObject< M >
	  >
	: never;

export function combineReducers( reducers: {
	[ key: string ]: Reducer< any, any >;
} ) {
	const keys = Object.keys( reducers );

	return function combinedReducer(
		state: StateFromReducersMapObject< typeof reducers > = {},
		action: Action
	) {
		const nextState: StateFromReducersMapObject< typeof reducers > = {};
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
