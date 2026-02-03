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

/**
 * Gets all visible focusable elements within a container.
 * Filters out elements that are hidden.
 *
 * @param {HTMLElement} ref - The container element to search within
 * @return {HTMLElement[]} Array of visible focusable elements
 */
function getFocusableElements( ref ) {
	const focusableElements = ref.querySelectorAll( focusableSelectors );
	return Array.from( focusableElements ).filter( ( element ) => {
		// Use modern checkVisibility API if available (Chrome 105+, Firefox 106+, Safari 17.4+)
		if ( typeof element.checkVisibility === 'function' ) {
			return element.checkVisibility( {
				checkOpacity: false,
				checkVisibilityCSS: true,
			} );
		}
		// Fallback for older browsers
		return element.offsetParent !== null;
	} );
}

// This is a fix for Safari in iOS/iPadOS. Without it, Safari doesn't focus out
// when the user taps in the body. It can be removed once we add an overlay to
// capture the clicks, instead of relying on the focusout event.
document.addEventListener( 'click', () => {} );

const { state, actions } = store(
	'core/navigation',
	{
		state: {
			/**
			 * Global map of overlay states, keyed by overlay ID.
			 * Each overlay has: { isOpen, previousFocus, modal, firstFocusableElement, lastFocusableElement }
			 */
			overlays: {},

			/**
			 * Returns whether the current overlay (from context) is open.
			 * Used by footer-rendered overlays.
			 */
			get isOverlayOpen() {
				const ctx = getContext();
				if ( ctx.overlayId ) {
					return state.overlays[ ctx.overlayId ]?.isOpen || false;
				}
				return false;
			},

			get roleAttribute() {
				const ctx = getContext();
				// For footer overlays, use isOverlayOpen.
				if ( ctx.overlayId ) {
					return state.isOverlayOpen ? 'dialog' : null;
				}
				// Legacy: for inline overlays/submenus.
				return ctx.type === 'overlay' && state.isMenuOpen
					? 'dialog'
					: null;
			},
			get ariaModal() {
				const ctx = getContext();
				// For footer overlays, use isOverlayOpen.
				if ( ctx.overlayId ) {
					return state.isOverlayOpen ? 'true' : null;
				}
				// Legacy: for inline overlays/submenus.
				return ctx.type === 'overlay' && state.isMenuOpen
					? 'true'
					: null;
			},
			get ariaLabel() {
				const ctx = getContext();
				// For footer overlays, use isOverlayOpen.
				if ( ctx.overlayId ) {
					return state.isOverlayOpen ? ctx.ariaLabel : null;
				}
				// Legacy: for inline overlays/submenus.
				return ctx.type === 'overlay' && state.isMenuOpen
					? ctx.ariaLabel
					: null;
			},
			get isMenuOpen() {
				// The menu is opened if either `click`, `hover` or `focus` is true.
				return (
					Object.values( state.menuOpenedBy ).filter( Boolean )
						.length > 0
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
				) {
					actions.openMenu( 'hover' );
				}
			},
			closeMenuOnHover() {
				const { type, overlayOpenedBy } = getContext();
				if (
					type === 'submenu' &&
					// Only close on hover if the overlay is closed.
					Object.values( overlayOpenedBy || {} ).filter( Boolean )
						.length === 0
				) {
					actions.closeMenu( 'hover' );
				}
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
				if ( window.document.activeElement !== ref ) {
					ref.focus();
				}
				const { menuOpenedBy } = state;
				if ( menuOpenedBy.click || menuOpenedBy.focus ) {
					actions.closeMenu( 'click' );
					actions.closeMenu( 'focus' );
				} else {
					ctx.previousFocus = ref;
					actions.openMenu( 'click' );
				}
			},
			handleMenuKeydown: withSyncEvent( ( event ) => {
				const { type, firstFocusableElement, lastFocusableElement } =
					getContext();
				if ( state.menuOpenedBy.click ) {
					// If Escape close the menu.
					if ( event.key === 'Escape' ) {
						event.stopPropagation(); // Keeps ancestor menus open.
						actions.closeMenu( 'click' );
						actions.closeMenu( 'focus' );
						return;
					}

					// Trap focus if it is an overlay (main menu).
					if ( type === 'overlay' && event.key === 'Tab' ) {
						// If shift + tab it change the direction.
						if (
							event.shiftKey &&
							window.document.activeElement ===
								firstFocusableElement
						) {
							event.preventDefault();
							lastFocusableElement.focus();
						} else if (
							! event.shiftKey &&
							window.document.activeElement ===
								lastFocusableElement
						) {
							event.preventDefault();
							firstFocusableElement.focus();
						}
					}
				}
			} ),
			handleMenuFocusout: withSyncEvent( ( event ) => {
				const { modal, type } = getContext();
				// If focus is outside modal, and in the document, close menu
				// event.target === The element losing focus
				// event.relatedTarget === The element receiving focus (if any)
				// When focusout is outside the document,
				// `window.document.activeElement` doesn't change.

				// The event.relatedTarget is null when something outside the navigation menu is clicked. This is only necessary for Safari.
				if (
					event.relatedTarget === null ||
					( ! modal?.contains( event.relatedTarget ) &&
						event.target !== window.document.activeElement &&
						type === 'submenu' )
				) {
					actions.closeMenu( 'click' );
					actions.closeMenu( 'focus' );
				}
			} ),

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
					if (
						ctx.modal?.contains( window.document.activeElement )
					) {
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

			/**
			 * Opens a footer-rendered overlay by ID.
			 * Called from the toggle button with data-wp-overlay-id attribute.
			 */
			openOverlayById() {
				const { ref } = getElement();
				const overlayId = ref.dataset.wpOverlayId;
				if ( ! overlayId ) {
					return;
				}

				// Initialize overlay state if not exists.
				if ( ! state.overlays[ overlayId ] ) {
					state.overlays[ overlayId ] = {};
				}

				// Store the toggle button reference for focus restoration.
				state.overlays[ overlayId ].previousFocus = ref;
				state.overlays[ overlayId ].isOpen = true;

				// Add modal-open class to document.
				document.documentElement.classList.add( 'has-modal-open' );
			},

			/**
			 * Closes the current footer-rendered overlay.
			 * Uses the overlay ID from context.
			 */
			closeOverlayById() {
				const ctx = getContext();
				const overlayId = ctx.overlayId;
				if ( ! overlayId || ! state.overlays[ overlayId ] ) {
					return;
				}

				const overlayState = state.overlays[ overlayId ];
				overlayState.isOpen = false;

				// Restore focus to the toggle button.
				if (
					overlayState.modal?.contains(
						window.document.activeElement
					)
				) {
					overlayState.previousFocus?.focus();
				}

				// Remove modal-open class from document.
				document.documentElement.classList.remove( 'has-modal-open' );
			},

			/**
			 * Handles keydown events for footer-rendered overlays.
			 * Escape closes the overlay, Tab traps focus within.
			 */
			handleOverlayKeydown: withSyncEvent( ( event ) => {
				const ctx = getContext();
				const overlayId = ctx.overlayId;
				if ( ! overlayId || ! state.overlays[ overlayId ]?.isOpen ) {
					return;
				}

				const overlayState = state.overlays[ overlayId ];

				// Escape closes the overlay.
				if ( event.key === 'Escape' ) {
					event.stopPropagation();
					actions.closeOverlayById();
					return;
				}

				// Tab traps focus within the overlay.
				if ( event.key === 'Tab' ) {
					const { firstFocusableElement, lastFocusableElement } =
						overlayState;
					if ( ! firstFocusableElement || ! lastFocusableElement ) {
						return;
					}

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
			} ),

			/**
			 * Handles focusout events for footer-rendered overlays.
			 * Closes the overlay if focus moves outside.
			 */
			handleOverlayFocusout: withSyncEvent( ( event ) => {
				const ctx = getContext();
				const overlayId = ctx.overlayId;
				if ( ! overlayId || ! state.overlays[ overlayId ]?.isOpen ) {
					return;
				}

				const overlayState = state.overlays[ overlayId ];

				// Close if focus moves outside the overlay.
				// event.relatedTarget is null when clicking outside (Safari).
				if (
					event.relatedTarget === null ||
					( overlayState.modal &&
						! overlayState.modal.contains( event.relatedTarget ) )
				) {
					actions.closeOverlayById();
				}
			} ),
		},
		callbacks: {
			initMenu() {
				const ctx = getContext();
				const { ref } = getElement();
				if ( state.isMenuOpen ) {
					const focusableElements = getFocusableElements( ref );
					ctx.modal = ref;
					ctx.firstFocusableElement = focusableElements[ 0 ];
					ctx.lastFocusableElement =
						focusableElements[ focusableElements.length - 1 ];
				}
			},
			focusFirstElement() {
				const ctx = getContext();
				const { ref } = getElement();

				// For footer overlays, use isOverlayOpen.
				if ( ctx.overlayId ) {
					if ( state.isOverlayOpen ) {
						const focusableElements = getFocusableElements( ref );
						focusableElements?.[ 0 ]?.focus();
					}
					return;
				}

				// Legacy: for inline overlays/submenus.
				if ( state.isMenuOpen ) {
					const focusableElements = getFocusableElements( ref );
					focusableElements?.[ 0 ]?.focus();
				}
			},

			/**
			 * Initializes a footer-rendered overlay.
			 * Registers the modal DOM reference and focusable elements.
			 */
			initOverlay() {
				const ctx = getContext();
				const { ref } = getElement();
				const overlayId = ctx.overlayId;

				if ( ! overlayId ) {
					return;
				}

				// Initialize overlay state if not exists.
				if ( ! state.overlays[ overlayId ] ) {
					state.overlays[ overlayId ] = {};
				}

				const overlayState = state.overlays[ overlayId ];

				// Always register the modal reference.
				overlayState.modal = ref;

				// When overlay is open, calculate focusable elements.
				if ( overlayState.isOpen ) {
					const focusableElements = getFocusableElements( ref );
					overlayState.firstFocusableElement = focusableElements[ 0 ];
					overlayState.lastFocusableElement =
						focusableElements[ focusableElements.length - 1 ];
				}
			},
		},
	},
	{ lock: true }
);
