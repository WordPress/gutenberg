import { focus, isFormElement } from '@wordpress/dom';
import { TAB, withIgnoreIMEEvents } from '@wordpress/keycodes';
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { useRefEffect, useMergeRefs, useInstanceId } from '@wordpress/compose';
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
	outline: 'none',
};

// Keys that move focus from the canvas stop into the canvas.
const ENTRY_KEYS = [ 'Enter', ' ', 'F2', 'Escape' ];

export default function useTabNav() {
	const containerRef = /** @type {typeof useRef<HTMLElement>} */ ( useRef )();
	const focusCaptureBeforeRef = useRef();
	const focusCaptureAfterRef = useRef();
	const hintId = useInstanceId(
		useTabNav,
		'block-editor-writing-flow__canvas-stop-hint'
	);

	const {
		hasMultiSelection,
		getSelectedBlockClientId,
		getBlockCount,
		getBlockOrder,
		getLastFocus,
		getSectionRootClientId,
		getEditedContentOnlySection,
		isZoomOut,
	} = unlock( useSelect( blockEditorStore ) );
	const { setLastFocus } = unlock( useDispatch( blockEditorStore ) );

	// Reference that holds the a flag for enabling or disabling
	// capturing on the focus capture elements.
	const noCaptureRef = useRef();

	// The canvas is a single stop in the page's tab order, and going in is
	// an explicit action on it. Focus returns to the place it last left the
	// canvas from.
	function enterCanvas() {
		// Focus the canvas window first. The stop is in the parent document,
		// and when Firefox focuses an element in another document, it does
		// not move window focus, so the caret would be restored but key
		// presses would keep going to the parent page.
		containerRef.current.ownerDocument.defaultView.focus();

		if ( hasMultiSelection() ) {
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
				containerRef.current.focus();
			}
		} else {
			const tabbables = focus.tabbable.find( containerRef.current );
			if ( tabbables.length ) {
				tabbables[ 0 ].focus();
			} else {
				// Nothing in the canvas is tabbable. Entering still enters:
				// keys go to the canvas, and a block can be selected with
				// the arrow keys or a click.
				containerRef.current.focus();
			}
		}
	}

	function onStopKeyDown( event ) {
		if (
			event.defaultPrevented ||
			event.ctrlKey ||
			event.metaKey ||
			event.altKey
		) {
			return;
		}

		const { key } = event;

		if ( ! event.shiftKey && ENTRY_KEYS.includes( key ) ) {
			event.preventDefault();
			enterCanvas();
			return;
		}

		// Shift+Tab leaves the canvas on its own, because the stop is the
		// first element before it. Plain Tab would move into the content,
		// so move focus to the first tabbable element past the canvas.
		if ( key === 'Tab' && ! event.shiftKey ) {
			event.preventDefault();
			focus.tabbable.findNext( focusCaptureAfterRef.current )?.focus();
		}
	}

	// Focus arriving on the stop engages the canvas right away, like a
	// text field that starts editing when focused. Only Escape parks
	// focus on the stop, giving Tab traction again: from a parked stop,
	// Tab moves to the interface around the canvas, not the content.
	function onStopFocus() {
		if ( noCaptureRef.current ) {
			noCaptureRef.current = null;
			return;
		}
		enterCanvas();
	}

	const before = (
		<div
			ref={ focusCaptureBeforeRef }
			tabIndex="0"
			role="button"
			aria-label={ __( 'Editor canvas' ) }
			aria-describedby={ hintId }
			className="block-editor-writing-flow__canvas-stop"
			style={ PREVENT_SCROLL_ON_FOCUS }
			onFocus={ onStopFocus }
			onKeyDown={ onStopKeyDown }
			// Assistive technology activates a button with a click event,
			// not a key press. Pointer clicks pass through the element, so
			// a click can only come from such an activation.
			onClick={ enterCanvas }
		>
			{ /* The hint is also the button's description for assistive
			     technology. Content hidden with `display: none` still
			     works for `aria-describedby`. */ }
			<div
				className="block-editor-writing-flow__canvas-stop-hint"
				id={ hintId }
			>
				{ __( 'Press Enter to edit the document' ) }
			</div>
		</div>
	);

	// Focus landing on the element after the canvas enters it, the same
	// as focus landing on the stop before it.
	function onFocusCapture() {
		// Do not act on focus set by the tab handler below, which moves
		// focus here so that the default behaviour (moving focus to the
		// next tabbable element) continues from this element.
		if ( noCaptureRef.current ) {
			noCaptureRef.current = null;
			return;
		}
		enterCanvas();
	}

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

			// Escape steps out of the canvas onto its stop. Everything with
			// a stronger claim on the key runs first: handlers deeper in
			// the tree, capture handlers, and listeners registered earlier
			// on this node, like the automatic change undo. If the key is
			// still unclaimed here, nothing else wants it.
			if (
				event.key === 'Escape' &&
				! event.shiftKey &&
				! event.ctrlKey &&
				! event.metaKey &&
				! event.altKey
			) {
				// While a content-only section is being edited, Escape first
				// stops editing it. That handler lives in the parent
				// document and runs after this one, so leave the key to it.
				if ( getEditedContentOnlySection() ) {
					return;
				}
				if ( focusCaptureBeforeRef.current ) {
					event.preventDefault();
					// Park on the stop instead of engaging the canvas,
					// which is what focus arriving on it normally does.
					noCaptureRef.current = true;
					focusCaptureBeforeRef.current.focus();
				}
				return;
			}

			// In Edit mode, Tab should focus the first tabbable element after
			// the content, which is normally the sidebar (with block controls)
			// and Shift+Tab should focus the first tabbable element before the
			// content, which is normally the block toolbar.
			// Arrow keys can be used to navigate through blocks.
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

			// Disable the focus forwarding on the focus capture element, so
			// it allows default behaviour (moving focus to the next tabbable
			// element).
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

		// During an IME composition, Escape and Tab control the input
		// method, not the editor.
		const onKeyDownOutsideIME = withIgnoreIMEEvents( onKeyDown );

		node.addEventListener( 'keydown', onKeyDownOutsideIME );
		node.addEventListener( 'focusout', onFocusOut );
		return () => {
			node.removeEventListener( 'keydown', onKeyDownOutsideIME );
			node.removeEventListener( 'focusout', onFocusOut );
		};
	}, [] );

	const mergedRefs = useMergeRefs( [ containerRef, ref ] );

	return [ before, mergedRefs, after ];
}
