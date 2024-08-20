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
 * @param defaultValue The default value to use.
 * @return The input value, the setter and the debounced input value.
 */
export default function useDebouncedInput(
	defaultValue = ''
): [ string, ( value: string ) => void, string ] {
	const [ input, setInput ] = useState< string >( defaultValue );
	const [ debouncedInput, setDebouncedState ] = useState( defaultValue );

	const setDebouncedInput = useDebounce( setDebouncedState, 250 );

	useEffect( () => {
		setDebouncedInput( input );
	}, [ input, setDebouncedInput ] );

	return [ input, setInput, debouncedInput ];
}
