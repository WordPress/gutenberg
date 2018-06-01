/**
 * External dependencies
 */
import { overEvery, find, findLast, reverse, first, last } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component, compose } from '@wordpress/element';
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
import { keycodes } from '@wordpress/utils';
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
const { UP, DOWN, LEFT, RIGHT, TAB, isKeyboardEvent } = keycodes;

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
		this.bindAppender = this.bindAppender.bind( this );
		this.clearVerticalRect = this.clearVerticalRect.bind( this );
		this.focusLastTextField = this.focusLastTextField.bind( this );
		this.swithToEditMode = this.swithToEditMode.bind( this );

		this.lastClientY = null;
		this.lastClientX = null;

		/**
		 * Here a rectangle is stored while moving the caret vertically so
		 * vertical position of the start position can be restored.
		 * This is to recreate browser behaviour across blocks.
		 *
		 * @type {?DOMRect}
		 */
		this.verticalRect = null;
	}

	componentDidMount() {
		window.addEventListener( 'mousemove', this.swithToEditMode );
	}

	componentWillUnmount() {
		window.removeEventListener( 'mousemove', this.swithToEditMode );
	}

	swithToEditMode( { clientY, clientX } ) {
		// Safari triggers mousemove even if we didn't really move the mouse
		// On shift press for instance.
		// To ensure we really moved the mouse, we compare the mouse position
		if ( this.props.keyboardMode !== 'edit' &&
			( this.lastClientX !== null && this.lastClientY !== null ) &&
			( clientY !== this.lastClientY || clientX !== this.lastClientX )
		) {
			this.props.setKeyboardMode( 'edit' );
		}
		this.lastClientY = clientY;
		this.lastClientX = clientX;
	}

	bindContainer( ref ) {
		this.container = ref;
	}

	bindAppender( ref ) {
		this.appender = ref;
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

	expandSelection( isReverse ) {
		const {
			selectedBlockUID,
			selectionStartUID,
			selectionBeforeEndUID,
			selectionAfterEndUID,
		} = this.props;

		const nextSelectionEndUID = isReverse ? selectionBeforeEndUID : selectionAfterEndUID;

		if ( nextSelectionEndUID ) {
			this.props.onMultiSelect( selectionStartUID || selectedBlockUID, nextSelectionEndUID );
		}
	}

	moveSelection( isReverse ) {
		const { selectedFirstUid, selectedLastUid } = this.props;

		const focusedBlockUid = isReverse ? selectedFirstUid : selectedLastUid;

		if ( focusedBlockUid ) {
			this.props.onSelectBlock( focusedBlockUid );
			return true;
		}

		return false;
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
		return ! closestTabbable || ! isInSameBlock( target, closestTabbable );
	}

	onKeyDown( event ) {
		const { hasMultiSelection, onMultiSelect, blocks, keyboardMode, nextBlockUid, previousBlockUid, selectedBlockUID } = this.props;
		// selectedBlockUID, selectionStart, hasMultiSelection, keyboardMode, nextBlockUid, previousBlockUid
		const { keyCode, target } = event;

		// In navigation mode, tab and arrows navigate from block to blocks
		if ( keyboardMode === 'navigation' ) {
			const navigateUp = ( keyCode === TAB && event.shiftKey ) || keyCode === UP;
			const navigateDown = ( keyCode === TAB && ! event.shiftKey ) || keyCode === DOWN;

			if ( ( navigateDown && nextBlockUid ) || ( navigateUp && previousBlockUid ) ) {
				event.preventDefault();
				const focusedBlockUid = navigateUp ? previousBlockUid : nextBlockUid;
				if ( focusedBlockUid ) {
					this.props.onSelectBlock( focusedBlockUid );
				}
			}

			// Special case when reaching the end of the blocks (navigate to the next tabbable outside of the writing flow)
			if ( navigateDown && selectedBlockUID && ! nextBlockUid && [ UP, DOWN ].indexOf( keyCode ) === -1 ) {
				this.props.clearSelectedBlock();
				this.appender.focus();
			}
			return;
		}

		// In edit mode, tab is kept natural and arrows navigate the cursor
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

		if ( ! isNav ) {
			// Set immediately before the meta+a combination can be pressed.
			if ( isKeyboardEvent.primary( event ) ) {
				this.isEntirelySelected = isEntirelySelected( target );
			}

			if ( isKeyboardEvent.primary( event, 'a' ) ) {
				// When the target is contentEditable, selection will already
				// have been set by TinyMCE earlier in this call stack. We need
				// check the previous result, otherwise all blocks will be
				// selected right away.
				if ( target.isContentEditable ? this.isEntirelySelected : isEntirelySelected( target ) ) {
					onMultiSelect( first( blocks ), last( blocks ) );
					event.preventDefault();
				}

				// Set in case the meta key doesn't get released.
				this.isEntirelySelected = isEntirelySelected( target );
			}

			return;
		}

		if ( isShift && ( hasMultiSelection || (
			this.isTabbableEdge( target, isReverse ) &&
			isNavEdge( target, isReverse, true )
		) ) ) {
			// Shift key is down, and there is multi selection or we're at the end of the current block.
			this.expandSelection( isReverse );
			event.preventDefault();
		} else if ( hasMultiSelection ) {
			// Moving from block multi-selection to single block selection
			this.moveSelection( isReverse );
			event.preventDefault();
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
					ref={ this.bindAppender }
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
			getSelectedBlockUID,
			getMultiSelectedBlocksStartUid,
			getMultiSelectedBlocksEndUid,
			getPreviousBlockUid,
			getNextBlockUid,
			getFirstMultiSelectedBlockUid,
			getLastMultiSelectedBlockUid,
			hasMultiSelection,
			getBlockOrder,
			getKeyboardMode,
		} = select( 'core/editor' );

		const selectedBlockUID = getSelectedBlockUID();
		const selectionStartUID = getMultiSelectedBlocksStartUid();
		const selectionEndUID = getMultiSelectedBlocksEndUid();

		return {
			selectedBlockUID,
			selectionStartUID,
			selectionBeforeEndUID: getPreviousBlockUid( selectionEndUID || selectedBlockUID ),
			selectionAfterEndUID: getNextBlockUid( selectionEndUID || selectedBlockUID ),
			nextBlockUid: getNextBlockUid( selectionEndUID || selectedBlockUID ),
			previousBlockUid: getPreviousBlockUid( selectionStartUID || selectedBlockUID ),
			selectedFirstUid: getFirstMultiSelectedBlockUid(),
			selectedLastUid: getLastMultiSelectedBlockUid(),
			hasMultiSelection: hasMultiSelection(),
			blocks: getBlockOrder(),
			keyboardMode: getKeyboardMode(),
		};
	} ),
	withDispatch( ( dispatch ) => {
		const {
			multiSelect,
			selectBlock,
			clearSelectedBlock,
			setKeyboardMode,
		} = dispatch( 'core/editor' );
		return {
			onMultiSelect: multiSelect,
			onSelectBlock: selectBlock,
			clearSelectedBlock,
			setKeyboardMode,
		};
	} ),
] )( WritingFlow );
