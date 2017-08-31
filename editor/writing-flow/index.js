/**
 * WordPress dependencies
 */
import { Component } from 'element';
import { keycodes } from '@wordpress/utils';

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
		this.zones = [];
		this.onKeyDown = this.onKeyDown.bind( this );
		this.onKeyUp = this.onKeyUp.bind( this );
		this.bindContainer = this.bindContainer.bind( this );
		this.state = {
			shouldMove: false,
		};
	}

	bindContainer( ref ) {
		this.container = ref;
	}

	getVisibleTabbables() {
		const tabbablesSelector = [
			'*[contenteditable="true"]',
			'*[tabindex]:not([tabindex="-1"])',
			'textarea',
			'input',
		].join( ', ' );
		const isVisible = ( elem ) => elem.offsetWidth > 0 || elem.offsetHeight > 0 || elem.getClientRects().length > 0;
		return [ ...this.container.querySelectorAll( tabbablesSelector ) ].filter( isVisible );
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
			this.setState( { shouldMove: true } );
		}
	}

	onKeyUp( event ) {
		const { keyCode, target } = event;
		const moveUp = ( keyCode === UP || keyCode === LEFT );
		if ( this.state.shouldMove ) {
			event.preventDefault();
			this.moveFocusInContainer( target, moveUp ? 'UP' : 'DOWN' );
			this.setState( { shouldMove: false } );
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
