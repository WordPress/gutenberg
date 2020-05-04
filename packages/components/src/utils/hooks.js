/**
 * WordPress dependencies
 */
import { useEffect, useRef, useState } from '@wordpress/element';

/**
 * Custom hooks for "controlled" components to track and consolidate internal
 * state and incoming values. This is useful for components that render
 * `input`, `textarea`, or `select` HTML elements.
 *
 * https://reactjs.org/docs/forms.html#controlled-components
 *
 * @param {any} initialState The initial state value.
 * @return {Array<any, Function>} The controlled value and the value setter.
 */
export function useControlledState( initialState ) {
	const [ state, setState ] = useState( initialState );
	const stateRef = useRef( initialState );

	useEffect( () => {
		/**
		 * Update the internal state if the incoming value changes.
		 */
		if ( initialState !== stateRef.current ) {
			setState( initialState );
			stateRef.current = initialState;
		}
	}, [ initialState ] );

	return [ state, setState ];
}
