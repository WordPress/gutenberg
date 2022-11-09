/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

export default function useInternalInputValue( value ) {
	const [ internalInputValue, setInternalInputValue ] = useState(
		value || ''
	);

	/**
	 * Update the state value internalInputValue if the url value changes
	 * for example when clicking on another anchor
	 */
	if ( value && value !== internalInputValue ) {
		setInternalInputValue( value );
	}

	return [ internalInputValue, setInternalInputValue ];
}
