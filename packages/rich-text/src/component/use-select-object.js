/**
 * WordPress dependencies
 */
import { useRefEffect } from '@wordpress/compose';

export function useSelectObject() {
	return useRefEffect( ( element ) => {
		function onClick( event ) {
			const { target } = event;

			// If the child element has no text content, it must be an object.
			if ( target === element || target.textContent ) {
				return;
			}

			const { ownerDocument } = target;
			const { defaultView } = ownerDocument;
			const range = ownerDocument.createRange();
			const selection = defaultView.getSelection();

			range.selectNode( target );
			selection.removeAllRanges();
			selection.addRange( range );
		}

		element.addEventListener( 'click', onClick );
		return () => {
			element.removeEventListener( 'click', onClick );
		};
	}, [] );
}
