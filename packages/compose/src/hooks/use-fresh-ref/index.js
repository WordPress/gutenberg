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
export default function useFreshRef( value ) {
	const ref = useRef();
	ref.current = value;
	return ref;
}
