/**
 * WordPress dependencies
 */
import { useEffect, useRef, useState } from '@wordpress/element';

export function isValueEmpty( value ) {
	const isNullish = typeof value === 'undefined' || value === null;
	const isEmptyString = value === '';

	return isNullish || isEmptyString;
}

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

export function useValueState( initialValue ) {
	const value = isValueEmpty( initialValue ) ? '' : initialValue;

	return useControlledState( value );
}
