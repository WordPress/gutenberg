/**
 * External dependencies
 */
import { overEvery, find, findLast, reverse, first, last } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useRef, useEffect } from '@wordpress/element';
import {
	computeCaretRect,
	focus,
	isHorizontalEdge,
	isTextField,
	isVerticalEdge,
	placeCaretAtHorizontalEdge,
	placeCaretAtVerticalEdge,
	isEntirelySelected,
} from '@wordpress/dom';
import {
	UP,
	DOWN,
	LEFT,
	RIGHT,
	TAB,
	isKeyboardEvent,
	ESCAPE,
} from '@wordpress/keycodes';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	isBlockFocusStop,
	isInSameBlock,
	hasInnerBlocksContext,
	isInsideRootBlock,
	getBlockDOMNode,
	getBlockClientId,
} from '../../utils/dom';
import FocusCapture from './focus-capture';

/**
 * Browser constants
 */

const { getSelection, getComputedStyle } = window;

/**
 * Given an element, returns true if the element is a tabbable text field, or
 * false otherwise.
 *
 * @param {Element} element Element to test.
 *
 * @return {boolean} Whether element is a tabbable text field.
 */
const isTabbableTextField = overEvery( [
	isTextField,
	focus.tabbable.isTabbableIndex,
] );

/**
 * Returns true if the element should consider edge navigation upon a keyboard
 * event of the given directional key code, or false otherwise.
 *
 * @param {Element} element     HTML element to test.
 * @param {number}  keyCode     KeyboardEvent keyCode to test.
 * @param {boolean} hasModifier Whether a modifier is pressed.
 *
 * @return {boolean} Whether element should consider edge navigation.
 */
export function isNavigationCandidate( element, keyCode, hasModifier ) {
	const isVertical = keyCode === UP || keyCode === DOWN;

	// Currently, all elements support unmodified vertical navigation.
	if ( isVertical && ! hasModifier ) {
		return true;
	}

	// Native inputs should not navigate horizontally.
	const { tagName } = element;
	return tagName !== 'INPUT' && tagName !== 'TEXTAREA';
}

/**
 * Returns the optimal tab target from the given focused element in the
 * desired direction. A preference is made toward text fields, falling back
 * to the block focus stop if no other candidates exist for the block.
 *
 * @param {Element} target           Currently focused text field.
 * @param {boolean} isReverse        True if considering as the first field.
 * @param {Element} containerElement Element containing all blocks.
 *
 * @return {?Element} Optimal tab target, if one exists.
 */
export function getClosestTabbable( target, isReverse, containerElement ) {
	// Since the current focus target is not guaranteed to be a text field,
	// find all focusables. Tabbability is considered later.
	let focusableNodes = focus.focusable.find( containerElement );

	if ( isReverse ) {
		focusableNodes = reverse( focusableNodes );
	}

	// Consider as candidates those focusables after the current target.
	// It's assumed this can only be reached if the target is focusable
	// (on its keydown event), so no need to verify it exists in the set.
	focusableNodes = focusableNodes.slice(
		focusableNodes.indexOf( target ) + 1
	);

	function isTabCandidate( node, i, array ) {
		// Not a candidate if the node is not tabbable.
		if ( ! focus.tabbable.isTabbableIndex( node ) ) {
			return false;
		}

		// Prefer text fields...
		if ( isTextField( node ) ) {
			return true;
		}

		// ...but settle for block focus stop.
		if ( ! isBlockFocusStop( node ) ) {
			return false;
		}

		// If element contains inner blocks, stop immediately at its focus
		// wrapper.
		if ( hasInnerBlocksContext( node ) ) {
			return true;
		}

		// If navigating out of a block (in reverse), don't consider its
		// block focus stop.
		if ( node.contains( target ) ) {
			return false;
		}

		// In case of block focus stop, check to see if there's a better
		// text field candidate within.
		for (
			let offset = 1, nextNode;
			( nextNode = array[ i + offset ] );
			offset++
		) {
			// Abort if no longer testing descendents of focus stop.
			if ( ! node.contains( nextNode ) ) {
				break;
			}

			// Apply same tests by recursion. This is important to consider
			// nestable blocks where we don't want to settle for the inner
			// block focus stop.
			if ( isTabCandidate( nextNode, i + offset, array ) ) {
				return false;
			}
		}

		return true;
	}

	return find( focusableNodes, isTabCandidate );
}

