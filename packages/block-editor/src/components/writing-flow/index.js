/**
 * External dependencies
 */
import { find, reverse, first, last } from 'lodash';

/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';
import {
	computeCaretRect,
	focus,
	isHorizontalEdge,
	isVerticalEdge,
	placeCaretAtHorizontalEdge,
	placeCaretAtVerticalEdge,
	isEntirelySelected,
	isRTL,
} from '@wordpress/dom';
import { UP, DOWN, LEFT, RIGHT, isKeyboardEvent } from '@wordpress/keycodes';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { useMergeRefs } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { isInSameBlock } from '../../utils/dom';
import useMultiSelection from './use-multi-selection';
import useTabNav from './use-tab-nav';
import { store as blockEditorStore } from '../../store';

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
 * @param {boolean} onlyVertical     Whether to only consider tabbable elements
 *                                   that are visually above or under the
 *                                   target.
 *
 * @return {?Element} Optimal tab target, if one exists.
 */
export function getClosestTabbable(
	target,
	isReverse,
	containerElement,
	onlyVertical
) {
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

	let targetRect;

	if ( onlyVertical ) {
		targetRect = target.getBoundingClientRect();
	}

	function isTabCandidate( node ) {
		// Not a candidate if the node is not tabbable.
		if ( ! focus.tabbable.isTabbableIndex( node ) ) {
			return false;
		}

		// Skip focusable elements such as links within content editable nodes.
		if ( node.isContentEditable && node.contentEditable !== 'true' ) {
			return false;
		}

		if ( onlyVertical ) {
			const nodeRect = node.getBoundingClientRect();

			if (
				nodeRect.left >= targetRect.right ||
				nodeRect.right <= targetRect.left
			) {
				return false;
			}
		}

		return true;
	}

	return find( focusableNodes, isTabCandidate );
}

/**
 * Handles selection and navigation across blocks. This component should be
 * wrapped around BlockList.
 *
 * @param {Object}    props          Component properties.
 * @param {WPElement} props.children Children to be rendered.
 */
export default function WritingFlow( { children } ) {
	const container = useRef();
	const entirelySelected = useRef();

	// Here a DOMRect is stored while moving the caret vertically so vertical
	// position of the start position can be restored. This is to recreate
	// browser behaviour across blocks.
	const verticalRect = useRef();

	const hasMultiSelection = useSelect(
		( select ) => select( blockEditorStore ).hasMultiSelection(),
		[]
	);
	const {
		getSelectedBlockClientId,
		getMultiSelectedBlocksStartClientId,
		getMultiSelectedBlocksEndClientId,
		getPreviousBlockClientId,
		getNextBlockClientId,
		getFirstMultiSelectedBlockClientId,
		getLastMultiSelectedBlockClientId,
		getBlockOrder,
		getSettings,
	} = useSelect( blockEditorStore );
	const { multiSelect, selectBlock } = useDispatch( blockEditorStore );

	function onMouseDown() {
		verticalRect.current = null;
	}

	function expandSelection( isReverse ) {
		const selectedBlockClientId = getSelectedBlockClientId();
		const selectionStartClientId = getMultiSelectedBlocksStartClientId();
		const selectionEndClientId = getMultiSelectedBlocksEndClientId();
		const selectionBeforeEndClientId = getPreviousBlockClientId(
			selectionEndClientId || selectedBlockClientId
		);
		const selectionAfterEndClientId = getNextBlockClientId(
			selectionEndClientId || selectedBlockClientId
		);
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
		const selectedFirstClientId = getFirstMultiSelectedBlockClientId();
		const selectedLastClientId = getLastMultiSelectedBlockClientId();
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

		// Handle only if the event occurred within the same DOM hierarchy as
		// the rendered container. This is used to distinguish between events
		// which bubble through React's virtual event system from those which
		// strictly occur in the DOM created by the component.
		//
		// The implication here is: If it's not desirable for a bubbled event to
		// be considered by WritingFlow, it can be avoided by rendering to a
		// distinct place in the DOM (e.g. using Slot/Fill).
		if ( ! container.current.contains( target ) ) {
			return;
		}

		const isUp = keyCode === UP;
		const isDown = keyCode === DOWN;
		const isLeft = keyCode === LEFT;
		const isRight = keyCode === RIGHT;
		const isReverse = isUp || isLeft;
		const isHorizontal = isLeft || isRight;
		const isVertical = isUp || isDown;
		const isNav = isHorizontal || isVertical;
		const isShift = event.shiftKey;
		const hasModifier =
			isShift || event.ctrlKey || event.altKey || event.metaKey;
		const isNavEdge = isVertical ? isVerticalEdge : isHorizontalEdge;
		const { ownerDocument } = container.current;
		const { defaultView } = ownerDocument;

		if ( hasMultiSelection ) {
			if ( isNav ) {
				const action = isShift ? expandSelection : moveSelection;
				action( isReverse );
				event.preventDefault();
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
			verticalRect.current = computeCaretRect( defaultView );
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
					const blocks = getBlockOrder();
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
		const isReverseDir = isRTL( target ) ? ! isReverse : isReverse;
		const { keepCaretInsideBlock } = getSettings();

		if ( isShift ) {
			const selectedBlockClientId = getSelectedBlockClientId();
			const selectionEndClientId = getMultiSelectedBlocksEndClientId();
			const selectionBeforeEndClientId = getPreviousBlockClientId(
				selectionEndClientId || selectedBlockClientId
			);
			const selectionAfterEndClientId = getNextBlockClientId(
				selectionEndClientId || selectedBlockClientId
			);

			if (
				// Ensure that there is a target block.
				( ( isReverse && selectionBeforeEndClientId ) ||
					( ! isReverse && selectionAfterEndClientId ) ) &&
				isTabbableEdge( target, isReverse ) &&
				isNavEdge( target, isReverse )
			) {
				// Shift key is down, and there is multi selection or we're at
				// the end of the current block.
				expandSelection( isReverse );
				event.preventDefault();
			}
		} else if (
			isVertical &&
			isVerticalEdge( target, isReverse ) &&
			! keepCaretInsideBlock
		) {
			const closestTabbable = getClosestTabbable(
				target,
				isReverse,
				container.current,
				true
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
			defaultView.getSelection().isCollapsed &&
			isHorizontalEdge( target, isReverseDir ) &&
			! keepCaretInsideBlock
		) {
			const closestTabbable = getClosestTabbable(
				target,
				isReverseDir,
				container.current
			);
			placeCaretAtHorizontalEdge( closestTabbable, isReverse );
			event.preventDefault();
		}
	}

	const [ before, ref, after ] = useTabNav();

	// Disable reason: Wrapper itself is non-interactive, but must capture
	// bubbling events from children to determine focus transition intents.
	/* eslint-disable jsx-a11y/no-static-element-interactions */
	return (
		<>
			{ before }
			<div
				ref={ useMergeRefs( [ ref, container, useMultiSelection() ] ) }
				className="block-editor-writing-flow"
				onKeyDown={ onKeyDown }
				onMouseDown={ onMouseDown }
				tabIndex={ hasMultiSelection ? '0' : undefined }
				aria-label={
					hasMultiSelection
						? __( 'Multiple selected blocks' )
						: undefined
				}
			>
				{ children }
			</div>
			{ after }
		</>
	);
	/* eslint-enable jsx-a11y/no-static-element-interactions */
}
