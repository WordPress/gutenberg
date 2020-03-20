/**
 * WordPress dependencies
 */
import { useState, useEffect, useRef } from '@wordpress/element';

/**
 * An enhanced useState hook that stores and updates an internal state based on
 * an incoming state value.
 *
 * This is useful for input/control based components.
 *
 * @param {any} initialState
 *
 * @return {Array<any, Function>} Controlled [state, setState] values.
 */
export function useControlledState( initialState ) {
	const [ state, setState ] = useState( initialState );
	const stateRef = useRef( initialState );

	useEffect( () => {
		if ( initialState !== stateRef.current ) {
			setState( initialState );
			stateRef.current = initialState;
		}
	}, [ initialState ] );

	return [ state, setState ];
}
