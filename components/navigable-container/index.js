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
		this.getFocusables = this.getFocusables.bind( this );
		this.getFocusableIndex = this.getFocusableIndex.bind( this );

		this.mode = calculateMode( this.props.navigation );
	}

	bindContainer( ref ) {
		const { handleRef = noop } = this.props;
		this.container = ref;
		handleRef( ref );
	}

	getFocusables() {
		const { mode } = this;
		const finder = mode.useTabstops ? focus.tabbable : focus.focusable;
		return finder
			.find( this.container )
			.filter( ( node ) => mode.deep || node.parentElement === this.container );
	}

	getInitialFocus( ) {
		const { mode } = this;
		const tabbables = this.getFocusables();

		if ( mode.initialSelector ) {
			const target = this.container.querySelector( mode.initialSelector );
			const index = tabbables.indexOf( target );
			if ( target && index > -1 ) {
				return {
					target,
					index,
				};
			}
		}

		if ( tabbables.length > 0 ) {
			return {
				target: tabbables[ 0 ],
				index: 0,
			};
		}

		return null;
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

	getFocusableIndex( focusables ) {
		const { mode } = this;
		const directIndex = focusables.indexOf( document.activeElement );
		if ( directIndex !== -1 ) {
			return directIndex;
		}

		if ( mode.widget ) {
			const indirectFocus = focusables.find( ( f ) => f.contains( document.activeElement ) );
			if ( indirectFocus ) {
				return focusables.indexOf( indirectFocus );
			}
		}
	}

	onKeyDown( event ) {
		if ( this.props.onKeyDown ) {
			this.props.onKeyDown( event );
		}

		const { mode, getFocusables } = this;
		const { onNavigate = noop } = this.props;

		const match = mode.detect( event );
		if ( ! match ) {
			return;
		}

		const focusables = getFocusables();
		const currentIndex = this.getFocusableIndex( focusables );

		if ( currentIndex === -1 ) {
			return;
		}

		const nextIndex = match( currentIndex, focusables.length );
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
		return <NavigableContainer role="grid" navigation={ navigation } { ...rest } />;
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
