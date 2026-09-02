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
	const canvasStopRef = useRef();
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
		didAutomaticChange,
		getSettings,
	} = unlock( useSelect( blockEditorStore ) );
	const { setLastFocus } = unlock( useDispatch( blockEditorStore ) );

	// The canvas is a single stop in the page's tab order: the two stop
	// elements sit on either side of it, and going in is an explicit action
	// on them. Focus returns to the place it last left the canvas from.
	function enterCanvas( fromAfter ) {
		if ( hasMultiSelection() ) {
			containerRef.current.focus();
			return;
		}

		if ( getSelectedBlockClientId() ) {
			if ( getLastFocus()?.current ) {
				getLastFocus().current.focus();
			} else {
				// Handles when the last focus has not been set yet, or has
				// been cleared by new blocks being added via the inserter.
				containerRef.current
					.querySelector(
						`[data-block="${ getSelectedBlockClientId() }"]`
					)
					.focus();
			}
			return;
		}

		// In "compose" mode without a selected ID, place focus on the
		// section root when entering the canvas.
		if ( isZoomOut() ) {
			const sectionRootClientId = getSectionRootClientId();
			const sectionBlocks = getBlockOrder( sectionRootClientId );

			// If we have a section within the section root, focus the first
			// one.
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

		// Tab forwards leaves the wrapper naturally: the stop is its last
		// element. Backwards, sequential order would walk into the content,
		// so move focus to the last tabbable before the wrapper instead.
		if ( key === 'Tab' && event.shiftKey ) {
			event.preventDefault();
			focus.tabbable
				.findPrevious( event.currentTarget.parentElement )
				?.focus();
		}
	}

	// The wrapper is not a stop of its own: focus arriving from outside,
	// which sequential navigation only delivers travelling forwards, is
	// forwarded to the stop after the content. Backwards, the stop is the
	// wrapper's last tabbable and catches focus by itself.
	function onWrapperFocus( event ) {
		if (
			event.target === event.currentTarget &&
			! event.currentTarget.contains( event.relatedTarget )
		) {
			canvasStopRef.current?.focus();
		}
	}

	const wrapperProps = {
		className: 'block-editor-writing-flow__canvas-wrapper',
		tabIndex: '0',
		onFocus: onWrapperFocus,
	};

	const stop = (
		<div
			ref={ canvasStopRef }
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

	const ref = useRefEffect( ( node ) => {
		function onKeyDown( event ) {
			if ( event.defaultPrevented ) {
				return;
			}

			// Escape or Backspace right after an automatic change, like `* `
			// turning into a list, undoes that change. This needs nothing
			// from the element the key landed on, only the store.
			if ( event.key === 'Escape' || event.key === 'Backspace' ) {
				const { __experimentalUndo } = getSettings();
				if ( __experimentalUndo && didAutomaticChange() ) {
					event.preventDefault();
					__experimentalUndo();
					return;
				}
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
				if ( canvasStopRef.current ) {
					event.preventDefault();
					canvasStopRef.current.focus( { preventScroll: true } );
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

			// Bails in case the stop isn’t present. It may be omitted to
			// avoid a silent tab stop in preview mode.
			// See: https://github.com/WordPress/gutenberg/pull/59317
			if ( ! canvasStopRef.current ) {
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

			// Tab out of the canvas: forwards past the stop, backwards past
			// the wrapper, without stopping on either.
			event.preventDefault();
			const outside = isShift
				? focus.tabbable.findPrevious(
						canvasStopRef.current.parentElement
				  )
				: focus.tabbable.findNext( canvasStopRef.current );
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

		node.addEventListener( 'keydown', onKeyDown );
		node.addEventListener( 'focusout', onFocusOut );
		return () => {
			node.removeEventListener( 'keydown', onKeyDown );
			node.removeEventListener( 'focusout', onFocusOut );
		};
	}, [] );

	const mergedRefs = useMergeRefs( [ containerRef, ref ] );

	return [ wrapperProps, mergedRefs, stop ];
}
