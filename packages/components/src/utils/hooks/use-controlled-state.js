/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { isValueDefined, getDefinedValue } from '../values';

/**
 * @template T
 * @typedef Options
 * @property {T} [initial] The initial state.
 * @property {T} [fallback] The state to use when no state is defined.
 */

/** @type {Options<any>} */
const defaultOptions = {
	initial: undefined,
	/**
	 * Defaults to empty string, as that is preferred for usage with
	 * <input />, <textarea />, and <select /> form elements.
	 */
	fallback: '',
};

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
 * @template T
 * @param {T | undefined} currentState The current value.
 * @param {Options<T>} [options] Additional options for the hook.
 *
 * @return {[*, Function]} The controlled value and the value setter.
 */
function useControlledState( currentState, options = defaultOptions ) {
	const { initial, fallback } = { ...defaultOptions, ...options };

	const [ internalState, setInternalState ] = useState( currentState );
	const hasCurrentState = isValueDefined( currentState );

	/*
	 * Resets internal state if value every changes from uncontrolled <-> controlled.
	 */
	useEffect( () => {
		if ( hasCurrentState && internalState ) {
			setInternalState( undefined );
		}
	}, [ hasCurrentState, internalState ] );

	const state = getDefinedValue(
		[ currentState, internalState, initial ],
		fallback
	);

	const setState = (
		/** @type {any} */
		nextState
	) => {
		if ( ! hasCurrentState ) {
			setInternalState( nextState );
		}
	};

	return [ state, setState ];
}

export default useControlledState;
