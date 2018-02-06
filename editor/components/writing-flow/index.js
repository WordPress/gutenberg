/**
 * External dependencies
 */
import { connect } from 'react-redux';
import 'element-closest';
import { find, last, reverse } from 'lodash';
/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { keycodes, focus } from '@wordpress/utils';

/**
 * Internal dependencies
 */
import { BlockListBlock } from '../block-list/block';
import {
	computeCaretRect,
	isHorizontalEdge,
	isVerticalEdge,
	placeCaretAtHorizontalEdge,
	placeCaretAtVerticalEdge,
} from '../../utils/dom';
import {
	getPreviousBlock,
	getNextBlock,
	getMultiSelectedBlocksStartUid,
	getMultiSelectedBlocksEndUid,
	getMultiSelectedBlocks,
	getSelectedBlock,
} from '../../store/selectors';
import { multiSelect, appendDefaultBlock, focusBlock } from '../../store/actions';

/**
 * Module Constants
 */
const { UP, DOWN, LEFT, RIGHT } = keycodes;

function isElementNonEmpty( el ) {
	return !! el.innerText.trim();
}

class WritingFlow extends Component {
	constructor() {
		super( ...arguments );

		this.onKeyDown = this.onKeyDown.bind( this );
		this.bindContainer = this.bindContainer.bind( this );
		this.clearVerticalRect = this.clearVerticalRect.bind( this );
		this.verticalRect = null;
	}

	bindContainer( ref ) {
		this.container = ref;
	}

	clearVerticalRect() {
		this.verticalRect = null;
	}

	getEditables( target ) {
		const outer = target.closest( '.editor-block-list__block-edit' );
		if ( ! outer || target === outer ) {
			return [ target ];
		}

		const elements = outer.querySelectorAll( '[contenteditable="true"]' );
		return [ ...elements ];
	}

	getVisibleTabbables() {
		return focus.tabbable
			.find( this.container )
			.filter( ( node ) => (
				node.nodeName === 'INPUT' ||
				node.nodeName === 'TEXTAREA' ||
				node.contentEditable === 'true' ||
				node.classList.contains( 'editor-block-list__block-edit' )
			) );
	}

	getClosestTabbable( target, isReverse ) {
		let focusableNodes = this.getVisibleTabbables();

		if ( isReverse ) {
			focusableNodes = reverse( focusableNodes );
		}

		focusableNodes = focusableNodes.slice( focusableNodes.indexOf( target ) );

		return find( focusableNodes, ( node, i, array ) => {
			if ( node.contains( target ) ) {
				return false;
			}

			const nextNode = array[ i + 1 ];

			// Skip node if it contains a focusable node.
			if ( nextNode && node.contains( nextNode ) ) {
				return false;
			}

			return true;
		} );
	}

	isInLastNonEmptyBlock( target ) {
		const tabbables = this.getVisibleTabbables();

		// Find last tabbable, compare with target
		const lastTabbable = last( tabbables );
		if ( ! lastTabbable || ! lastTabbable.contains( target ) ) {
			return false;
		}

		// Find block-level ancestor of said last tabbable
		const blockEl = lastTabbable.closest( '.' + BlockListBlock.className );
		const blockIndex = tabbables.indexOf( blockEl );

		// Unexpected, so we'll leave quietly.
		if ( blockIndex === -1 ) {
			return false;
		}

		// Maybe there are no descendants, and the target is the block itself?
		if ( lastTabbable === blockEl ) {
			return isElementNonEmpty( blockEl );
		}

		// Otherwise, find the descendants of the ancestor, i.e. the target and
		// its siblings, and check them instead.
		return tabbables
			.slice( blockIndex + 1 )
			.some( ( el ) =>
				blockEl.contains( el ) && isElementNonEmpty( el ) );
	}

	expandSelection( currentStartUid, isReverse ) {
		const { previousBlock, nextBlock } = this.props;

		const expandedBlock = isReverse ? previousBlock : nextBlock;
		if ( expandedBlock ) {
			this.props.onMultiSelect( currentStartUid, expandedBlock.uid );
		}
	}

	moveSelection( currentUid, isReverse ) {
		const { previousBlock, nextBlock } = this.props;

		const focusedBlock = isReverse ? previousBlock : nextBlock;
		if ( focusedBlock ) {
			this.props.onFocusBlock( focusedBlock.uid );
		}
	}

	isEditableEdge( moveUp, target ) {
		const editables = this.getEditables( target );
		const index = editables.indexOf( target );
		const edgeIndex = moveUp ? 0 : editables.length - 1;
		return editables.length > 0 && index === edgeIndex;
	}

	onKeyDown( event ) {
		const { selectedBlock, selectionStart, selectionEnd, hasMultiSelection } = this.props;

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
			// Shift key is down and existing block selection
			event.preventDefault();
			this.expandSelection( selectionStart, isReverse );
		} else if ( isNav && isShift && this.isEditableEdge( isReverse, target ) && isNavEdge( target, isReverse, true ) ) {
			// Shift key is down, but no existing block selection
			event.preventDefault();
			this.expandSelection( selectedBlock.uid, isReverse );
		} else if ( isNav && hasMultiSelection ) {
			// Moving from multi block selection to single block selection
			event.preventDefault();
			this.moveSelection( selectionEnd, isReverse );
		} else if ( isVertical && isVerticalEdge( target, isReverse, isShift ) ) {
			const closestTabbable = this.getClosestTabbable( target, isReverse );
			placeCaretAtVerticalEdge( closestTabbable, isReverse, this.verticalRect );
			event.preventDefault();
		} else if ( isHorizontal && isHorizontalEdge( target, isReverse, isShift ) ) {
			const closestTabbable = this.getClosestTabbable( target, isReverse );
			placeCaretAtHorizontalEdge( closestTabbable, isReverse );
			event.preventDefault();
		}

		if ( isDown && ! isShift && ! hasMultiSelection &&
				this.isInLastNonEmptyBlock( target ) &&
				isVerticalEdge( target, false, false )
		) {
			this.props.onBottomReached();
		}
	}

	render() {
		const { children } = this.props;

		// Disable reason: Wrapper itself is non-interactive, but must capture
		// bubbling events from children to determine focus transition intents.
		/* eslint-disable jsx-a11y/no-static-element-interactions */
		return (
			<div
				ref={ this.bindContainer }
				onKeyDown={ this.onKeyDown }
				onMouseDown={ this.clearVerticalRect }
			>
				{ children }
			</div>
		);
		/* eslint-disable jsx-a11y/no-static-element-interactions */
	}
}

export default connect(
	( state ) => ( {
		previousBlock: getPreviousBlock( state ),
		nextBlock: getNextBlock( state ),
		selectionStart: getMultiSelectedBlocksStartUid( state ),
		selectionEnd: getMultiSelectedBlocksEndUid( state ),
		hasMultiSelection: getMultiSelectedBlocks( state ).length > 1,
		selectedBlock: getSelectedBlock( state ),
	} ),
	{
		onMultiSelect: multiSelect,
		onBottomReached: appendDefaultBlock,
		onFocusBlock: focusBlock,
	}
)( WritingFlow );
