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

function cycleValue( value, total, offset ) {
	const nextValue = value + offset;
	if ( nextValue < 0 ) {
		return total + nextValue;
	} else if ( nextValue >= total ) {
		return nextValue - total;
	}

	return nextValue;
}

class NavigableContainer extends Component {
	constructor() {
		super( ...arguments );
		this.bindContainer = this.bindContainer.bind( this );
		this.onKeyDown = this.onKeyDown.bind( this );

		this.getFocusableContext = this.getFocusableContext.bind( this );
		this.getFocusableIndex = this.getFocusableIndex.bind( this );
	}

	bindContainer( ref ) {
		const { handleRef = noop } = this.props;
		this.container = ref;
		handleRef( ref );
	}

	getFocusableContext( target ) {
		const { deep, onlyBrowserTabstops } = this.props;
		const finder = onlyBrowserTabstops ? focus.tabbable : focus.focusable;
		const focusables = finder
			.find( this.container )
			.filter( ( node ) => deep || node.parentElement === this.container );

		const index = this.getFocusableIndex( focusables, target );
		if ( index > -1 && target ) {
			return { index, target, focusables };
		}
		return null;
	}

	getFocusableIndex( focusables, target ) {
		const directIndex = focusables.indexOf( target );
		if ( directIndex !== -1 ) {
			return directIndex;
		}
	}

	onKeyDown( event ) {
		if ( this.props.onKeyDown ) {
			this.props.onKeyDown( event );
		}

		const { keyCode } = event;
		const { getFocusableContext } = this;
		const { eventToOffset, onNavigate, preventBubblingArrowEvents = noop } = this.props;

		const offset = eventToOffset( event );
		if ( offset === 0 ) {
			return;
		}

		const context = getFocusableContext( document.activeElement );

		if ( ! context ) {
			return;
		}
		const { index, focusables } = context;

		const nextIndex = cycleValue( index, focusables.length, offset );

		if ( nextIndex >= 0 && nextIndex < focusables.length ) {
			if ( preventBubblingArrowEvents && [ LEFT, RIGHT, DOWN, UP ].indexOf( keyCode ) > -1 ) {
				// Stop any DOM events bound directly to the document (outside of React)
				event.nativeEvent.stopImmediatePropagation();
				event.stopPropagation();
			}

			focusables[ nextIndex ].focus();
			onNavigate( nextIndex, focusables[ nextIndex ] );
		}
	}

	render() {
		const { children, ...props } = this.props;

		// Disable reason: Assumed role is applied by parent via props spread.
		/* eslint-disable jsx-a11y/no-static-element-interactions */
		return (
			<div ref={ this.bindContainer }
				{ ...omit( props, [ 'preventBubblingArrowEvents', 'eventToOffset', 'onNavigate', 'handleRef', 'onlyBrowserTabstops' ] ) }
				onKeyDown={ this.onKeyDown }
				onFocus={ this.onFocus }>
				{ children }
			</div>
		);
	}
}

export class NavigableMenu extends Component {
	render() {
		const { orientation = 'vertical', ...rest } = this.props;
		const eventToOffset = ( evt ) => {
			const { keyCode } = evt;
			if ( LEFT === keyCode && orientation === 'horizontal' ) {
				return -1;
			} else if ( UP === keyCode && orientation === 'vertical' ) {
				return -1;
			} else if ( RIGHT === keyCode && orientation === 'horizontal' ) {
				return +1;
			} else if ( DOWN === keyCode && orientation === 'vertical' ) {
				return +1;
			}

			return 0;
		};

		return <NavigableContainer eventToOffset={ eventToOffset } { ...rest } />;
	}
}

export class TabbableContainer extends Component {
	render() {
		const eventToOffset = ( evt ) => {
			const { keyCode, shiftKey } = evt;
			if ( TAB === keyCode ) {
				return shiftKey ? -1 : 1;
			}
		};

		return <NavigableContainer onlyBrowserTabstops={ true } eventToOffset={ eventToOffset } { ...this.props } />;
	}
}