function selector( select ) {
	const {
		getSelectedBlockClientId,
		getMultiSelectedBlocksStartClientId,
		getMultiSelectedBlocksEndClientId,
		getPreviousBlockClientId,
		getNextBlockClientId,
		getFirstMultiSelectedBlockClientId,
		getLastMultiSelectedBlockClientId,
		hasMultiSelection,
		getBlockOrder,
		isNavigationMode,
		isSelectionEnabled,
		getBlockSelectionStart,
		isMultiSelecting,
	} = select( 'core/block-editor' );

	const selectedBlockClientId = getSelectedBlockClientId();
	const selectionStartClientId = getMultiSelectedBlocksStartClientId();
	const selectionEndClientId = getMultiSelectedBlocksEndClientId();

	return {
		selectedBlockClientId,
		selectionStartClientId,
		selectionBeforeEndClientId: getPreviousBlockClientId(
			selectionEndClientId || selectedBlockClientId
		),
		selectionAfterEndClientId: getNextBlockClientId(
			selectionEndClientId || selectedBlockClientId
		),
		selectedFirstClientId: getFirstMultiSelectedBlockClientId(),
		selectedLastClientId: getLastMultiSelectedBlockClientId(),
		hasMultiSelection: hasMultiSelection(),
		blocks: getBlockOrder(),
		isNavigationMode: isNavigationMode(),
		isSelectionEnabled: isSelectionEnabled(),
		blockSelectionStart: getBlockSelectionStart(),
		isMultiSelecting: isMultiSelecting(),
	};
}

/**
 * Handles selection and navigation across blocks. This component should be
 * wrapped around BlockList.
 */
