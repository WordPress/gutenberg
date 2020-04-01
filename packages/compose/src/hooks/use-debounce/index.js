/**
 * useDebounce hook
 */

/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

/**
 * Use to debounce a value that is changing too frequently.
 *
 * Example usage:
 *
 * ```js
 *	// An example using the useDebounce hook with useResizeObserver()
 *  // to debounce a rapidly changing width value
 *
 *	const [ resizeListener, sizes ] = useResizeObserver();
 *
 *	useDebounce( ( sz ) => {
 *
 *		// ... do your thing here ...
 *
 *	}, 200, sizes.width );
 *
 *	return (
 *		<div>
 *			{resizeListener}
 *		</div>
 *	);
 *	```
 *
 * @param {Function} callback The function to call with the debounced value.
 * @param {number}   delay    The amount to delay time in ms.
 * @param {*}        deps     The dependent value changing you want to debounce.
 *
 */
const useDebounce = ( callback, delay, deps ) => {
	useEffect( () => {
		const handler = setTimeout( () => callback( deps ), delay );
		return () => clearTimeout( handler );
	}, [ deps ] );
};

export default useDebounce;
