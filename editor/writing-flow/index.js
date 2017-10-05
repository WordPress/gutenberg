/**
 * WordPress dependencies
 */
import { Component } from 'element';
import { keycodes, focus } from '@wordpress/utils';

/**
 * Internal dependencies
 */
import { isEdge, placeCaretAtEdge } from '../utils/dom';

/**
 * Module Constants
 */
const { UP, DOWN, LEFT, RIGHT } = keycodes;

class WritingFlow extends Component {
	constructor() {
		super( ...arguments );

		this.onKeyDown = this.onKeyDown.bind( this );
		this.onKeyUp = this.onKeyUp.bind( this );
		this.bindContainer = this.bindContainer.bind( this );

		this.shouldMove = false;
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
				node.classList.contains( 'editor-visual-editor__block' )
			) );
	}

	moveFocusInContainer( target, direction = 'UP' ) {
		const focusableNodes = this.getVisibleTabbables();
		if ( direction === 'UP' ) {
			focusableNodes.reverse();
		}

		const targetNode = focusableNodes
			.slice( focusableNodes.indexOf( target ) )
			.reduce( ( result, node ) => {
				return result || ( node.contains( target ) ? null : node );
			}, null );

		if ( targetNode ) {
			placeCaretAtEdge( targetNode, direction === 'DOWN' );
		}
	}

	onKeyDown( event ) {
		const { keyCode, target } = event;
		const moveUp = ( keyCode === UP || keyCode === LEFT );
		const moveDown = ( keyCode === DOWN || keyCode === RIGHT );

		if ( ( moveUp || moveDown ) && isEdge( target, moveUp ) ) {
			event.preventDefault();
			this.shouldMove = true;
		}
	}

	onKeyUp( event ) {
		const { keyCode, target } = event;
		const moveUp = ( keyCode === UP || keyCode === LEFT );

		if ( this.shouldMove ) {
			event.preventDefault();
			this.moveFocusInContainer( target, moveUp ? 'UP' : 'DOWN' );
			this.shouldMove = false;
		}
	}

	render() {
		const { children } = this.props;

		return (
			<div
				ref={ this.bindContainer }
				onKeyDown={ this.onKeyDown }
				onKeyUp={ this.onKeyUp }
			>
				{ children }
			</div>
		);
	}
}

export default WritingFlow;
