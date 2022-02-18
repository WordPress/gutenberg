/**
 * External dependencies
 */
import type { AnyAction, Reducer } from 'redux';

/**
 * Higher-order reducer creator which creates a combined reducer object, keyed
 * by a property on the action object.
 *
 * @param  actionProperty Action property by which to key object.
 * @return Higher-order reducer.
 */
export const onSubKey = < TState extends unknown, TAction extends AnyAction >(
	actionProperty: string
) => (
	reducer: Reducer< TState, TAction >
): Reducer< Record< string, TState >, TAction > => (
	state: Record< string, TState > = {},
	action
) => {
	// Retrieve subkey from action. Do not track if undefined; useful for cases
	// where reducer is scoped by action shape.
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

/**
 * Normalize selector argument array by defaulting `undefined` value to an empty array
 * and removing trailing `undefined` values.
 *
 * @param  args Selector argument array
 * @return Normalized selector argument array
 */
export function normalizeArgs( args: unknown[] | null | undefined ) {
	if ( args === undefined || args === null ) {
		return [];
	}

	const len = args.length;
	let idx = len;
	while ( idx > 0 && args[ idx - 1 ] === undefined ) {
		idx--;
	}
	return idx === len ? args : args.slice( 0, idx );
}
