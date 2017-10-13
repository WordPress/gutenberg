/**
 * External Dependencies
 */
import { omit, noop } from 'lodash';

/**
 * WordPress Dependencies
 */
import { Component } from '@wordpress/element';
import { focus, keycodes } from '@wordpress/utils';

/**
 * Module Constants
 */
const { UP, DOWN, LEFT, RIGHT, TAB } = keycodes;

class NavigableMenu extends Component {
	constructor() {
		super( ...arguments );
		this.bindContainer = this.bindContainer.bind( this );
		this.onKeyDown = this.onKeyDown.bind( this );
	}

	bindContainer( ref ) {
		this.container = ref;
	}

	onKeyDown( event ) {
		const { orientation = 'vertical', onNavigate = noop, deep = false } = this.props;
		if (
			( orientation === 'vertical' && [ UP, DOWN, TAB ].indexOf( event.keyCode ) === -1 ) ||
			( orientation === 'horizontal' && [ RIGHT, LEFT, TAB ].indexOf( event.keyCode ) === -1 )
		) {
			return;
		}
		const tabbables = focus.tabbable
			.find( this.container )
			.filter( ( node ) => deep || node.parentElement === this.container );
		const indexOfTabbable = tabbables.indexOf( document.activeElement );

		if ( indexOfTabbable === -1 ) {
			return;
		}

		const offset = (
			[ UP, LEFT ].indexOf( event.keyCode ) !== -1 ||
			( event.keyCode === TAB && event.shiftKey )
		) ? -1 : 1;
		let nextIndex = indexOfTabbable + offset;
		nextIndex = nextIndex === -1 ? tabbables.length - 1 : nextIndex;
		nextIndex = nextIndex === tabbables.length ? 0 : nextIndex;
		const nextTabbable = tabbables[ nextIndex ];
		event.stopPropagation();
		event.preventDefault();
		if ( nextTabbable ) {
			nextTabbable.focus();
			onNavigate( nextIndex );
		}
	}

	render() {
		const { children, ...props } = this.props;

		return (
			<div ref={ this.bindContainer } { ...omit( props, [ 'orientation', 'onNavigate', 'deep' ] ) } onKeyDown={ this.onKeyDown }>
				{ children }
			</div>
		);
	}
}

export default NavigableMenu;
