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

const { state, actions } = store( 'core/navigation', {
	effects: {
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
		},
		focusFirstElement() {
			const { ref } = getElement();
			if ( state.isMenuOpen ) {
				ref.querySelector(
					'.wp-block-navigation-item > *:first-child'
				).focus();
			}
		},
	},
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
			const ctx = getContext();
			if (
				ctx.type === 'submenu' &&
				// Only open on hover if the overlay is closed.
				Object.values( ctx.overlayOpenedBy || {} ).filter( Boolean )
					.length === 0
			)
				actions.openMenu( 'hover' );
		},
		closeMenuOnHover() {
			actions.closeMenu( 'hover' );
		},
		openMenuOnClick() {
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
			const { menuOpenedBy } = state;
			if ( menuOpenedBy.click || menuOpenedBy.focus ) {
				actions.closeMenu( 'click' );
				actions.closeMenu( 'focus' );
			} else {
				actions.openMenu( 'click' );
			}
		},
		handleMenuKeydown( event ) {
			if ( state.menuOpenedBy.click ) {
				// If Escape close the menu.
				if ( event?.key === 'Escape' ) {
					actions.closeMenu( 'click' );
					actions.closeMenu( 'focus' );
					return;
				}

				const ctx = getContext();
				// Trap focus if it is an overlay (main menu).
				if ( ctx.type === 'overlay' && event.key === 'Tab' ) {
					// If shift + tab it change the direction.
					if (
						event.shiftKey &&
						window.document.activeElement ===
							ctx.firstFocusableElement
					) {
						event.preventDefault();
						ctx.lastFocusableElement.focus();
					} else if (
						! event.shiftKey &&
						window.document.activeElement ===
							ctx.lastFocusableElement
					) {
						event.preventDefault();
						ctx.firstFocusableElement.focus();
					}
				}
			}
		},
		handleMenuFocusout( event ) {
			const ctx = getContext();
			// If focus is outside modal, and in the document, close menu
			// event.target === The element losing focus
			// event.relatedTarget === The element receiving focus (if any)
			// When focusout is outsite the document,
			// `window.document.activeElement` doesn't change.
			if (
				! ctx.modal?.contains( event.relatedTarget ) &&
				event.target !== window.document.activeElement
			) {
				actions.closeMenu( 'click' );
				actions.closeMenu( 'focus' );
			}
		},

		openMenu( menuOpenedOn ) {
			const ctx = getContext();
			const { ref } = getElement();
			state.menuOpenedBy[ menuOpenedOn ] = true;
			ctx.previousFocus = ref;
			if ( ctx.type === 'overlay' ) {
				// Add a `has-modal-open` class to the <html> root.
				document.documentElement.classList.add( 'has-modal-open' );
			}
		},

		closeMenu( menuClosedOn ) {
			const ctx = getContext();
			state.menuOpenedBy[ menuClosedOn ] = false;
			// Check if the menu is still open or not.
			if ( ! state.isMenuOpen ) {
				if ( ctx.modal?.contains( window.document.activeElement ) ) {
					ctx.previousFocus.focus();
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
} );
