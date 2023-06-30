/**
 * WordPress dependencies
 */
import { store } from '@wordpress/interactivity';

const focusableSelectors = [
	'a[href]',
	'area[href]',
	'input:not([disabled]):not([type="hidden"]):not([aria-hidden])',
	'select:not([disabled]):not([aria-hidden])',
	'textarea:not([disabled]):not([aria-hidden])',
	'button:not([disabled]):not([aria-hidden])',
	'iframe',
	'object',
	'embed',
	'[contenteditable]',
	'[tabindex]:not([tabindex^="-"])',
];

const openMenu = ( { context, ref }, menuOpenedOn ) => {
	context.core.navigation.isMenuOpen[ menuOpenedOn ] = true;
	context.core.navigation.previousFocus = ref;
	if ( context.core.navigation.overlay ) {
		// Add a `has-modal-open` class to the <html> root.
		document.documentElement.classList.add( 'has-modal-open' );
	}
};

const closeMenu = ( { context, selectors }, menuClosedOn ) => {
	context.core.navigation.isMenuOpen[ menuClosedOn ] = false;
	// Check if the menu is still open or not.
	if ( ! selectors.core.navigation.isMenuOpen( { context } ) ) {
		if (
			context.core.navigation.modal?.contains(
				window.document.activeElement
			)
		) {
			context.core.navigation.previousFocus.focus();
		}
		context.core.navigation.modal = null;
		context.core.navigation.previousFocus = null;
		if ( context.core.navigation.overlay ) {
			document.documentElement.classList.remove( 'has-modal-open' );
		}
	}
};

store( {
	effects: {
		core: {
			navigation: {
				initMenu: ( { context, selectors, ref } ) => {
					if ( selectors.core.navigation.isMenuOpen( { context } ) ) {
						const focusableElements =
							ref.querySelectorAll( focusableSelectors );
						context.core.navigation.modal = ref;
						context.core.navigation.firstFocusableElement =
							focusableElements[ 0 ];
						context.core.navigation.lastFocusableElement =
							focusableElements[ focusableElements.length - 1 ];
					}
				},
				focusFirstElement: ( { context, selectors, ref } ) => {
					if ( selectors.core.navigation.isMenuOpen( { context } ) ) {
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
				roleAttribute: ( { context, selectors } ) =>
					context.core.navigation.overlay &&
					selectors.core.navigation.isMenuOpen( { context } )
						? 'dialog'
						: '',
				isMenuOpen: ( { context } ) =>
					// The menu is opened if either `click` or `hover` is true.
					Object.values( context.core.navigation.isMenuOpen ).filter(
						Boolean
					).length > 0,
			},
		},
	},
	actions: {
		core: {
			navigation: {
				openMenuOnHover( args ) {
					openMenu( args, 'hover' );
				},
				closeMenuOnHover( args ) {
					closeMenu( args, 'hover' );
				},
				openMenuOnClick( args ) {
					openMenu( args, 'click' );
				},
				closeMenuOnClick( args ) {
					closeMenu( args, 'click' );
				},
				toggleMenuOnClick: ( args ) => {
					const { context } = args;
					if ( context.core.navigation.isMenuOpen.click ) {
						closeMenu( args, 'click' );
					} else {
						openMenu( args, 'click' );
					}
				},
				handleMenuKeydown: ( args ) => {
					const { context, event } = args;
					if ( context.core.navigation.isMenuOpen.click ) {
						// If Escape close the menu
						if (
							event?.key === 'Escape' ||
							event?.keyCode === 27
						) {
							closeMenu( args, 'click' );
							return;
						}

						// Trap focus if it is an overlay (main menu)
						if (
							context.core.navigation.overlay &&
							( event.key === 'Tab' || event.keyCode === 9 )
						) {
							// If shift + tab it change the direction
							if (
								event.shiftKey &&
								window.document.activeElement ===
									context.core.navigation
										.firstFocusableElement
							) {
								event.preventDefault();
								context.core.navigation.lastFocusableElement.focus();
							} else if (
								! event.shiftKey &&
								window.document.activeElement ===
									context.core.navigation.lastFocusableElement
							) {
								event.preventDefault();
								context.core.navigation.firstFocusableElement.focus();
							}
						}
					}
				},
				handleMenuFocusout: ( args ) => {
					const { context, event } = args;
					// If focus is outside modal, and in the document, close menu
					// event.target === The element losing focus
					// event.relatedTarget === The element receiving focus (if any)
					// When focusout is outsite the document,
					// `window.document.activeElement` doesn't change
					if (
						context.core.navigation.isMenuOpen.click &&
						! context.core.navigation.modal?.contains(
							event.relatedTarget
						) &&
						event.target !== window.document.activeElement
					) {
						closeMenu( args, 'click' );
					}
				},
			},
		},
	},
} );
