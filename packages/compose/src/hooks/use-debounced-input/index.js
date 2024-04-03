/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useDebounce from '../use-debounce';

/**
 * Helper hook for input fields that need to debounce the value before using it.
 *
 * @param {any} defaultValue The default value to use.
 * @return {[string, Function, string]} The input value, the setter and the debounced input value.
 */
export default function useDebouncedInput( defaultValue = '' ) {
	const [ input, setInput ] = useState( defaultValue );
	const [ debouncedInput, setDebouncedState ] = useState( defaultValue );

	const setDebouncedInput = useDebounce( setDebouncedState, 250 );

	useEffect( () => {
		setDebouncedInput( input );
	}, [ input ] );

	return [ input, setInput, debouncedInput ];
}
