/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';

/**
 * Use something's value from the previous render.
 * Based on https://usehooks.com/usePrevious/.
 *
 * @param  value The value to track.
 *
 * @return The value from the previous render.
 */
export default function usePrevious< T >( value: T ): T | undefined {
	const ref = useRef< T >();

	// Store current value in ref.
	useEffect( () => {
		ref.current = value;
	}, [ value ] ); // Re-run when value changes.

	// Return previous value (happens before update in useEffect above).
	return ref.current;
}
