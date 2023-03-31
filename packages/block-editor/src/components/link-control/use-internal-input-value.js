/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

export default function useInternalInputValue( value ) {
	const [ internalInputValue, setInternalInputValue ] = useState(
		value || ''
	);

	return [ internalInputValue, setInternalInputValue ];
}
