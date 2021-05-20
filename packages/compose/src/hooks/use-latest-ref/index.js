/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';

/**
 * A ref that always contains the lastest value.
 *
 * @param {any} value The value to store in the ref.
 *
 * @return {import('react').RefObject} A ref object with the value.
 */
export default function useLatestRef( value ) {
	const ref = useRef();
	// Assignment MUST happen on render, otherwise the value is not up-to-date
	// for ref callbacks. Assignment with `useEffect` or `useLayoutEffect` won't
	// work because ref callbacks are called before effect callbacks.
	ref.current = value;
	return ref;
}
