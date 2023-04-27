/**
 * Internal dependencies
 */
import { store } from '../utils/interactivity';

store( {
	actions: {
		core: {
			navigation: {
				openMenu: ( { context, ref } ) => {
					context.isMenuOpen = true;
					context.previousFocus = ref;
					// Review how to move this to a selector or something similar
					context.roleAttribute = 'dialog';
					// It adds a `has-modal-open` class to the <html> root
					// document.documentElement.classList.add( 'has-modal-open' );
				},
				closeMenu: ( { context } ) => {
					context.isMenuOpen = false;
					// Review how to move this to a selector or something similar
					context.roleAttribute = '';
					context.modal = null;
					context.previousFocus = null;
					// It removes the `has-modal-open` class to the <html> root
					// document.documentElement.classList.remove(
					// 	'has-modal-open'
					// );
				},
				handleMenuKeydown: ( { actions, context, event } ) => {
					if ( context.isMenuOpen ) {
						// If Escape close the menu
						if (
							event?.key === 'Escape' ||
							event?.keyCode === 27
						) {
							context.previousFocus.focus();
							actions.core.navigation.closeMenu( { context } );
							return;
						}

						// Trap focus if set to true
						if (
							context.trapFocus &&
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
						// If focus is outside modal, close menu
						if ( ! context.modal.contains( event.relatedTarget ) ) {
							actions.core.navigation.closeMenu( { context } );
						}
					}
				},
			},
		},
	},
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
				focusFirstElement: async ( { context, tick, ref } ) => {
					if ( context.isMenuOpen ) {
						// Until useSignalEffects is fixed: https://github.com/preactjs/signals/issues/228
						await tick();
						ref.querySelector(
							'.wp-block-navigation-item > *:first-child'
						).focus();
					}
				},
			},
		},
	},
} );
