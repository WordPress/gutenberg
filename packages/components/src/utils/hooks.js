/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Custom hooks for "controlled" components to track and consolidate internal
 * state and incoming values. This is useful for components that render
 * `input`, `textarea`, or `select` HTML elements.
 *
 * https://reactjs.org/docs/forms.html#controlled-components
 *
 * At first, a component using useControlledState receives an initial prop
 * value, which is used as initial internal state.
 *
 * This internal state can be maintained and updated without
 * relying on new incoming prop values.
 *
 * Unlike the basic useState hook, useControlledState's state can
 * be updated if a new incoming prop value is changed.
 *
 * @param {any} initialState The initial state value.
 * @return {[*, Function]} The controlled value and the value setter.
 */
export function useControlledState( initialState ) {
	const [ internalState, setInternalState ] = useState( initialState );
	const hasInitialState = initialState !== undefined;
	const state = hasInitialState ? initialState : internalState;

	const setState = ( nextState ) => {
		if ( ! hasInitialState ) {
			setInternalState( nextState );
		}
	};

	return [ state, setState ];
}
