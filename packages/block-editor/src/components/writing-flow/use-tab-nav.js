/**
 * WordPress dependencies
 */
import { focus, isFormElement } from '@wordpress/dom';
import { TAB, ESCAPE } from '@wordpress/keycodes';
import { useSelect, useDispatch } from '@wordpress/data';
import { useRefEffect, useMergeRefs } from '@wordpress/compose';
import { useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { isInSameBlock, isInsideRootBlock } from '../../utils/dom';
import { unlock } from '../../lock-unlock';

export default function useTabNav() {
	const container = useRef();
	const focusCaptureBeforeRef = useRef();
	const focusCaptureAfterRef = useRef();

	const { hasMultiSelection, getSelectedBlockClientId, getBlockCount } =
		useSelect( blockEditorStore );
	const { setNavigationMode, setLastFocus } = unlock(
		useDispatch( blockEditorStore )
	);
	const isNavigationMode = useSelect(
		( select ) => select( blockEditorStore ).isNavigationMode(),
		[]
	);

	const { getLastFocus } = unlock( useSelect( blockEditorStore ) );

	// Don't allow tabbing to this element in Navigation mode.
	const focusCaptureTabIndex = ! isNavigationMode ? '0' : undefined;

	// Reference that holds the a flag for enabling or disabling
	// capturing on the focus capture elements.
	const noCaptureRef = useRef();

	function onFocusCapture( event ) {
		// Do not capture incoming focus if set by us in WritingFlow.
		if ( noCaptureRef.current ) {
			noCaptureRef.current = null;
		} else if ( hasMultiSelection() ) {
			container.current.focus();
		} else if ( getSelectedBlockClientId() ) {
			if ( getLastFocus()?.current ) {
				getLastFocus().current.focus();
			} else {
				// Handles when the last focus has not been set yet, or has been cleared by new blocks being added via the inserter.
				container.current
					.querySelector(
						`[data-block="${ getSelectedBlockClientId() }"]`
					)
					.focus();
			}
		} else {
			setNavigationMode( true );

			const canvasElement =
				container.current.ownerDocument === event.target.ownerDocument
					? container.current
					: container.current.ownerDocument.defaultView.frameElement;

			const isBefore =
				// eslint-disable-next-line no-bitwise
				event.target.compareDocumentPosition( canvasElement ) &
				event.target.DOCUMENT_POSITION_FOLLOWING;
			const tabbables = focus.tabbable.find( container.current );

			if ( tabbables.length ) {
				const next = isBefore
					? tabbables[ 0 ]
					: tabbables[ tabbables.length - 1 ];

				next.focus();
			}
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
				if ( event.target === node ) {
					setNavigationMode( true );
				}
				return;
			}

			const nextTabbable = focus.tabbable[ direction ]( event.target );

			// We want to constrain the tabbing to the block and its child blocks.
			// If the preceding form element is within a different block,
			// such as two sibling image blocks in the placeholder state,
			// we want shift + tab from the first form element to move to the image
			// block toolbar and not the previous image block's form element.
			const currentBlock = event.target.closest( '[data-block]' );
			const isElementPartOfSelectedBlock =
				currentBlock &&
				nextTabbable &&
				( isInSameBlock( currentBlock, nextTabbable ) ||
					isInsideRootBlock( currentBlock, nextTabbable ) );

			// Allow tabbing from the block wrapper to a form element,
			// and between form elements rendered in a block and its child blocks,
			// such as inside a placeholder. Form elements are generally
			// meant to be UI rather than part of the content. Ideally
			// these are not rendered in the content and perhaps in the
			// future they can be rendered in an iframe or shadow DOM.
			if (
				isFormElement( nextTabbable ) &&
				isElementPartOfSelectedBlock
			) {
				return;
			}

			const next = isShift ? focusCaptureBeforeRef : focusCaptureAfterRef;

			// Disable focus capturing on the focus capture element, so it
			// doesn't refocus this block and so it allows default behaviour
			// (moving focus to the next tabbable element).
			noCaptureRef.current = true;

			// Focusing the focus capture element, which is located above and
			// below the editor, should not scroll the page all the way up or
			// down.
			next.current.focus( { preventScroll: true } );
		}

		function onFocusOut( event ) {
			setLastFocus( { ...getLastFocus(), current: event.target } );

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
			// Only do something when the next tabbable is a focus capture div (before/after)
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
