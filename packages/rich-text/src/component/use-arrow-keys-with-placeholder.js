/**
 * WordPress dependencies
 */
import { useRefEffect } from '@wordpress/compose';
import { LEFT, RIGHT } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { ZWNBSP } from '../special-characters';

export function useArrowKeysWithPlaceholder() {
	return useRefEffect( ( element ) => {
		function onKeyDown( event ) {
			const { keyCode } = event;

			if ( event.defaultPrevented ) {
				return;
			}

			if ( keyCode !== LEFT && keyCode !== RIGHT ) {
				return;
			}

			const { ownerDocument } = element;
			const { defaultView } = ownerDocument;
			const selection = defaultView.getSelection();

			if ( ! selection.rangeCount || ! selection.isCollapsed ) {
				return;
			}

			const range = selection.getRangeAt( 0 );
			const { startContainer, startOffset } = range;

			if ( startContainer.nodeType !== startContainer.TEXT_NODE ) {
				return;
			}

			if ( startContainer.data !== ZWNBSP ) {
				return;
			}

			if ( keyCode === LEFT && startOffset === 0 ) {
				return;
			}

			if ( keyCode === RIGHT && startOffset === 1 ) {
				return;
			}

			const newRange = ownerDocument.createRange();
			const offset = keyCode === LEFT ? 0 : 1;

			newRange.setStart( startContainer, offset );
			newRange.setEnd( startContainer, offset );

			selection.removeAllRanges();
			selection.addRange( newRange );
		}

		element.addEventListener( 'keydown', onKeyDown );
		return () => {
			element.removeEventListener( 'keydown', onKeyDown );
		};
	}, [] );
}
