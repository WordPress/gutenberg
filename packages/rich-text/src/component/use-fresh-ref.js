/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';

export function useFreshRef( value ) {
	const ref = useRef();
	ref.current = value;
	return ref;
}
