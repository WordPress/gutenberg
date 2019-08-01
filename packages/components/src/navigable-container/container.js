/**
 * External dependencies
 */
import { omit, noop, isFunction } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component, forwardRef } from '@wordpress/element';
import { focus } from '@wordpress/dom';

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
		this.onKeyDown = this.onKeyDown.bind( this );
		this.bindContainer = this.bindContainer.bind( this );

		this.getFocusableContext = this.getFocusableContext.bind( this );
		this.getFocusableIndex = this.getFocusableIndex.bind( this );
	}

	componentDidMount() {
		// We use DOM event listeners instead of React event listeners
		// because we want to catch events from the underlying DOM tree
		// The React Tree can be different from the DOM tree when using
		// portals. Block Toolbars for instance are rendered in a separate
		// React Trees.
		this.container.addEventListener( 'keydown', this.onKeyDown );
		this.container.addEventListener( 'focus', this.onFocus );
	}

	componentWillUnmount() {
		this.container.removeEventListener( 'keydown', this.onKeyDown );
		this.container.removeEventListener( 'focus', this.onFocus );
	}

	bindContainer( ref ) {
		const { forwardedRef } = this.props;
		this.container = ref;

		if ( isFunction( forwardedRef ) ) {
			forwardedRef( ref );
		} else if ( forwardedRef && 'current' in forwardedRef ) {
			forwardedRef.current = ref;
		}
	}

	getFocusableContext( target ) {
		const { onlyBrowserTabstops } = this.props;
		const finder = onlyBrowserTabstops ? focus.tabbable : focus.focusable;
		const focusables = finder.find( this.container );

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

		const { getFocusableContext } = this;
		const { cycle = true, eventToOffset, onNavigate = noop, stopNavigationEvents } = this.props;

		const offset = eventToOffset( event );

		// eventToOffset returns undefined if the event is not handled by the component
		if ( offset !== undefined && stopNavigationEvents ) {
			// Prevents arrow key handlers bound to the document directly interfering
			event.stopImmediatePropagation();

			// When navigating a collection of items, prevent scroll containers
			// from scrolling.
			if ( event.target.getAttribute( 'role' ) === 'menuitem' ) {
				event.preventDefault();
			}
		}

		if ( ! offset ) {
			return;
		}

		const context = getFocusableContext( document.activeElement );
		if ( ! context ) {
			return;
		}

		const { index, focusables } = context;
		const nextIndex = cycle ? cycleValue( index, focusables.length, offset ) : index + offset;
		if ( nextIndex >= 0 && nextIndex < focusables.length ) {
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
				{ ...omit( props, [
					'stopNavigationEvents',
					'eventToOffset',
					'onNavigate',
					'cycle',
					'onlyBrowserTabstops',
					'forwardedRef',
				] ) }
			>
				{ children }
			</div>
		);
		/* eslint-enable jsx-a11y/no-static-element-interactions */
	}
}

const forwardedNavigableContainer = ( props, ref ) => {
	return <NavigableContainer { ...props } forwardedRef={ ref } />;
};
forwardedNavigableContainer.displayName = 'NavigableContainer';

export default forwardRef( forwardedNavigableContainer );
