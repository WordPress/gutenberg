/**
 * External dependencies
 */
import { overEvery, find, findLast, reverse, get } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component, compose } from '@wordpress/element';
import {
	keycodes,
	focus,
	isTextField,
	computeCaretRect,
	isHorizontalEdge,
	isVerticalEdge,
	placeCaretAtHorizontalEdge,
	placeCaretAtVerticalEdge,
} from '@wordpress/utils';
import { withSelect, withDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import './style.scss';
import {
	isBlockFocusStop,
	isInSameBlock,
} from '../../utils/dom';

/**
 * Module Constants
 */

const { UP, DOWN, LEFT, RIGHT } = keycodes;

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

class WritingFlow extends Component {
	constructor() {
		super( ...arguments );

		this.onKeyDown = this.onKeyDown.bind( this );
		this.bindContainer = this.bindContainer.bind( this );
		this.clearVerticalRect = this.clearVerticalRect.bind( this );
		this.focusLastTextField = this.focusLastTextField.bind( this );

		/**
		 * Here a rectangle is stored while moving the caret vertically so
		 * vertical position of the start position can be restored.
		 * This is to recreate browser behaviour across blocks.
		 *
		 * @type {?DOMRect}
		 */
		this.verticalRect = null;
	}

	bindContainer( ref ) {
		this.container = ref;
	}

	clearVerticalRect() {
		this.verticalRect = null;
	}

	/**
	 * Returns the optimal tab target from the given focused element in the
	 * desired direction. A preference is made toward text fields, falling back
	 * to the block focus stop if no other candidates exist for the block.
	 *
	 * @param {Element} target    Currently focused text field.
	 * @param {boolean} isReverse True if considering as the first field.
	 *
	 * @return {?Element} Optimal tab target, if one exists.
	 */
	getClosestTabbable( target, isReverse ) {
		// Since the current focus target is not guaranteed to be a text field,
		// find all focusables. Tabbability is considered later.
		let focusableNodes = focus.focusable.find( this.container );

		if ( isReverse ) {
			focusableNodes = reverse( focusableNodes );
		}

		// Consider as candidates those focusables after the current target.
		// It's assumed this can only be reached if the target is focusable
		// (on its keydown event), so no need to verify it exists in the set.
		focusableNodes = focusableNodes.slice( focusableNodes.indexOf( target ) + 1 );

		function isTabCandidate( node, i, array ) {
			// Not a candidate if the node is not tabbable.
			if ( ! focus.tabbable.isTabbableIndex( node ) ) {
				return false;
			}

			// Prefer text fields, but settle for block focus stop.
			if ( ! isTextField( node ) && ! isBlockFocusStop( node ) ) {
				return false;
			}

			// If navigating out of a block (in reverse), don't consider its
			// block focus stop.
			if ( node.contains( target ) ) {
				return false;
			}

			// In case of block focus stop, check to see if there's a better
			// text field candidate within.
			for ( let offset = 1, nextNode; ( nextNode = array[ i + offset ] ); offset++ ) {
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

	expandSelection( currentStartUid, isReverse ) {
		const { previousBlockUid, nextBlockUid } = this.props;

		const expandedBlockUid = isReverse ? previousBlockUid : nextBlockUid;
		if ( expandedBlockUid ) {
			this.props.onMultiSelect( currentStartUid, expandedBlockUid );
		}
	}

	moveSelection( isReverse ) {
		const { previousBlockUid, nextBlockUid } = this.props;

		const focusedBlockUid = isReverse ? previousBlockUid : nextBlockUid;
		if ( focusedBlockUid ) {
			this.props.onSelectBlock( focusedBlockUid );
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
	isTabbableEdge( target, isReverse ) {
		const closestTabbable = this.getClosestTabbable( target, isReverse );
		return ! isInSameBlock( target, closestTabbable );
	}

	onKeyDown( event ) {
		const { selectedBlockUID, selectionStart, hasMultiSelection } = this.props;

		const { keyCode, target } = event;
		const isUp = keyCode === UP;
		const isDown = keyCode === DOWN;
		const isLeft = keyCode === LEFT;
		const isRight = keyCode === RIGHT;
		const isReverse = isUp || isLeft;
		const isHorizontal = isLeft || isRight;
		const isVertical = isUp || isDown;
		const isNav = isHorizontal || isVertical;
		const isShift = event.shiftKey;

		const isNavEdge = isVertical ? isVerticalEdge : isHorizontalEdge;

		if ( ! isVertical ) {
			this.verticalRect = null;
		} else if ( ! this.verticalRect ) {
			this.verticalRect = computeCaretRect( target );
		}

		if ( isNav && isShift && hasMultiSelection ) {
			// Shift key is down and existing block multi-selection
			event.preventDefault();
			this.expandSelection( selectionStart, isReverse );
		} else if ( isNav && isShift && this.isTabbableEdge( target, isReverse ) && isNavEdge( target, isReverse, true ) ) {
			// Shift key is down, but no existing block multi-selection
			event.preventDefault();
			this.expandSelection( selectedBlockUID, isReverse );
		} else if ( isNav && hasMultiSelection ) {
			// Moving from block multi-selection to single block selection
			event.preventDefault();
			this.moveSelection( isReverse );
		} else if ( isVertical && isVerticalEdge( target, isReverse, isShift ) ) {
			const closestTabbable = this.getClosestTabbable( target, isReverse );
			if ( closestTabbable ) {
				placeCaretAtVerticalEdge( closestTabbable, isReverse, this.verticalRect );
				event.preventDefault();
			}
		} else if ( isHorizontal && isHorizontalEdge( target, isReverse, isShift ) ) {
			const closestTabbable = this.getClosestTabbable( target, isReverse );
			placeCaretAtHorizontalEdge( closestTabbable, isReverse );
			event.preventDefault();
		}
	}

	/**
	 * Sets focus to the end of the last tabbable text field, if one exists.
	 */
	focusLastTextField() {
		const focusableNodes = focus.focusable.find( this.container );
		const target = findLast( focusableNodes, isTabbableTextField );
		if ( target ) {
			placeCaretAtHorizontalEdge( target, true );
		}
	}

	render() {
		const { children } = this.props;

		// Disable reason: Wrapper itself is non-interactive, but must capture
		// bubbling events from children to determine focus transition intents.
		/* eslint-disable jsx-a11y/no-static-element-interactions */
		return (
			<div className="editor-writing-flow">
				<div
					ref={ this.bindContainer }
					onKeyDown={ this.onKeyDown }
					onMouseDown={ this.clearVerticalRect }
				>
					{ children }
				</div>
				<div
					aria-hidden
					tabIndex={ -1 }
					onClick={ this.focusLastTextField }
					className="editor-writing-flow__click-redirect"
				/>
			</div>
		);
		/* eslint-disable jsx-a11y/no-static-element-interactions */
	}
}

export default compose( [
	withSelect( ( select ) => {
		const {
			getPreviousBlockUid,
			getNextBlockUid,
			getMultiSelectedBlocksStartUid,
			getMultiSelectedBlocks,
			getSelectedBlock,
		} = select( 'core/editor' );
		return {
			previousBlockUid: getPreviousBlockUid(),
			nextBlockUid: getNextBlockUid(),
			selectionStart: getMultiSelectedBlocksStartUid(),
			hasMultiSelection: getMultiSelectedBlocks().length > 1,
			selectedBlockUID: get( getSelectedBlock(), [ 'uid' ] ),
		};
	} ),
	withDispatch( ( dispatch ) =>{
		const { multiSelect, selectBlock } = dispatch( 'core/editor' );
		return {
			onMultiSelect: multiSelect,
			onSelectBlock: selectBlock,
		};
	} ),
] )( WritingFlow );
