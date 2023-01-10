/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { useDebounce } from '@wordpress/compose';

export default function useDebouncedInput( defaultValue = '' ) {
	const [ input, setInput ] = useState( defaultValue );
	const [ debounced, setter ] = useState( defaultValue );
	const setDebounced = useDebounce( setter, 250 );
	useEffect( () => {
		if ( debounced !== input ) {
			setDebounced( input );
		}
	}, [ debounced, input ] );
	return [ input, setInput, debounced ];
}
