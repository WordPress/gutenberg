/**
 * Higher-order reducer creator which creates a combined reducer object, keyed
 * by a property on the action object.
 *
 * @template {any} TState
 * @template {import('redux').AnyAction} TAction
 *
 * @param {string} actionProperty Action property by which to key object.
 *
 * @return {(reducer: import('redux').Reducer<TState, TAction>) => import('redux').Reducer<Record<string, TState>, TAction>} Higher-order reducer.
 */
export const onSubKey = ( actionProperty ) => ( reducer ) => (
	/* eslint-disable jsdoc/no-undefined-types */
	state = /** @type {Record<string, TState>} */ ( {} ),
	action
) => {
	// Retrieve subkey from action. Do not track if undefined; useful for cases
	// where reducer is scoped by action shape.
	/** @type {keyof state} */
	/* eslint-enable jsdoc/no-undefined-types */
	const key = action[ actionProperty ];
	if ( key === undefined ) {
		return state;
	}

	// Avoid updating state if unchanged. Note that this also accounts for a
	// reducer which returns undefined on a key which is not yet tracked.
	const nextKeyState = reducer( state[ key ], action );
	if ( nextKeyState === state[ key ] ) {
		return state;
	}

	return {
		...state,
		[ key ]: nextKeyState,
	};
};
