/**
 * useDebounce hook
 */

/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';

/**
 * Use to debounce a value that is changing too frequently.
 *
 * Example usage:
 *
 *	// An example using the useDebounce hook with useResizeObserver()
 *  // to debounce a rapidly changing width value
 *
 *	const [ resizeListener, sizes ] = useResizeObserver();
 *	const debouncedSize = useDebounce(sizes.width, 100);
 *
 *	useEffect( () => {
 *
 *		// ... do your thing here ...
 *
 *	}, [debouncedSize] );
 *
 * @param {Object}        value  The value changing you want to debounce.
 * @param {number}        delay  The amount to delay time in ms.
 * @return {Object}				 Debounced value
 *
 */

const useDebounce = ( value, delay ) => {
	const [ debouncedValue, setDebouncedValue ] = useState( value );

	useEffect( () => {
		const handler = setTimeout( () => setDebouncedValue( value ), delay );
		return () => clearTimeout( handler );
	}, [ value ] );

	return debouncedValue;
};

export default useDebounce;
