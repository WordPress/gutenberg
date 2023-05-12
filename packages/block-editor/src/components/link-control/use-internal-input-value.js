/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';

export default function useInternalInputValue( value ) {
	const [ internalInputValue, setInternalInputValue ] = useState(
		value || ''
	);

	// If the value prop changes, update the internal state.
	useEffect( () => {
		setInternalInputValue( ( prevValue ) => {
			if ( value && value !== prevValue ) {
				return value;
			}

			return prevValue;
		} );
	}, [ value ] );

	return [ internalInputValue, setInternalInputValue ];
}
