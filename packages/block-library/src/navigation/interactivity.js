/**
 * Internal dependencies
 */
import { store } from '../utils/interactivity';

store( {
	effects: {
		core: {
			navigation: {
				initModal: async ( { context, ref } ) => {
					if ( context.isMenuOpen ) {
						const focusableElements = ref.querySelectorAll(
							'a[href], button:not([disabled]), textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select'
						);
						context.modal = ref;
						context.firstFocusableElement = focusableElements[ 0 ];
						context.lastFocusableElement =
							focusableElements[ focusableElements.length - 1 ];
					}
				},
				focusFirstElement: async ( { context, ref } ) => {
					if ( context.isMenuOpen ) {
						ref.querySelector(
							'.wp-block-navigation-item > *:first-child'
						).focus();
					}
				},
			},
		},
	},
	selectors: {
		core: {
			navigation: {
				roleAttribute: ( { context } ) => {
					console.log( context.overlay && context.isMenuOpen );
					return context.overlay && context.isMenuOpen
						? 'dialog'
						: '';
				},
			},
		},
	},
	actions: {
		core: {
			navigation: {
				openMenu: ( { context, ref } ) => {
					context.isMenuOpen = true;
					context.previousFocus = ref;
					if ( context.overlay ) {
						// It adds a `has-modal-open` class to the <html> root
						document.documentElement.classList.add(
							'has-modal-open'
						);
					}
				},
				closeMenu: ( { context } ) => {
					if ( context.isMenuOpen ) {
						context.isMenuOpen = false;
						if (
							context.modal.contains(
								window.document.activeElement
							)
						) {
							context.previousFocus.focus();
						}
						context.modal = null;
						context.previousFocus = null;
						if ( context.overlay ) {
							document.documentElement.classList.remove(
								'has-modal-open'
							);
						}
					}
				},
				handleMenuKeydown: ( { actions, context, event } ) => {
					if ( context.isMenuOpen ) {
						// If Escape close the menu
						if (
							event?.key === 'Escape' ||
							event?.keyCode === 27
						) {
							actions.core.navigation.closeMenu( { context } );
							return;
						}

						// Trap focus if it is an overlay (main menu)
						if (
							context.overlay &&
							( event.key === 'Tab' || event.keyCode === 9 )
						) {
							// If shift + tab it change the direction
							if (
								event.shiftKey &&
								window.document.activeElement ===
									context.firstFocusableElement
							) {
								event.preventDefault();
								context.lastFocusableElement.focus();
							} else if (
								! event.shiftKey &&
								window.document.activeElement ===
									context.lastFocusableElement
							) {
								event.preventDefault();
								context.firstFocusableElement.focus();
							}
						}
					}
				},
				handleMenuFocusout: ( { actions, context, event } ) => {
					if ( context.isMenuOpen ) {
						// If focus is outside modal, and in the document, close menu
						// event.target === The element losing focus
						// event.relatedTarget === The element receiving focus (if any)
						// When focusout is outsite the document, `window.document.activeElement` doesn't change
						if (
							! context.modal.contains( event.relatedTarget ) &&
							event.target !== window.document.activeElement
						) {
							actions.core.navigation.closeMenu( { context } );
						}
					}
				},
			},
		},
	},
} );