export default function WritingFlow( { children } ) {
	const container = useRef();
	const focusCaptureBeforeRef = useRef();
	const focusCaptureAfterRef = useRef();
	const multiSelectionContainer = useRef();

	const entirelySelected = useRef();

	// Reference that holds the a flag for enabling or disabling
	// capturing on the focus capture elements.
	const noCapture = useRef();

	// Here a DOMRect is stored while moving the caret vertically so vertical
	// position of the start position can be restored. This is to recreate
	// browser behaviour across blocks.
	const verticalRect = useRef();

	const {
		selectedBlockClientId,
		selectionStartClientId,
		selectionBeforeEndClientId,
		selectionAfterEndClientId,
		selectedFirstClientId,
		selectedLastClientId,
		hasMultiSelection,
		blocks,
		isNavigationMode,
		isSelectionEnabled,
		blockSelectionStart,
		isMultiSelecting,
	} = useSelect( selector, [] );
	const {
		multiSelect,
		selectBlock,
		clearSelectedBlock,
		setNavigationMode,
	} = useDispatch( 'core/block-editor' );

	function onMouseDown( event ) {
		verticalRect.current = null;

		// Clicking inside a selected block should exit navigation mode.
		if (
			isNavigationMode &&
			selectedBlockClientId &&
			isInsideRootBlock(
				getBlockDOMNode( selectedBlockClientId ),
				event.target
			)
		) {
			setNavigationMode( false );
		}

		// Multi-select blocks when Shift+clicking.
		if (
			isSelectionEnabled &&
			// The main button.
			// https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
			event.button === 0
		) {
			const clientId = getBlockClientId( event.target );

			if ( clientId ) {
				if ( event.shiftKey ) {
					if ( blockSelectionStart !== clientId ) {
						multiSelect( blockSelectionStart, clientId );
						event.preventDefault();
					}
					// Allow user to escape out of a multi-selection to a singular
					// selection of a block via click. This is handled here since
					// focus handling excludes blocks when there is multiselection,
					// as focus can be incurred by starting a multiselection (focus
					// moved to first block's multi-controls).
				} else if ( hasMultiSelection ) {
					selectBlock( clientId );
				}
			}
		}
	}

	function expandSelection( isReverse ) {
		const nextSelectionEndClientId = isReverse
			? selectionBeforeEndClientId
			: selectionAfterEndClientId;

		if ( nextSelectionEndClientId ) {
			multiSelect(
				selectionStartClientId || selectedBlockClientId,
				nextSelectionEndClientId
			);
		}
	}

	function moveSelection( isReverse ) {
		const focusedBlockClientId = isReverse
			? selectedFirstClientId
			: selectedLastClientId;

		if ( focusedBlockClientId ) {
			selectBlock( focusedBlockClientId );
		}
	}

	/**
	 * Returns true if the given target field is the last in its block which
	 * can be considered for tab transition. For example, in a block with two
	 * text fields, this would return true when reversing from the first of the
	 * two fields, but false when reversing from the second.
	 *
	 * @param {Element} target    Currently focused text field.
	 * @param {boolean} isReverse True if considering as the first field.
	 *
	 * @return {boolean} Whether field is at edge for tab transition.
	 */
	function isTabbableEdge( target, isReverse ) {
		const closestTabbable = getClosestTabbable(
			target,
			isReverse,
			container.current
		);
		return ! closestTabbable || ! isInSameBlock( target, closestTabbable );
	}

	function onKeyDown( event ) {
		const { keyCode, target } = event;
		const isUp = keyCode === UP;
		const isDown = keyCode === DOWN;
		const isLeft = keyCode === LEFT;
		const isRight = keyCode === RIGHT;
		const isTab = keyCode === TAB;
		const isEscape = keyCode === ESCAPE;
		const isReverse = isUp || isLeft;
		const isHorizontal = isLeft || isRight;
		const isVertical = isUp || isDown;
		const isNav = isHorizontal || isVertical;
		const isShift = event.shiftKey;
		const hasModifier =
			isShift || event.ctrlKey || event.altKey || event.metaKey;
		const isNavEdge = isVertical ? isVerticalEdge : isHorizontalEdge;

		// In navigation mode, tab and arrows navigate from block to block.
		if ( isNavigationMode ) {
			const navigateUp = ( isTab && isShift ) || isUp;
			const navigateDown = ( isTab && ! isShift ) || isDown;
			const focusedBlockUid = navigateUp
				? selectionBeforeEndClientId
				: selectionAfterEndClientId;

			if ( navigateDown || navigateUp ) {
				if ( focusedBlockUid ) {
					event.preventDefault();
					selectBlock( focusedBlockUid );
				} else if ( isTab && selectedBlockClientId ) {
					const wrapper = getBlockDOMNode( selectedBlockClientId );
					let nextTabbable;

					if ( navigateDown ) {
						nextTabbable = focus.tabbable.findNext( wrapper );
					} else {
						nextTabbable = focus.tabbable.findPrevious( wrapper );
					}

					if ( nextTabbable ) {
						event.preventDefault();
						nextTabbable.focus();
						clearSelectedBlock();
					}
				}
			}

			return;
		}

		// In Edit mode, Tab should focus the first tabbable element after the
		// content, which is normally the sidebar (with block controls) and
		// Shift+Tab should focus the first tabbable element before the content,
		// which is normally the block toolbar.
		// Arrow keys can be used, and Tab and arrow keys can be used in
		// Navigation mode (press Esc), to navigate through blocks.
		if ( selectedBlockClientId ) {
			if ( isTab ) {
				const wrapper = getBlockDOMNode( selectedBlockClientId );

				if ( isShift ) {
					if ( target === wrapper ) {
						// Disable focus capturing on the focus capture element, so
						// it doesn't refocus this block and so it allows default
						// behaviour (moving focus to the next tabbable element).
						noCapture.current = true;
						focusCaptureBeforeRef.current.focus();
						return;
					}
				} else {
					const tabbables = focus.tabbable.find( wrapper );
					const lastTabbable = last( tabbables ) || wrapper;

					if ( target === lastTabbable ) {
						// See comment above.
						noCapture.current = true;
						focusCaptureAfterRef.current.focus();
						return;
					}
				}
			} else if ( isEscape ) {
				setNavigationMode( true );
			}
		} else if (
			hasMultiSelection &&
			isTab &&
			target === multiSelectionContainer.current
		) {
			// See comment above.
			noCapture.current = true;

			if ( isShift ) {
				focusCaptureBeforeRef.current.focus();
			} else {
				focusCaptureAfterRef.current.focus();
			}

			return;
		}

		// When presing any key other than up or down, the initial vertical
		// position must ALWAYS be reset. The vertical position is saved so it
		// can be restored as well as possible on sebsequent vertical arrow key
		// presses. It may not always be possible to restore the exact same
		// position (such as at an empty line), so it wouldn't be good to
		// compute the position right before any vertical arrow key press.
		if ( ! isVertical ) {
			verticalRect.current = null;
		} else if ( ! verticalRect.current ) {
			verticalRect.current = computeCaretRect();
		}

		// This logic inside this condition needs to be checked before
		// the check for event.nativeEvent.defaultPrevented.
		// The logic handles meta+a keypress and this event is default prevented
		// by RichText.
		if ( ! isNav ) {
			// Set immediately before the meta+a combination can be pressed.
			if ( isKeyboardEvent.primary( event ) ) {
				entirelySelected.current = isEntirelySelected( target );
			}

			if ( isKeyboardEvent.primary( event, 'a' ) ) {
				// When the target is contentEditable, selection will already
				// have been set by the browser earlier in this call stack. We
				// need check the previous result, otherwise all blocks will be
				// selected right away.
				if (
					target.isContentEditable
						? entirelySelected.current
						: isEntirelySelected( target )
				) {
					multiSelect( first( blocks ), last( blocks ) );
					event.preventDefault();
				}

				// After pressing primary + A we can assume isEntirelySelected is true.
				// Calling right away isEntirelySelected after primary + A may still return false on some browsers.
				entirelySelected.current = true;
			}

			return;
		}

		// Abort if navigation has already been handled (e.g. RichText inline
		// boundaries).
		if ( event.nativeEvent.defaultPrevented ) {
			return;
		}

		// Abort if our current target is not a candidate for navigation (e.g.
		// preserve native input behaviors).
		if ( ! isNavigationCandidate( target, keyCode, hasModifier ) ) {
			return;
		}

		// In the case of RTL scripts, right means previous and left means next,
		// which is the exact reverse of LTR.
		const { direction } = getComputedStyle( target );
		const isReverseDir = direction === 'rtl' ? ! isReverse : isReverse;

		if ( isShift ) {
			if (
				// Ensure that there is a target block.
				( ( isReverse && selectionBeforeEndClientId ) ||
					( ! isReverse && selectionAfterEndClientId ) ) &&
				( hasMultiSelection ||
					( isTabbableEdge( target, isReverse ) &&
						isNavEdge( target, isReverse ) ) )
			) {
				// Shift key is down, and there is multi selection or we're at
				// the end of the current block.
				expandSelection( isReverse );
				event.preventDefault();
			}
		} else if ( hasMultiSelection ) {
			// Moving from block multi-selection to single block selection
			moveSelection( isReverse );
			event.preventDefault();
		} else if ( isVertical && isVerticalEdge( target, isReverse ) ) {
			const closestTabbable = getClosestTabbable(
				target,
				isReverse,
				container.current
			);

			if ( closestTabbable ) {
				placeCaretAtVerticalEdge(
					closestTabbable,
					isReverse,
					verticalRect.current
				);
				event.preventDefault();
			}
		} else if (
			isHorizontal &&
			getSelection().isCollapsed &&
			isHorizontalEdge( target, isReverseDir )
		) {
			const closestTabbable = getClosestTabbable(
				target,
				isReverseDir,
				container.current
			);
			placeCaretAtHorizontalEdge( closestTabbable, isReverseDir );
			event.preventDefault();
		}
	}

	function focusLastTextField() {
		const focusableNodes = focus.focusable.find( container.current );
		const target = findLast( focusableNodes, isTabbableTextField );
		if ( target ) {
			placeCaretAtHorizontalEdge( target, true );
		}
	}

	useEffect( () => {
		if ( hasMultiSelection && ! isMultiSelecting ) {
			multiSelectionContainer.current.focus();
		}
	}, [ hasMultiSelection, isMultiSelecting ] );

	const className = classnames( 'block-editor-writing-flow', {
		'is-navigate-mode': isNavigationMode,
	} );

	// Disable reason: Wrapper itself is non-interactive, but must capture
	// bubbling events from children to determine focus transition intents.
	/* eslint-disable jsx-a11y/no-static-element-interactions */
	return (
		<div className={ className }>
			<FocusCapture
				ref={ focusCaptureBeforeRef }
				selectedClientId={ selectedBlockClientId }
				containerRef={ container }
				noCapture={ noCapture }
				hasMultiSelection={ hasMultiSelection }
				multiSelectionContainer={ multiSelectionContainer }
			/>
			<div
				ref={ container }
				onKeyDown={ onKeyDown }
				onMouseDown={ onMouseDown }
			>
				<div
					ref={ multiSelectionContainer }
					tabIndex={ hasMultiSelection ? '0' : undefined }
					aria-label={
						hasMultiSelection
							? __( 'Multiple selected blocks' )
							: undefined
					}
					// Needs to be positioned within the viewport, so focus to this
					// element does not scroll the page.
					style={ { position: 'fixed' } }
				/>
				{ children }
			</div>
			<FocusCapture
				ref={ focusCaptureAfterRef }
				selectedClientId={ selectedBlockClientId }
				containerRef={ container }
				noCapture={ noCapture }
				hasMultiSelection={ hasMultiSelection }
				multiSelectionContainer={ multiSelectionContainer }
				isReverse
			/>
			<div
				aria-hidden
				tabIndex={ -1 }
				onClick={ focusLastTextField }
				className="block-editor-writing-flow__click-redirect"
			/>
		</div>
	);
	/* eslint-enable jsx-a11y/no-static-element-interactions */
}
