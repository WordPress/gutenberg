// @ts-nocheck
/**
 * WordPress dependencies
 */
import { Component, forwardRef } from '@wordpress/element';
import { focus } from '@wordpress/dom';

const noop = () => {};
const MENU_ITEM_ROLES = [ 'menuitem', 'menuitemradio', 'menuitemcheckbox' ];

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

		if ( typeof forwardedRef === 'function' ) {
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
			const targetRole = event.target.getAttribute( 'role' );
			const targetHasMenuItemRole =
				MENU_ITEM_ROLES.includes( targetRole );

			// `preventDefault()` on tab to avoid having the browser move the focus
			// after this component has already moved it.
			const isTab = event.code === 'Tab';

			if ( targetHasMenuItemRole || isTab ) {
				event.preventDefault();
			}
		}

		if ( ! offset ) {
			return;
		}

		const context = getFocusableContext(
			event.target.ownerDocument.activeElement
		);
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

const forwardedNavigableContainer = ( props, ref ) => {
	return <NavigableContainer { ...props } forwardedRef={ ref } />;
};
forwardedNavigableContainer.displayName = 'NavigableContainer';

export default forwardRef( forwardedNavigableContainer );
