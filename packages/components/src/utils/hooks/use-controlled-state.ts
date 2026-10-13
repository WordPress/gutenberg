import { useEffect, useState, useCallback } from '@wordpress/element';
import { isValueDefined, getDefinedValue } from '../values';
import type { ControlledStateOptions } from './types';

const defaultOptions: Readonly< { initial: undefined; fallback: '' } > = {
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
 * @param currentState             The current value.
 * @param [options=defaultOptions] Additional options for the hook.
 *
 * @return The controlled value and the value setter.
 */
function useControlledState< T >(
	currentState: T | undefined,
	options: ControlledStateOptions< T > = defaultOptions
): [ T | '', ( nextState: T ) => void ] {
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

	const setState = useCallback(
		( nextState: T ) => {
			if ( ! hasCurrentState ) {
				setInternalState( nextState );
			}
		},
		[ hasCurrentState ]
	);

	return [ state, setState ];
}

export default useControlledState;
