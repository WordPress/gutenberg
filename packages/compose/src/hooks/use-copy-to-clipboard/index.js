/**
 * External dependencies
 */
import Clipboard from 'clipboard';

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
 * @param {Element=}                container The container in which the copy action will be performed. Useful when there are active focus traps, like when using modal components.
 *
 * @return {import('react').Ref<TElementType>} A ref to assign to the target element.
 */
export default function useCopyToClipboard( text, onSuccess, container ) {
	// Store the dependencies as refs and continuously update them so they're
	// fresh when the callback is called.
	const textRef = useUpdatedRef( text );
	const onSuccessRef = useUpdatedRef( onSuccess );
	const containerRef = useUpdatedRef( container );
	return useRefEffect( ( node ) => {
		// Clipboard listens to click events.
		const clipboard = new Clipboard( node, {
			text() {
				return typeof textRef.current === 'function'
					? textRef.current()
					: textRef.current || '';
			},
			container: containerRef.current ?? undefined,
		} );

		clipboard.on( 'success', ( { clearSelection } ) => {
			// Clearing selection will move focus back to the triggering
			// button, ensuring that it is not reset to the body, and
			// further that it is kept within the rendered node.
			clearSelection();
			// Handle ClipboardJS focus bug, see
			// https://github.com/zenorocha/clipboard.js/issues/680
			node.focus();

			if ( onSuccessRef.current ) {
				onSuccessRef.current();
			}
		} );

		return () => {
			clipboard.destroy();
		};
	}, [] );
}
