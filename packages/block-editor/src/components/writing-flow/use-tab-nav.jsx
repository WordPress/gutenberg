import { focus, isFormElement } from '@wordpress/dom';
import { TAB } from '@wordpress/keycodes';
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
};

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
		isZoomOut,
	} = unlock( useSelect( blockEditorStore ) );
	const { setLastFocus } = unlock( useDispatch( blockEditorStore ) );

	// The canvas is a single stop in the page's tab order, and going in is
	// an explicit action on it. Focus returns to the place it last left the
	// canvas from.
	function enterCanvas( fromAfter ) {
		// Focus the canvas window before any element in it: entering starts
		// from the stop in the parent document, and Firefox does not move
		// window focus for a cross-document `element.focus()`, leaving the
		// caret restored but every key stranded in the parent.
		containerRef.current.ownerDocument.defaultView.focus();

		if ( hasMultiSelection() ) {
			containerRef.current.focus();
			return;
		}

		if ( getSelectedBlockClientId() ) {
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
			return;
		}

		// In "compose" mode without a selected ID, we want to place focus on the section root when tabbing to the canvas.
		if ( isZoomOut() ) {
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
			return;
		}

		const tabbables = focus.tabbable.find( containerRef.current );
		if ( tabbables.length ) {
			const next = fromAfter
				? tabbables[ tabbables.length - 1 ]
				: tabbables[ 0 ];
			next.focus();
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

		if (
			! event.shiftKey &&
			( key === 'Enter' ||
				key === ' ' ||
				key === 'F2' ||
				key === 'Escape' ||
				key === 'ArrowDown' ||
				key === 'ArrowUp' )
		) {
			event.preventDefault();
			enterCanvas( key === 'ArrowUp' );
			return;
		}

		// Backwards, Tab leaves the canvas naturally: the stop is the first
		// element before it. Forwards, sequential order would walk into the
		// content, so move focus to the first tabbable past the canvas.
		if ( key === 'Tab' && ! event.shiftKey ) {
			event.preventDefault();
			focus.tabbable.findNext( focusCaptureAfterRef.current )?.focus();
		}
	}

	const before = (
		<div
			ref={ focusCaptureBeforeRef }
			tabIndex="0"
			role="button"
			aria-label={ __( 'Editor canvas' ) }
			aria-describedby={ hintId }
			className="block-editor-writing-flow__canvas-stop"
			onKeyDown={ onStopKeyDown }
		>
			{ /* The badge doubles as the stop's description for assistive
			     technologies; hidden content still counts for
			     `aria-describedby`. */ }
			<div
				className="block-editor-writing-flow__canvas-stop-hint"
				id={ hintId }
			>
				{ __( 'Press Enter to edit the document' ) }
			</div>
		</div>
	);

	// Focus arriving behind the canvas is forwarded to the stop before it,
	// so the canvas has one stop, reached from either direction.
	const after = (
		<div
			ref={ focusCaptureAfterRef }
			tabIndex="0"
			className="block-editor-writing-flow__canvas-stop-redirect"
			onFocus={ () =>
				focusCaptureBeforeRef.current?.focus( {
					preventScroll: true,
				} )
			}
		/>
	);

	const ref = useRefEffect( ( node ) => {
		function onKeyDown( event ) {
			if ( event.defaultPrevented ) {
				return;
			}

			// Escape steps out of the canvas onto its stop. Every handler
			// with a stronger claim on the key runs earlier, either deeper
			// in the tree or in the capture phase, so an unclaimed key here
			// means the key is free.
			if (
				event.key === 'Escape' &&
				! event.ctrlKey &&
				! event.metaKey &&
				! event.altKey
			) {
				if ( focusCaptureBeforeRef.current ) {
					event.preventDefault();
					focusCaptureBeforeRef.current.focus( {
						preventScroll: true,
					} );
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

			// Tab out of the canvas: move focus past the element on the side
			// being tabbed towards, without stopping on it.
			event.preventDefault();
			const outside = isShift
				? focus.tabbable.findPrevious( focusCaptureBeforeRef.current )
				: focus.tabbable.findNext( focusCaptureAfterRef.current );
			outside?.focus();
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

		// When tabbing back to an element in block list, this event handler prevents scrolling if the
		// focus capture divs (before/after) are outside of the viewport. (For example shift+tab back to a paragraph
		// when focus is on a sidebar element. This prevents the scrollable writing area from jumping either to the
		// top or bottom of the document.
		//
		// Note that it isn't possible to disable scrolling in the onFocus event. We need to intercept this
		// earlier in the keypress handler, and call focus( { preventScroll: true } ) instead.
		// https://developer.mozilla.org/en-US/docs/Web/API/HTMLOrForeignElement/focus#parameters
		function preventScrollOnTab( event ) {
			// The canvas skip in `onKeyDown` may have already moved focus.
			if ( event.defaultPrevented ) {
				return;
			}

			if ( event.keyCode !== TAB ) {
				return;
			}

			if ( event.target?.getAttribute( 'role' ) === 'region' ) {
				return;
			}

			if ( containerRef.current === event.target ) {
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

	const mergedRefs = useMergeRefs( [ containerRef, ref ] );

	return [ before, mergedRefs, after ];
}
