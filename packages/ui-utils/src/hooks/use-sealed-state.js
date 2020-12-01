/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * React custom hook that returns the very first value passed to `initialState`,
 * even if it changes between re-renders.
 *
 * @template T
 * @param {T} initialState
 *
 * @return {T} The sealed state.
 */
export function useSealedState( initialState ) {
	const [ sealed ] = useState( initialState );
	return sealed;
}
