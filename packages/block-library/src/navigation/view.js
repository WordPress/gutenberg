/**
 * WordPress dependencies
 */
import {
	store,
	getContext,
	getElement,
	withSyncEvent,
} from '@wordpress/interactivity';

const focusableSelectors = [
	'a[href]',
	'input:not([disabled]):not([type="hidden"]):not([aria-hidden])',
	'select:not([disabled]):not([aria-hidden])',
	'textarea:not([disabled]):not([aria-hidden])',
	'button:not([disabled]):not([aria-hidden])',
	'[contenteditable]',
	'[tabindex]:not([tabindex^="-"])',
];

const openedByNone = { click: false, focus: false, hover: false };

const lacksCommandSupport =
	! window.HTMLButtonElement.prototype.hasOwnProperty( 'command' );

// This is a fix for Safari in iOS/iPadOS. Without it, Safari doesn't focus out
// when the user taps in the body. It can be removed once we add an overlay to
// capture the clicks, instead of relying on the focusout event.
document.addEventListener( 'click', () => {} );

const { state, actions } = store(
	'core/navigation',
	{
		state: {
			get isMenuOpen() {
				const { submenuOpenedBy = {} } = getContext();
				// The menu is opened if either `click`, `hover` or `focus` is true.
				return Object.values( submenuOpenedBy ).some( Boolean );
			},
		},
		actions: {
			openMenuOnHover() {
				actions.openMenu( 'hover' );
			},
			closeMenuOnHover() {
				// Closes only if not opened by click.
				if ( getContext().submenuOpenedBy.click === false ) {
					actions.closeMenu();
				}
			},
			openMenuOnFocus() {
				actions.openMenu( 'focus' );
			},
			toggleMenuOnClick() {
				const ctx = getContext();
				const { ref } = getElement();
				// Safari won't send focus to the clicked element, so we need to manually place it: https://bugs.webkit.org/show_bug.cgi?id=22261
				if ( window.document.activeElement !== ref ) {
					ref.focus();
				}
				const { click, focus } = ctx.submenuOpenedBy;
				if ( click || focus ) {
					actions.closeMenu();
				} else {
					ctx.previousFocus = ref;
					actions.openMenu( 'click' );
				}
			},
			handleMenuKeydown: withSyncEvent( ( event ) => {
				const { key } = event;
				if ( getContext().submenuOpenedBy.click && key === 'Escape' ) {
					event.stopPropagation(); // Keeps ancestor menus open.
					actions.closeMenu();
				}
			} ),
			handleMenuFocusout( event ) {
				const { menu } = getContext();
				const { activeElement } = window.document;
				// If focus is outside menu, and in the document, close menu
				// event.target === The element losing focus
				// event.relatedTarget === The element receiving focus (if any)
				// When focusout is outside the document,
				// `window.document.activeElement` doesn't change.

				// The event.relatedTarget is null when something outside the navigation menu is clicked. This is only necessary for Safari.
				if (
					menu &&
					( event.relatedTarget === null ||
						( ! menu.contains( event.relatedTarget ) &&
							event.target !== activeElement ) )
				) {
					actions.closeMenu();
				}
			},
			openMenu( menuOpenedOn = 'click' ) {
				const ctx = getContext();
				ctx.submenuOpenedBy[ menuOpenedOn ] = true;
				ctx.menu = getElement().ref.closest( 'li' );
			},
			closeMenu() {
				const ctx = getContext();
				Object.assign( ctx.submenuOpenedBy, openedByNone );
				if ( ctx.menu.contains( window.document.activeElement ) ) {
					ctx.previousFocus?.focus();
				}
				ctx.menu = null;
				ctx.previousFocus = null;
			},
		},
		callbacks: {
			mountDialogInvoker() {
				if ( lacksCommandSupport ) {
					const { ref } = getElement();
					const dialog = document.getElementById(
						ref.getAttribute( 'commandfor' )
					);
					ref.addEventListener( 'click', () =>
						dialog[ dialog.open ? 'close' : 'showModal' ]()
					);
				}
			},
			mountDialog() {
				const dialog = getElement().ref;
				const { ariaLabel } = getContext();
				const openAttributeSpy = new window.MutationObserver( () => {
					const { open, classList } = dialog;
					const method = open ? 'add' : 'remove';
					// Toggles `has-modal-open` class on the <html> root.
					document.documentElement.classList[ method ](
						'has-modal-open'
					);
					classList[ method ]( 'has-modal-open', 'is-menu-open' );
					// TODO: Without JS the label won’t be applied. This is not new but was a non-issue when
					// the dialog could only be opened with JS.
					dialog.ariaLabel = open ? ariaLabel : null;
				} );
				openAttributeSpy.observe( dialog, {
					attributeFilter: [ 'open' ],
					attributes: true,
				} );
				return () => openAttributeSpy.disconnect();
			},
			focusFirstElement() {
				if ( state.isMenuOpen ) {
					const { ref } = getElement();
					ref.querySelectorAll( focusableSelectors )?.[ 0 ]?.focus();
				}
			},
		},
	},
	{ lock: true }
);
