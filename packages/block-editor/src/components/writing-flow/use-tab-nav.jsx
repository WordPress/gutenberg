import { focus, isFormElement } from '@wordpress/dom';
import { TAB } from '@wordpress/keycodes';
import { useSelect, useDispatch } from '@wordpress/data';
import { useRefEffect, useMergeRefs } from '@wordpress/compose';
import { useRef } from '@wordpress/element';
import { store as blockEditorStore } from '../../store';
import { isInSameBlock, isInsideRootBlock } from '../../utils/dom';
import { unlock } from '../../lock-unlock';

/**
 * Spans the element over the canvas, so it is always at least partially in
 * view and focussing it never scrolls the content. Fixed positioning would
 * achieve that too, but makes Safari composite the scrollable canvas on a
 * layer sized to the whole document instead of the visible pane.
 */
const PREVENT_SCROLL_ON_FOCUS = {
	position: 'absolute',
	inset: 0,
	pointerEvents: 'none',
};

export default function useTabNav() {
	const containerRef = /** @type {typeof useRef<HTMLElement>} */ ( useRef )();
	const focusCaptureBeforeRef = useRef();
	const focusCaptureAfterRef = useRef();

	const {
		hasMultiSelection,
		getSelectedBlockClientId,
		getBlockCount,
		getBlockOrder,
		getLastFocus,
		getSectionRootClientId,
		isZoomOut,
	} = unlock( useSelect( blockEditorStore ) );
	const { setLastFocus } = unlock( useDispatch( blockEditorStore ) );

	// Reference that holds the a flag for enabling or disabling
	// capturing on the focus capture elements.
	const noCaptureRef = useRef();

	function onFocusCapture( event ) {
		const canvasElement =
			containerRef.current.ownerDocument === event.target.ownerDocument
				? containerRef.current
				: containerRef.current.ownerDocument.defaultView.frameElement;

		// Do not capture incoming focus if set by us in WritingFlow.
		if ( noCaptureRef.current ) {
			noCaptureRef.current = null;
		} else if ( hasMultiSelection() ) {
			containerRef.current.focus();
		} else if ( getSelectedBlockClientId() ) {
			if ( getLastFocus()?.current ) {
				getLastFocus().current.focus();
			} else {
				// Handles when the last focus has not been set yet, or has been cleared by new blocks being added via the inserter.
				containerRef.current
					.querySelector(
						`[data-block="${ getSelectedBlockClientId() }"]`
					)
					.focus();
			}
		}
		// In "compose" mode without a selected ID, we want to place focus on the section root when tabbing to the canvas.
		else if ( isZoomOut() ) {
			const sectionRootClientId = getSectionRootClientId();
			const sectionBlocks = getBlockOrder( sectionRootClientId );

			// If we have section within the section root, focus the first one.
			if ( sectionBlocks.length ) {
				containerRef.current
					.querySelector( `[data-block="${ sectionBlocks[ 0 ] }"]` )
					.focus();
			}
			// If we don't have any section blocks, focus the section root.
			else if ( sectionRootClientId ) {
				containerRef.current
					.querySelector( `[data-block="${ sectionRootClientId }"]` )
					.focus();
			} else {
				// If we don't have any section root, focus the canvas.
				canvasElement.focus();
			}
		} else {
			const isBefore =
				// eslint-disable-next-line no-bitwise
				event.target.compareDocumentPosition( canvasElement ) &
				event.target.DOCUMENT_POSITION_FOLLOWING;
			const tabbables = focus.tabbable.find( containerRef.current );
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
			tabIndex="0"
			onFocus={ onFocusCapture }
			style={ PREVENT_SCROLL_ON_FOCUS }
		/>
	);

	const after = (
		<div
			ref={ focusCaptureAfterRef }
			tabIndex="0"
			onFocus={ onFocusCapture }
			style={ PREVENT_SCROLL_ON_FOCUS }
		/>
	);

	const ref = useRefEffect( ( node ) => {
		function onKeyDown( event ) {
			if ( event.defaultPrevented ) {
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

			if (
				// Bails in case the focus capture elements aren’t present. They
				// may be omitted to avoid silent tab stops in preview mode.
				// See: https://github.com/WordPress/gutenberg/pull/59317
				! focusCaptureAfterRef.current ||
				! focusCaptureBeforeRef.current
			) {
				return;
			}

			const { target, shiftKey: isShift } = event;
			const direction = isShift ? 'findPrevious' : 'findNext';
			const nextTabbable = focus.tabbable[ direction ]( target );

			// We want to constrain the tabbing to the block and its child blocks.
			// If the preceding form element is within a different block,
			// such as two sibling image blocks in the placeholder state,
			// we want shift + tab from the first form element to move to the image
			// block toolbar and not the previous image block's form element.
			const currentBlock = target.closest( '[data-block]' );
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

			next.current.focus();
		}

		function onFocusOut( event ) {
			// `focusout` also fires when focus moves between elements within the
			// canvas, but only the element focus left the canvas from is of
			// interest. `contains` is false for a null `relatedTarget`, which is
			// what focus moving to another document reports.
			if ( ! node.contains( event.relatedTarget ) ) {
				setLastFocus( { current: event.target } );
			}

			const { ownerDocument } = node;

			// If focus disappears due to there being no blocks, move focus to
			// the writing flow wrapper.
			if (
				! event.relatedTarget &&
				event.target.hasAttribute( 'data-block' ) &&
				ownerDocument.activeElement === ownerDocument.body &&
				getBlockCount() === 0
			) {
				node.focus();
			}
		}

		node.addEventListener( 'keydown', onKeyDown );
		node.addEventListener( 'focusout', onFocusOut );
		return () => {
			node.removeEventListener( 'keydown', onKeyDown );
			node.removeEventListener( 'focusout', onFocusOut );
		};
	}, [] );

	const mergedRefs = useMergeRefs( [ containerRef, ref ] );

	return [ before, mergedRefs, after ];
}
