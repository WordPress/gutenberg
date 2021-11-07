/**
 * WordPress dependencies
 */
import { useRefEffect } from '@wordpress/compose';

export function useHidePlaceholderOnInputComposition() {
	return useRefEffect( ( element ) => {
		function getPlaceholderElement() {
			return element.querySelector( '[data-rich-text-placeholder]' );
		}

		function handleCompositionStart() {
			const placeholder = getPlaceholderElement();
			if ( placeholder ) {
				placeholder.style.display = 'none';
			}
		}

		function handleCompositionEnd() {
			const placeholder = getPlaceholderElement();
			if ( placeholder ) {
				placeholder.style.display = '';
			}
		}

		element.addEventListener( 'compositionstart', handleCompositionStart );
		element.addEventListener( 'compositionend', handleCompositionEnd );

		return () => {
			element.removeEventListener(
				'compositionstart',
				handleCompositionStart
			);
			element.removeEventListener(
				'compositionend',
				handleCompositionEnd
			);
		};
	}, [] );
}
