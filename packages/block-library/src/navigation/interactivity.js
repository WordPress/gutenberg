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
					// Review how to move this to a selector or something similar
					context.roleAttribute = 'dialog';
					context.menuButton = ref;
					// It adds a `has-modal-open` class to the <html> root
					document.documentElement.classList.add( 'has-modal-open' );
				},
				closeMenu: ( { context } ) => {
					context.isMenuOpen = false;
					// Review how to move this to a selector or something similar
					context.roleAttribute = '';
					context.focusedElement = null;
					context.menuButton.focus();
					// It removes the `has-modal-open` class to the <html> root
					document.documentElement.classList.remove(
						'has-modal-open'
					);
				},
			},
		},
	},
	effects: {
		core: {
			navigation: {
				focusElement: async ( {
					actions,
					context,
					tick,
					ref,
					event,
				} ) => {
					if ( context.isMenuOpen ) {
						if (
							event?.key &&
							event.key !== 'Escape' &&
							event.key !== 'Tab'
						) {
							return;
						}

						// On ESC, close the menu and focus the hamburger button
						if ( event?.key === 'Escape' ) {
							actions.core.navigation.closeMenu( { context } );
							return;
						}

						// Until useSignalEffects is fixed: https://github.com/preactjs/signals/issues/228
						await tick();

						// Focus the first element when menu is open
						if ( ! context.focusedElement ) {
							ref.querySelector( 'a:first-child' ).focus();
						}

						// Focus the close button when it gets out of the modal
						if ( event?.key === 'Tab' ) {
							if (
								// Due to linting, it is used `ref.ownerDocument` instead of `document`
								ref.ownerDocument.activeElement.closest(
									'.is-menu-open'
								) !== ref
							) {
								ref.querySelector( 'button' ).focus();
							}
						}

						context.focusedElement =
							ref.ownerDocument.activeElement;
					}
				},
			},
		},
	},
} );
