/**
 * WordPress dependencies
 */
import { useEffect, useState, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { isValueDefined, getDefinedValue } from '../values';

/**
 * @template T
 * @typedef Options
 * @property {T}      [initial] Initial value
 * @property {T | ""} fallback  Fallback value
 */

/** @type {Readonly<{ initial: undefined, fallback: '' }>} */
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
 *
 * @param {T | undefined} currentState             The current value.
 * @param {Options<T>}    [options=defaultOptions] Additional options for the hook.
 *
 * @return {[T | "", (nextState: T) => void]} The controlled value and the value setter.
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

	/* eslint-disable jsdoc/no-undefined-types */
	/** @type {(nextState: T) => void} */
	const setState = useCallback(
		( nextState ) => {
			if ( ! hasCurrentState ) {
				setInternalState( nextState );
			}
		},
		[ hasCurrentState ]
	);
	/* eslint-enable jsdoc/no-undefined-types */

	return [ state, setState ];
}

export default useControlledState;
