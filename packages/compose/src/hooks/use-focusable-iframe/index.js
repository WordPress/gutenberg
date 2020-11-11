/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

/**
 * Dispatches a bubbling focus event when the iframe receives focus. Use
 * `onFocus` as usual on the iframe or a parent element.
 *
 * @param {Object} ref React ref to the iframe.
 */
export default function useFocusableIframe( ref ) {
	useEffect( () => {
		const { ownerDocument } = ref.current;
		const { defaultView } = ownerDocument;
		const { FocusEvent } = defaultView;

		/**
		 * Checks whether the iframe is the activeElement, inferring that it has
		 * then received focus, and dispatches a focus event.
		 */
		function checkFocus() {
			if ( ownerDocument.activeElement === ref.current ) {
				ref.current.dispatchEvent(
					new FocusEvent( 'focus', { bubbles: true } )
				);
			}
		}

		defaultView.addEventListener( 'blur', checkFocus );

		return () => {
			defaultView.removeEventListener( 'blur', checkFocus );
		};
	}, [] );
}
