/**
 * WordPress dependencies
 */
import { useEffect, useRef, useState } from '@wordpress/element';

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
	const value = isEmpty( initialValue ) ? '' : initialValue;
	return useControlledState( value );
}

export function isEmpty( value ) {
	const isNullish = typeof value === 'undefined' || value === null;
	const isEmptyString = value === '';

	return isNullish || isEmptyString;
}
