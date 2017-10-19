/**
 * WordPress dependencies
 */
import { Component } from 'element';
import { keycodes, focus } from '@wordpress/utils';
import { find, reverse } from 'lodash';
/**
 * Internal dependencies
 */
import {
	isHorizontalEdge,
	getVerticalEdge,
	placeCaretAtHorizontalEdge,
	placeCaretAtVerticalEdge,
} from '../utils/dom';

/**
 * Module Constants
 */
const { UP, DOWN, LEFT, RIGHT } = keycodes;

class WritingFlow extends Component {
	constructor() {
		super( ...arguments );

		this.onKeyDown = this.onKeyDown.bind( this );
		this.bindContainer = this.bindContainer.bind( this );

		this.verticalRect = null;
	}

	bindContainer( ref ) {
		this.container = ref;
	}

	getVisibleTabbables() {
		return focus.tabbable
			.find( this.container )
			.filter( ( node ) => (
				node.nodeName === 'INPUT' ||
				node.nodeName === 'TEXTAREA' ||
				node.contentEditable === 'true' ||
				node.classList.contains( 'editor-visual-editor__block-edit' )
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

	onKeyDown( event ) {
		const { keyCode, target } = event;
		const isUp = keyCode === UP;
		const isDown = keyCode === DOWN;
		const isLeft = keyCode === LEFT;
		const isRight = keyCode === RIGHT;
		const isReverse = isUp || isLeft;
		const isHorizontal = isLeft || isRight;
		const isVertical = isUp || isDown;

		if ( isVertical ) {
			const { rect, isEdge } = getVerticalEdge( target, isReverse );

			if ( rect && ! this.verticalRect ) {
				this.verticalRect = rect;
			}

			if ( ! isEdge ) {
				return;
			}

			const closestTabbable = this.getClosestTabbable( target, isReverse );

			if ( ! closestTabbable ) {
				return;
			}

			placeCaretAtVerticalEdge( closestTabbable, isReverse, this.verticalRect );
			event.preventDefault();
		} else {
			this.verticalRect = null;

			if ( ! isHorizontal || ! isHorizontalEdge( target, isReverse ) ) {
				return;
			}

			const closestTabbable = this.getClosestTabbable( target, isReverse );

			if ( ! closestTabbable ) {
				return;
			}

			placeCaretAtHorizontalEdge( closestTabbable, isReverse );
			event.preventDefault();
		}
	}

	render() {
		const { children } = this.props;

		return (
			<div
				ref={ this.bindContainer }
				onKeyDown={ this.onKeyDown }
				onMouseDown={ () => this.verticalRect = null }
			>
				{ children }
			</div>
		);
	}
}

export default WritingFlow;
