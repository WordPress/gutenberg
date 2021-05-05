/**
 * WordPress dependencies
 */
import { focus } from '@wordpress/dom';
import { TAB, ESCAPE } from '@wordpress/keycodes';
import { useSelect, useDispatch } from '@wordpress/data';
import { useRefEffect } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

function isFormElement( element ) {
	const { tagName } = element;
	return (
		tagName === 'INPUT' ||
		tagName === 'BUTTON' ||
		tagName === 'SELECT' ||
		tagName === 'TEXTAREA'
	);
}

export default function useTabNav( {
	noCapture,
	focusCaptureBeforeRef,
	focusCaptureAfterRef,
} ) {
	const { hasMultiSelection } = useSelect( blockEditorStore );
	const { setNavigationMode } = useDispatch( blockEditorStore );

	return useRefEffect( ( node ) => {
		function onKeyDown( event ) {
			if ( event.keyCode === ESCAPE && ! hasMultiSelection() ) {
				setNavigationMode( true );
				return;
			}

			// In Edit mode, Tab should focus the first tabbable element after
			// the content, which is normally the sidebar (with block controls)
			// and Shift+Tab should focus the first tabbable element before the
			// content, which is normally the block toolbar.
			// Arrow keys can be used, and Tab and arrow keys can be used in
			// Navigation mode (press Esc), to navigate through blocks.
			if ( event.keyCode !== TAB ) {
				return;
			}

			const isShift = event.shiftKey;
			const direction = isShift ? 'findPrevious' : 'findNext';

			// Allow tabbing between form elements rendered in a block,
			// such as inside a placeholder. Form elements are generally
			// meant to be UI rather than part of the content. Ideally
			// these are not rendered in the content and perhaps in the
			// future they can be rendered in an iframe or shadow DOM.
			if (
				! hasMultiSelection() &&
				isFormElement( event.target ) &&
				isFormElement( focus.tabbable[ direction ]( event.target ) )
			) {
				return;
			}

			const next = isShift ? focusCaptureBeforeRef : focusCaptureAfterRef;

			// Disable focus capturing on the focus capture element, so it
			// doesn't refocus this block and so it allows default behaviour
			// (moving focus to the next tabbable element).
			noCapture.current = true;
			next.current.focus();
		}

		node.addEventListener( 'keydown', onKeyDown );
		return () => {
			node.removeEventListener( 'keydown', onKeyDown );
		};
	}, [] );
}
