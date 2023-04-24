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
				openSubmenu: ( { context, ref } ) => {
					context.isSubmenuOpen = true;
					context.submenuButton = ref;
				},
				closeSubmenu: ( { context } ) => {
					context.isSubmenuOpen = false;
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
							ref.querySelector(
								'.wp-block-navigation-item > *:first-child'
							).focus();
						}

						// Focus the close button when it gets out of the modal
						if ( event?.key === 'Tab' ) {
							if (
								window.document.activeElement.closest(
									'.is-menu-open'
								) !== ref
							) {
								ref.querySelector(
									'button.wp-block-navigation__responsive-container-close'
								).focus();
							}
						}

						context.focusedElement = window.document.activeElement;
					}
				},
				handleSubmenu: async ( { actions, context, ref, tick } ) => {
					if ( context.isSubmenuOpen ) {
						async function closeSubmenu( e ) {
							// Until useSignalEffects is fixed: https://github.com/preactjs/signals/issues/228
							await tick();
							// Only close submenu if it gets outside of it while tabbing
							if (
								e.key &&
								e.key !== 'Escape' &&
								ref.contains( window.document.activeElement )
							) {
								return;
							}

							if (
								e.key === 'Escape' ||
								! ref.contains( window.document.activeElement )
							) {
								document.removeEventListener(
									'click',
									closeSubmenu
								);
								document.removeEventListener(
									'keydown',
									closeSubmenu
								);

								actions.core.navigation.closeSubmenu( {
									context,
								} );
							}

							// Return focus to the button when closing with "Escape"
							if ( e.key === 'Escape' ) {
								context.submenuButton.focus();
							}
						}

						// Until useSignalEffects is fixed: https://github.com/preactjs/signals/issues/228
						await tick();
						document.addEventListener( 'click', closeSubmenu );
						document.addEventListener( 'keydown', closeSubmenu );
					}
				},
			},
		},
	},
} );
