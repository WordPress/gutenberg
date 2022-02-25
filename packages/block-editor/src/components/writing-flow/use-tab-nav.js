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
	const {
		hasMultiSelection,
		getSelectedBlockClientId,
		getBlockCount,
	} = useSelect( blockEditorStore );
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
		/>
	);

	const after = (
		<div
			ref={ focusCaptureAfterRef }
			tabIndex={ focusCaptureTabIndex }
			onFocus={ onFocusCapture }
		/>
	);

	const ref = useRefEffect( ( node ) => {
		function onKeyDown( event ) {
			if ( event.defaultPrevented ) {
				return;
			}

			if ( event.keyCode === ESCAPE && ! hasMultiSelection() ) {
				event.preventDefault();
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
				// Preserve the behaviour of entering navigation mode when
				// tabbing into the content without a block selection.
				// `onFocusCapture` already did this previously, but we need to
				// do it again here because after clearing block selection,
				// focus land on the writing flow container and pressing Tab
				// will no longer send focus through the focus capture element.
				if ( event.target === node ) setNavigationMode( true );
				return;
			}

			// Allow tabbing from the block wrapper to a form element,
			// and between form elements rendered in a block,
			// such as inside a placeholder. Form elements are generally
			// meant to be UI rather than part of the content. Ideally
			// these are not rendered in the content and perhaps in the
			// future they can be rendered in an iframe or shadow DOM.
			if (
				( isFormElement( event.target ) ||
					event.target.getAttribute( 'data-block' ) ===
						getSelectedBlockClientId() ) &&
				isFormElement( focus.tabbable[ direction ]( event.target ) )
			) {
				return;
			}

			const next = isShift ? focusCaptureBeforeRef : focusCaptureAfterRef;

			// Disable focus capturing on the focus capture element, so it
			// doesn't refocus this block and so it allows default behaviour
			// (moving focus to the next tabbable element).
			noCapture.current = true;

			// Focusing the focus capture element, which is located above and
			// below the editor, should not scroll the page all the way up or
			// down.
			next.current.focus( { preventScroll: true } );
		}

		function onFocusOut( event ) {
			lastFocus.current = event.target;

			const { ownerDocument } = node;

			// If focus disappears due to there being no blocks, move focus to
			// the writing flow wrapper.
			if (
				! event.relatedTarget &&
				ownerDocument.activeElement === ownerDocument.body &&
				getBlockCount() === 0
			) {
				node.focus();
			}
		}

		// When tabbing back to an element in block list, this event handler prevents scrolling if the
		// focus capture divs (before/after) are outside of the viewport. (For example shift+tab back to a paragraph
		// when focus is on a sidebar element. This prevents the scrollable writing area from jumping either to the
		// top or bottom of the document.
		//
		// Note that it isn't possible to disable scrolling in the onFocus event. We need to intercept this
		// earlier in the keypress handler, and call focus( { preventScroll: true } ) instead.
		// https://developer.mozilla.org/en-US/docs/Web/API/HTMLOrForeignElement/focus#parameters
		function preventScrollOnTab( event ) {
			if ( event.keyCode !== TAB ) {
				return;
			}

			if ( event.target?.getAttribute( 'role' ) === 'region' ) {
				return;
			}

			if ( container.current === event.target ) {
				return;
			}

			const isShift = event.shiftKey;
			const direction = isShift ? 'findPrevious' : 'findNext';
			const target = focus.tabbable[ direction ]( event.target );
			// only do something when the next tabbable is a focus capture div (before/after)
			if (
				target === focusCaptureBeforeRef.current ||
				target === focusCaptureAfterRef.current
			) {
				event.preventDefault();
				target.focus( { preventScroll: true } );
			}
		}

		const { ownerDocument } = node;
		const { defaultView } = ownerDocument;
		defaultView.addEventListener( 'keydown', preventScrollOnTab );
		node.addEventListener( 'keydown', onKeyDown );
		node.addEventListener( 'focusout', onFocusOut );
		return () => {
			defaultView.removeEventListener( 'keydown', preventScrollOnTab );
			node.removeEventListener( 'keydown', onKeyDown );
			node.removeEventListener( 'focusout', onFocusOut );
		};
	}, [] );

	const mergedRefs = useMergeRefs( [ container, ref ] );

	return [ before, mergedRefs, after ];
}
