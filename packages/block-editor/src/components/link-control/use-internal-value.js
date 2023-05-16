/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';

export default function useInternalValue( value ) {
	const [ internalValue, setInternalValue ] = useState( value || {} );

	// If the value prop changes, update the internal state.
	useEffect( () => {
		setInternalValue( ( prevValue ) => {
			if ( value && value !== prevValue ) {
				return value;
			}

			return prevValue;
		} );
	}, [ value ] );

	return [ internalValue, setInternalValue ];
}
