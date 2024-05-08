/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';

/**
 * WordPress dependencies
 */
import { Component, forwardRef } from '@wordpress/element';
import { focus } from '@wordpress/dom';

/**
 * Internal dependencies
 */
import type { NavigableContainerProps } from './types';

const noop = () => {};
const MENU_ITEM_ROLES = [ 'menuitem', 'menuitemradio', 'menuitemcheckbox' ];

function cycleValue( value: number, total: number, offset: number ) {
	const nextValue = value + offset;
	if ( nextValue < 0 ) {
		return total + nextValue;
	} else if ( nextValue >= total ) {
		return nextValue - total;
	}

	return nextValue;
}

class NavigableContainer extends Component< NavigableContainerProps > {
	container?: HTMLDivElement;

	constructor( args: NavigableContainerProps ) {
		super( args );
		this.onKeyDown = this.onKeyDown.bind( this );
		this.bindContainer = this.bindContainer.bind( this );

		this.getFocusableContext = this.getFocusableContext.bind( this );
		this.getFocusableIndex = this.getFocusableIndex.bind( this );
	}

	componentDidMount() {
		if ( ! this.container ) {
			return;
		}

		// We use DOM event listeners instead of React event listeners
		// because we want to catch events from the underlying DOM tree
		// The React Tree can be different from the DOM tree when using
		// portals. Block Toolbars for instance are rendered in a separate
		// React Trees.
		this.container.addEventListener( 'keydown', this.onKeyDown );
	}

	componentWillUnmount() {
		if ( ! this.container ) {
			return;
		}

		this.container.removeEventListener( 'keydown', this.onKeyDown );
	}

	bindContainer( ref: HTMLDivElement ) {
		const { forwardedRef } = this.props;
		this.container = ref;

		if ( typeof forwardedRef === 'function' ) {
			forwardedRef( ref );
		} else if ( forwardedRef && 'current' in forwardedRef ) {
			forwardedRef.current = ref;
		}
	}

	getFocusableContext( target: Element ) {
		if ( ! this.container ) {
			return null;
		}

		const { onlyBrowserTabstops } = this.props;
		const finder = onlyBrowserTabstops ? focus.tabbable : focus.focusable;
		const focusables = finder.find( this.container );

		const index = this.getFocusableIndex( focusables, target );
		if ( index > -1 && target ) {
			return { index, target, focusables };
		}
		return null;
	}

	getFocusableIndex( focusables: Element[], target: Element ) {
		return focusables.indexOf( target );
	}

	onKeyDown( event: KeyboardEvent ) {
		if ( this.props.onKeyDown ) {
			this.props.onKeyDown( event );
		}

		const { getFocusableContext } = this;
		const {
			cycle = true,
			eventToOffset,
			onNavigate = noop,
			stopNavigationEvents,
		} = this.props;

		const offset = eventToOffset( event );

		// eventToOffset returns undefined if the event is not handled by the component.
		if ( offset !== undefined && stopNavigationEvents ) {
			// Prevents arrow key handlers bound to the document directly interfering.
			event.stopImmediatePropagation();

			// When navigating a collection of items, prevent scroll containers
			// from scrolling. The preventDefault also prevents Voiceover from
			// 'handling' the event, as voiceover will try to use arrow keys
			// for highlighting text.
			const targetRole = (
				event.target as HTMLDivElement | null
			 )?.getAttribute( 'role' );
			const targetHasMenuItemRole =
				!! targetRole && MENU_ITEM_ROLES.includes( targetRole );

			if ( targetHasMenuItemRole ) {
				event.preventDefault();
			}
		}

		if ( ! offset ) {
			return;
		}

		const activeElement = ( event.target as HTMLElement | null )
			?.ownerDocument?.activeElement;
		if ( ! activeElement ) {
			return;
		}

		const context = getFocusableContext( activeElement );
		if ( ! context ) {
			return;
		}

		const { index, focusables } = context;
		const nextIndex = cycle
			? cycleValue( index, focusables.length, offset )
			: index + offset;

		if ( nextIndex >= 0 && nextIndex < focusables.length ) {
			focusables[ nextIndex ].focus();
			onNavigate( nextIndex, focusables[ nextIndex ] );

			// `preventDefault()` on tab to avoid having the browser move the focus
			// after this component has already moved it.
			if ( event.code === 'Tab' ) {
				event.preventDefault();
			}
		}
	}

	render() {
		const {
			children,
			stopNavigationEvents,
			eventToOffset,
			onNavigate,
			onKeyDown,
			cycle,
			onlyBrowserTabstops,
			forwardedRef,
			...restProps
		} = this.props;
		return (
			<div ref={ this.bindContainer } { ...restProps }>
				{ children }
			</div>
		);
	}
}

const forwardedNavigableContainer = (
	props: NavigableContainerProps,
	ref: ForwardedRef< HTMLDivElement >
) => {
	return <NavigableContainer { ...props } forwardedRef={ ref } />;
};
forwardedNavigableContainer.displayName = 'NavigableContainer';

export default forwardRef( forwardedNavigableContainer );
