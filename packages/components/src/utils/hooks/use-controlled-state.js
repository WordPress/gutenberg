/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { isValueDefined, getDefinedValue } from '../values';

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
 * @param {any} currentState The current value.
 * @param {Object} options Additional options for the hook.
 * @param {any} options.initial The initial state.
 * @param {any} options.fallbackState The state to use when no state is defined.
 *
 * @return {[*, Function]} The controlled value and the value setter.
 */
function useControlledState( currentState, options = defaultOptions ) {
	const { initial, fallback } = { ...defaultOptions, ...options };

	const [ internalState, setInternalState ] = useState( currentState );
	const hasCurrentState = isValueDefined( currentState );

	const state = getDefinedValue(
		[ currentState, internalState, initial ],
		fallback
	);

	const setState = ( nextState ) => {
		if ( ! hasCurrentState ) {
			setInternalState( nextState );
		}
	};

	return [ state, setState ];
}

export default useControlledState;
