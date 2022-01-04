/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useRefEffect from '../use-ref-effect';

/**
 * @template T
 * @param {T} value
 * @return {import('react').RefObject<T>} The updated ref
 */
function useUpdatedRef( value ) {
	const ref = useRef( value );
	ref.current = value;
	return ref;
}

/**
 * Copies the given text to the clipboard when the element is clicked.
 *
 * @template {HTMLElement} TElementType
 * @param {string | (() => string)} text      The text to copy. Use a function if not
 *                                            already available and expensive to compute.
 * @param {Function}                onSuccess Called when to text is copied.
 *
 * @return {import('react').Ref<TElementType>} A ref to assign to the target element.
 */
export default function useCopyToClipboard( text, onSuccess ) {
	// Store the dependencies as refs and continuesly update them so they're
	// fresh when the callback is called.
	const textRef = useUpdatedRef( text );
	const onSuccessRef = useUpdatedRef( onSuccess );
	return useRefEffect( ( trigger ) => {
		if ( ! trigger ) {
			return;
		}

		const copyTextToClipboard = () => {
			const currentWindow = trigger.ownerDocument.defaultView || window;
			const textToCopy =
				typeof textRef.current === 'function'
					? textRef.current()
					: textRef.current || '';

			currentWindow?.navigator?.clipboard
				?.writeText( textToCopy )
				.then( () => {
					// Invoke callback
					onSuccessRef?.current?.();
				} );
		};

		trigger.addEventListener( 'click', copyTextToClipboard );

		return () => {
			trigger.removeEventListener( 'click', copyTextToClipboard );
		};
	}, [] );
}
