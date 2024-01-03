/**
 * WordPress dependencies
 */
import { store, getContext, getElement } from '@wordpress/interactivity';

const focusableSelectors = [
	'a[href]',
	'input:not([disabled]):not([type="hidden"]):not([aria-hidden])',
	'select:not([disabled]):not([aria-hidden])',
	'textarea:not([disabled]):not([aria-hidden])',
	'button:not([disabled]):not([aria-hidden])',
	'[contenteditable]',
	'[tabindex]:not([tabindex^="-"])',
];

// This is a fix for Safari in iOS/iPadOS. Without it, Safari doesn't focus out
// when the user taps in the body. It can be removed once we add an overlay to
// capture the clicks, instead of relying on the focusout event.
document.addEventListener( 'click', () => {} );

const { state, actions, callbacks } = store( 'core/navigation', {
	state: {
		get roleAttribute() {
			const ctx = getContext();
			return ctx.type === 'overlay' && state.isMenuOpen ? 'dialog' : null;
		},
		get ariaModal() {
			const ctx = getContext();
			return ctx.type === 'overlay' && state.isMenuOpen ? 'true' : null;
		},
		get ariaLabel() {
			const ctx = getContext();
			return ctx.type === 'overlay' && state.isMenuOpen
				? ctx.ariaLabel
				: null;
		},
		get isMenuOpen() {
			// The menu is opened if either `click`, `hover` or `focus` is true.
			return (
				Object.values( state.menuOpenedBy ).filter( Boolean ).length > 0
			);
		},
		get menuOpenedBy() {
			const ctx = getContext();
			return ctx.type === 'overlay'
				? ctx.overlayOpenedBy
				: ctx.submenuOpenedBy;
		},
	},
	actions: {
		openMenuOnHover() {
			const { type, overlayOpenedBy } = getContext();
			if (
				type === 'submenu' &&
				// Only open on hover if the overlay is closed.
				Object.values( overlayOpenedBy || {} ).filter( Boolean )
					.length === 0
			)
				actions.openMenu( 'hover' );
		},
		closeMenuOnHover() {
			actions.closeMenu( 'hover' );
		},
		openMenuOnClick() {
			const ctx = getContext();
			const { ref } = getElement();
			ctx.previousFocus = ref;
			actions.openMenu( 'click' );
		},
		closeMenuOnClick() {
			actions.closeMenu( 'click' );
			actions.closeMenu( 'focus' );
		},
		openMenuOnFocus() {
			actions.openMenu( 'focus' );
		},
		toggleMenuOnClick() {
			const ctx = getContext();
			const { ref } = getElement();
			// Safari won't send focus to the clicked element, so we need to manually place it: https://bugs.webkit.org/show_bug.cgi?id=22261
			if ( window.document.activeElement !== ref ) ref.focus();
			const { menuOpenedBy } = state;
			if ( menuOpenedBy.click || menuOpenedBy.focus ) {
				actions.closeMenu( 'click' );
				actions.closeMenu( 'focus' );
			} else {
				ctx.previousFocus = ref;
				actions.openMenu( 'click' );
			}
		},
		handleMenuKeydown( event ) {
			const { type, firstFocusableElement, lastFocusableElement } =
				getContext();
			if ( state.menuOpenedBy.click ) {
				// If Escape close the menu.
				if ( event?.key === 'Escape' ) {
					actions.closeMenu( 'click' );
					actions.closeMenu( 'focus' );
					return;
				}

				// Trap focus if it is an overlay (main menu).
				if ( type === 'overlay' && event.key === 'Tab' ) {
					// If shift + tab it change the direction.
					if (
						event.shiftKey &&
						window.document.activeElement === firstFocusableElement
					) {
						event.preventDefault();
						lastFocusableElement.focus();
					} else if (
						! event.shiftKey &&
						window.document.activeElement === lastFocusableElement
					) {
						event.preventDefault();
						firstFocusableElement.focus();
					}
				}
			}
		},
		handleMenuFocusout( event ) {
			const { modal } = getContext();
			// If focus is outside modal, and in the document, close menu
			// event.target === The element losing focus
			// event.relatedTarget === The element receiving focus (if any)
			// When focusout is outsite the document,
			// `window.document.activeElement` doesn't change.

			// The event.relatedTarget is null when something outside the navigation menu is clicked. This is only necessary for Safari.
			if (
				event.relatedTarget === null ||
				( ! modal?.contains( event.relatedTarget ) &&
					event.target !== window.document.activeElement )
			) {
				actions.closeMenu( 'click' );
				actions.closeMenu( 'focus' );
			}
		},

		openMenu( menuOpenedOn = 'click' ) {
			const { type } = getContext();
			state.menuOpenedBy[ menuOpenedOn ] = true;
			if ( type === 'overlay' ) {
				// Add a `has-modal-open` class to the <html> root.
				document.documentElement.classList.add( 'has-modal-open' );
			}
		},

		closeMenu( menuClosedOn = 'click' ) {
			const ctx = getContext();
			state.menuOpenedBy[ menuClosedOn ] = false;
			// Check if the menu is still open or not.
			if ( ! state.isMenuOpen ) {
				if ( ctx.modal?.contains( window.document.activeElement ) ) {
					ctx.previousFocus?.focus();
				}
				ctx.modal = null;
				ctx.previousFocus = null;
				if ( ctx.type === 'overlay' ) {
					document.documentElement.classList.remove(
						'has-modal-open'
					);
				}
			}
		},
	},
	callbacks: {
		initMenu() {
			const ctx = getContext();
			const { ref } = getElement();
			if ( state.isMenuOpen ) {
				const focusableElements =
					ref.querySelectorAll( focusableSelectors );
				ctx.modal = ref;
				ctx.firstFocusableElement = focusableElements[ 0 ];
				ctx.lastFocusableElement =
					focusableElements[ focusableElements.length - 1 ];
			}
			window.addEventListener( 'resize', () =>
				callbacks.isNavCollapsed( ref )
			);
		},

		focusFirstElement() {
			const { ref } = getElement();
			if ( state.isMenuOpen ) {
				const focusableElements =
					ref.querySelectorAll( focusableSelectors );
				focusableElements?.[ 0 ]?.focus();
			}
		},

		isNavCollapsed( ref ) {
			// remove the is-mobile class to avoid false positives.
			ref.closest( 'nav' ).classList.remove( 'is-mobile' );

			// test if the nav items are wrapping before testing if the actual nav is wrapping inside its parent to avoid the recursive function if possible
			if (
				areItemsWrapping( ref ) === true ||
				isNavWrapping( ref ) === true
			) {
				ref.closest( 'nav' ).classList.add( 'is-mobile' );
			} else {
				ref.closest( 'nav' ).classList.remove( 'is-mobile' );
			}
		},
	},
} );

