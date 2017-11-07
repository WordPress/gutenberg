/**
 * External Dependencies
 */
import { omit, noop } from 'lodash';

/**
 * WordPress Dependencies
 */
import { Component } from '@wordpress/element';
import { focus } from '@wordpress/utils';

import { calculateMode } from './modes.js';

/**
 * Module Constants
 */



class NavigableContainer extends Component {
	constructor() {
		super( ...arguments );
		this.bindContainer = this.bindContainer.bind( this );
		this.onKeyDown = this.onKeyDown.bind( this );
		this.onFocus = this.onFocus.bind( this );

		this.getInitialFocus = this.getInitialFocus.bind( this );
		this.getFocusableContext = this.getFocusableContext.bind( this );
		this.getFocusableIndex = this.getFocusableIndex.bind( this );

		this.mode = calculateMode( this.props.navigation );
	}

	bindContainer( ref ) {
		const { handleRef = noop } = this.props;
		this.container = ref;
		handleRef( ref );
	}

	getFocusableContext( target ) {
		const { mode } = this;
		const finder = mode.useTabstops ? focus.tabbable : focus.focusable;
		const focusables = finder
			.find( this.container )
			.filter( ( node ) => mode.deep || node.parentElement === this.container );

		const index = this.getFocusableIndex( focusables, target );
		if ( index > -1 && target ) {
			return { index, target, focusables };
		}
		return null;
	}

	getInitialFocus( ) {
		const target = this.container.querySelector( '[aria-selected="true"]' );
		return this.getFocusableContext( target );
	}

	onFocus( event ) {
		const { onNavigate = noop } = this.props;

		if ( event.target === this.container ) {
			const initialFocus = this.getInitialFocus( );
			if ( initialFocus ) {
				initialFocus.target.focus();
				onNavigate( initialFocus.index, initialFocus.target );
			}
		}
	}

	getFocusableIndex( focusables, target ) {
		const { mode } = this;
		const directIndex = focusables.indexOf( target );
		if ( directIndex !== -1 ) {
			return directIndex;
		}

		if ( mode.widget ) {
			const indirectFocus = focusables.find( ( f ) => f.contains( target ) );
			if ( indirectFocus ) {
				return focusables.indexOf( indirectFocus );
			}
		}
	}

	onKeyDown( event ) {
		if ( this.props.onKeyDown ) {
			this.props.onKeyDown( event );
		}

		const { mode, getFocusableContext } = this;
		const { onNavigate = noop } = this.props;

		const match = mode.detect( event );
		if ( ! match ) {
			return;
		}

		const { index, focusables } = getFocusableContext( document.activeElement );

		if ( index === -1 ) {
			return;
		}

		const nextIndex = match( index, focusables.length );
		if ( nextIndex >= 0 && nextIndex < focusables.length ) {
			event.nativeEvent.stopImmediatePropagation();
			event.stopPropagation();
			event.preventDefault();
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
				{ ...omit( props, [ 'navigation', 'onNavigate', 'handleRef' ] ) }
				onKeyDown={ this.onKeyDown }
				onFocus={ this.onFocus }>
				{ children }
			</div>
		);
	}
}

export class NavigableGrid extends Component {
	render() {
		const { cycle = true, deep = true, widget = true, width = 1, initialSelector, ...rest } = this.props;
		const navigation = {
			mode: 'grid',
			cycle,
			initialSelector,
			deep,
			width,
			widget,
		};
		return <NavigableContainer navigation={ navigation } { ...rest } />;
	}
}

export class NavigableMenu extends Component {
	render() {
		const { cycle = true, deep = true, widget = true, orientation = 'vertical', stopOtherArrows = true, initialSelector, ...rest } = this.props;
		const navigation = {
			mode: 'menu',
			cycle,
			orientation,
			initialSelector,
			stopOtherArrows,
			deep,
			widget,
		};
		return <NavigableContainer navigation={ navigation } { ...rest } />;
	}
}

export class TabbableContainer extends Component {
	render() {
		const { cycle = true, deep = true, widget = true, initialSelector, ...rest } = this.props;
		const navigation = {
			mode: 'tabbing',
			cycle,
			initialSelector,
			deep,
			widget,
		};
		return <NavigableContainer navigation={ navigation } { ...rest } />;
	}
}
