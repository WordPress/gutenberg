/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';

const INITIAL_TAG = Symbol( 'INITIAL_TAG' );

/**
 * Like `useRef` but only run the initializer once.
 *
 * @typedef {import('@types/react').MutableRefObject} MutableRefObject
 *
 * @param {Function} initializer A function to return the ref object.
 * @return {MutableRefObject} The returned ref object.
 */
function useLazyRef( initializer ) {
	const ref = useRef( INITIAL_TAG );

	if ( ref.current === INITIAL_TAG ) {
		ref.current = initializer();
	}

	return ref;
}

export default useLazyRef;