function areItemsWrapping(
	wrapper,
	children = wrapper.querySelectorAll( 'li' )
) {
	const wrapperDimensions = wrapper.getBoundingClientRect();
	//we store an array with the width of each item
	const itemsWidths = getItemWidths( children );
	let totalWidth = 0;
	let isWrapping = false;

	//the nav block may have row-gap applied, which is not calculated in getItemWidths
	const computedStyle = window.getComputedStyle( wrapper );
	const rowGap = parseFloat( computedStyle.rowGap ) || 0;

	for ( let i = 0, len = itemsWidths.length; i < len; i++ ) {
		totalWidth += itemsWidths[ i ];
		if ( rowGap > 0 && i > 0 ) {
			totalWidth += rowGap;
		}
		if ( parseInt( totalWidth ) > parseInt( wrapperDimensions.width ) ) {
			isWrapping = true;
		}
	}
	return isWrapping;
}

function isNavWrapping( ref ) {
	let isWrapping = false;
	//how can we check if the nav element is wrapped inside its parent if we don't know anything about it (the parent)?
	//for debugging purposes
	const container = ref.closest( 'nav' ); //getFlexParent( ref );
	if ( container !== null ) {
		const childrenWrapper = container.querySelector(
			'ul.wp-block-navigation'
		);
		isWrapping =
			childrenWrapper &&
			childrenWrapper.children &&
			areItemsWrapping(
				container,
				Array.from(
					container.querySelector( 'ul.wp-block-navigation' ).children
				)
			);
	}

	return isWrapping;
}

/* I'm not sure we still need this - can we just get the nearest nav element?
function getFlexParent( elem ) {
	if ( elem === document.body ) {
		// Base case: Stop recursion once we go all the way to the body to avoid infinite recursion
		return null;
	}
	const parent = elem.parentNode;
	const containerStyles = window.getComputedStyle( parent );
	const isFlexWrap =
		containerStyles.getPropertyValue( 'flex-wrap' ) === 'wrap';
	if ( isFlexWrap ) {
		return parent;
	}
	return getFlexParent( parent );
}*/

function getItemWidths( items ) {
	const itemsWidths = [];

	items.forEach( function ( item ) {
		const style = item.currentStyle || window.getComputedStyle( item );
		const itemDimensions = item.getBoundingClientRect();
		const width = parseFloat( itemDimensions.width );
		const marginLeft = parseFloat( style.marginLeft );
		const marginRight = parseFloat( style.marginRight );
		const totalWidth = width + marginLeft + marginRight;

		itemsWidths.push( totalWidth );
	} );
	return itemsWidths;
}
