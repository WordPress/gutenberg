/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';

export function useFocusedState( isFocusedProp: boolean = false ) {
	const [ isFocused, setFocused ] = useState( isFocusedProp );

	useEffect( () => {
		setFocused( isFocusedProp );
	}, [ isFocusedProp ] );

	return [ isFocused, setFocused ] as const;
}
