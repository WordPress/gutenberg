/**
 * External dependencies
 */
import type { RefCallback } from 'react';

/**
 * Internal dependencies
 */
import useRefEffect from '../use-ref-effect';

/**
 * Dispatches a bubbling focus event when the iframe receives focus. Use
 * `onFocus` as usual on the iframe or a parent element.
 *
 * @return Ref to pass to the iframe.
 */
export default function useFocusableIframe(): RefCallback< HTMLIFrameElement > {
	return useRefEffect( ( element ) => {
		const { ownerDocument } = element;
		if ( ! ownerDocument ) {
			return;
		}
		const { defaultView } = ownerDocument;
		if ( ! defaultView ) {
			return;
		}

		/**
		 * Checks whether the iframe is the activeElement, inferring that it has
		 * then received focus, and dispatches a focus event.
		 */
		function checkFocus() {
			if ( ownerDocument && ownerDocument.activeElement === element ) {
				( element as HTMLElement ).focus();
			}
		}

		defaultView.addEventListener( 'blur', checkFocus );
		return () => {
			defaultView.removeEventListener( 'blur', checkFocus );
		};
	}, [] );
}
