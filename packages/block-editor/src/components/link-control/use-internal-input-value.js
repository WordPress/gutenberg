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
		 * If the value's `text` property changes then sync this
		 * back up with state.
		 */
		if ( value?.title && value.title !== internalInputValue ) {
			setInternalInputValue( value.title );
		}
	}, [ value ] );

	return [ internalInputValue, setInternalInputValue ];
}
