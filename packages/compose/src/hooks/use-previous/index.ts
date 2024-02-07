/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';

/**
 * Use the previous value of a prop or state in a component.
 *
 * Based on https://usehooks.com/usePrevious/, but uses refs to avoid rendering twice. See
 * https://www.developerway.com/posts/implementing-advanced-use-previous-hook.
 *
 * @param value The value to track.
 *
 * @return What the value was before it was updated.
 */
export default function usePrevious< T >( value: T ): T | undefined {
	const valueRef = useRef< T >( value );
	const previousRef = useRef< T | undefined >();
	if ( value !== valueRef.current ) {
		previousRef.current = valueRef.current;
		valueRef.current = value;
	}
	return previousRef.current;
}
