/**
 * WordPress dependencies
 */
import { focus } from '@wordpress/dom';
import { TAB, ESCAPE } from '@wordpress/keycodes';
import { useSelect, useDispatch } from '@wordpress/data';
import { useRefEffect, useMergeRefs } from '@wordpress/compose';
import { useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

/**
 * Useful for positioning an element within the viewport so focussing the
 * element does not scroll the page.
 */
const PREVENT_SCROLL_ON_FOCUS = { position: 'fixed' };

function isFormElement( element ) {
	const { tagName } = element;
	return (
		tagName === 'INPUT' ||
		tagName === 'BUTTON' ||
		tagName === 'SELECT' ||
		tagName === 'TEXTAREA'
	);
}

export default function useTabNav() {
	const container = useRef();
	const focusCaptureBeforeRef = useRef();
	const focusCaptureAfterRef = useRef();
	const lastFocus = useRef();
	const { hasMultiSelection, getSelectedBlockClientId } = useSelect(
		blockEditorStore
	);
	const { setNavigationMode } = useDispatch( blockEditorStore );
	const isNavigationMode = useSelect(
		( select ) => select( blockEditorStore ).isNavigationMode(),
		[]
	);

	// Don't allow tabbing to this element in Navigation mode.
	const focusCaptureTabIndex = ! isNavigationMode ? '0' : undefined;

	// Reference that holds the a flag for enabling or disabling
	// capturing on the focus capture elements.
	const noCapture = useRef();

	function onFocusCapture( event ) {
		// Do not capture incoming focus if set by us in WritingFlow.
		if ( noCapture.current ) {
			noCapture.current = null;
		} else if ( hasMultiSelection() ) {
			container.current.focus();
		} else if ( getSelectedBlockClientId() ) {
			lastFocus.current.focus();
		} else {
			setNavigationMode( true );

			const isBefore =
				// eslint-disable-next-line no-bitwise
				event.target.compareDocumentPosition( container.current ) &
				event.target.DOCUMENT_POSITION_FOLLOWING;
			const action = isBefore ? 'findNext' : 'findPrevious';

			focus.tabbable[ action ]( event.target ).focus();
		}
	}

	const before = (
		<div
			ref={ focusCaptureBeforeRef }
			tabIndex={ focusCaptureTabIndex }
			onFocus={ onFocusCapture }
			style={ PREVENT_SCROLL_ON_FOCUS }
		/>
	);

	const after = (
		<div
			ref={ focusCaptureAfterRef }
			tabIndex={ focusCaptureTabIndex }
			onFocus={ onFocusCapture }
			style={ PREVENT_SCROLL_ON_FOCUS }
		/>
	);

	const ref = useRefEffect( ( node ) => {
		function onKeyDown( event ) {
			if ( event.keyCode === ESCAPE && ! hasMultiSelection() ) {
				event.stopPropagation();
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

			if ( ! hasMultiSelection() && ! getSelectedBlockClientId() ) {
				return;
			}

			// Allow tabbing between form elements rendered in a block,
			// such as inside a placeholder. Form elements are generally
			// meant to be UI rather than part of the content. Ideally
			// these are not rendered in the content and perhaps in the
			// future they can be rendered in an iframe or shadow DOM.
			if (
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

		function onFocusOut( event ) {
			lastFocus.current = event.target;
		}

		node.addEventListener( 'keydown', onKeyDown );
		node.addEventListener( 'focusout', onFocusOut );
		return () => {
			node.removeEventListener( 'keydown', onKeyDown );
			node.removeEventListener( 'focusout', onFocusOut );
		};
	}, [] );

	const mergedRefs = useMergeRefs( [ container, ref ] );

	return [ before, mergedRefs, after ];
}
