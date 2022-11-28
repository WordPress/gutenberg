/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';

export default function useInternalInputValue( value ) {
	const [ internalInputValue, setInternalInputValue ] = useState(
		value || ''
	);

	useEffect( () => {
		/**
		 * If the value changes then sync this
		 * back up with state.
		 */
		if ( value && value !== internalInputValue ) {
			setInternalInputValue( value );
		}
	}, [ value ] );

	return [ internalInputValue, setInternalInputValue ];
}
