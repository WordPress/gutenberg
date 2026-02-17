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
 * Minimum width for submenus in pixels.
 * This matches the min-width: 200px set in the CSS for .wp-block-navigation__submenu-container.
 */
const SUBMENU_MIN_WIDTH = 200;

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

/**
 * Checks if a submenu would overflow the viewport horizontally.
 * If it would overflow, adds a class to open it downward instead.
 *
 * @param {HTMLElement} submenuContainer - The submenu container element
 */
function checkSubmenuOverflow( submenuContainer ) {
	if ( ! submenuContainer ) {
		return;
	}

	const parentItem = submenuContainer.closest( '.has-child' );
	if ( ! parentItem ) {
		return;
	}

	// Check if this is a nested submenu (not a top-level submenu)
	// Nested submenus always follow the default behavior, so skip the check
	const isNested = parentItem.closest(
		'.wp-block-navigation__submenu-container'
	);
	if ( isNested ) {
		return;
	}

	// Remove the class first to get accurate measurements
	parentItem.classList.remove( 'open-downward' );

	// Only check for overflow on medium+ breakpoints (782px+)
	// where submenus open horizontally
	if ( ! window.matchMedia( '(min-width: 782px)' ).matches ) {
		return;
	}

	// Get the parent's position
	const parentRect = parentItem.getBoundingClientRect();
	const viewportWidth = window.innerWidth;

	// Temporarily make submenu visible to measure it
	// Save only explicitly set inline styles (not CSS-defined styles)
	const hadInlineVisibility = submenuContainer.style.visibility !== '';
	const hadInlineDisplay = submenuContainer.style.display !== '';
	const hadInlinePosition = submenuContainer.style.position !== '';

	const originalVisibility = submenuContainer.style.visibility;
	const originalDisplay = submenuContainer.style.display;
	const originalPosition = submenuContainer.style.position;

	// Batch style changes for better performance
	submenuContainer.style.cssText +=
		'visibility: visible; display: flex; position: absolute;';

	// Get the submenu width (use scrollWidth for accuracy)
	const submenuWidth = Math.max(
		submenuContainer.offsetWidth,
		submenuContainer.scrollWidth,
		SUBMENU_MIN_WIDTH
	);

	// Restore original inline styles or remove if they weren't set
	submenuContainer.style.visibility = hadInlineVisibility
		? originalVisibility
		: '';
	submenuContainer.style.display = hadInlineDisplay ? originalDisplay : '';
	submenuContainer.style.position = hadInlinePosition ? originalPosition : '';

	// Calculate where the right edge of the submenu would be
	// if it opens to the right
	const submenuRightEdge = parentRect.right + submenuWidth;

	// If submenu would overflow viewport, open it downward instead
	if ( submenuRightEdge > viewportWidth ) {
		parentItem.classList.add( 'open-downward' );
	}
}

// This is a fix for Safari in iOS/iPadOS. Without it, Safari doesn't focus out
// when the user taps in the body. It can be removed once we add an overlay to
// capture the clicks, instead of relying on the focusout event.
document.addEventListener( 'click', () => {} );

const { state, actions } = store(
	'core/navigation',
	{
		state: {
			get roleAttribute() {
				const ctx = getContext();
				return ctx.type === 'overlay' && state.isMenuOpen
					? 'dialog'
					: null;
			},
			get ariaModal() {
				const ctx = getContext();
				return ctx.type === 'overlay' && state.isMenuOpen
					? 'true'
					: null;
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
				const { ref } = getElement();
				state.menuOpenedBy[ menuOpenedOn ] = true;
				if ( type === 'overlay' ) {
					// Add a `has-modal-open` class to the <html> root.
					document.documentElement.classList.add( 'has-modal-open' );
				}
				// Check for submenu overflow when opening
				if ( type === 'submenu' && ref ) {
					const submenuContainer = ref.querySelector(
						'.wp-block-navigation__submenu-container'
					);
					checkSubmenuOverflow( submenuContainer );
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
				const { ref } = getElement();
				if ( state.isMenuOpen ) {
					const focusableElements = getFocusableElements( ref );
					focusableElements?.[ 0 ]?.focus();
				}
			},
		},
	},
	{ lock: true }
);
