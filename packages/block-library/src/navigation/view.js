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
 * Breakpoint above which submenus may open horizontally.
 * This matches the break-medium SCSS mixin.
 */
const BREAK_MEDIUM = 782;

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
 * Temporarily applies styles to measure an element's dimensions.
 *
 * @param {HTMLElement} element  - The element to measure.
 * @param {Function}    callback - Function to call while styles are applied.
 * @return {*} The callback's return value.
 */
function withMeasurementStyles( element, callback ) {
	const saved = {
		visibility: element.style.visibility,
		display: element.style.display,
		position: element.style.position,
	};

	element.style.visibility = 'visible';
	element.style.display = 'flex';
	element.style.position = 'absolute';

	const result = callback();

	for ( const [ prop, value ] of Object.entries( saved ) ) {
		if ( value ) {
			element.style[ prop ] = value;
		} else {
			element.style.removeProperty( prop );
		}
	}

	return result;
}

/**
 * Checks if a submenu would overflow the viewport horizontally.
 * Only adds the horizontal-opening class if the submenu will fit.
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

	// Top-level submenus always open downward, no overflow check needed.
	// Only nested items (inside a submenu container) need the horizontal check.
	if ( ! parentItem.closest( '.wp-block-navigation__submenu-container' ) ) {
		return;
	}

	const isLargeScreen = window.matchMedia(
		`(min-width: ${ BREAK_MEDIUM }px)`
	).matches;
	const hasClass = parentItem.classList.contains(
		'submenu-opens-on-horizontal-hover'
	);

	// On small screens, remove the class if present
	if ( ! isLargeScreen ) {
		if ( hasClass ) {
			parentItem.classList.remove( 'submenu-opens-on-horizontal-hover' );
		}
		return;
	}

	// Measure submenu width to check if it would fit horizontally
	const submenuWidth = withMeasurementStyles( submenuContainer, () =>
		Math.max(
			submenuContainer.offsetWidth,
			submenuContainer.scrollWidth,
			SUBMENU_MIN_WIDTH
		)
	);

	// Check if submenu would overflow
	const parentRect = parentItem.getBoundingClientRect();
	const wouldOverflow = parentRect.right + submenuWidth > window.innerWidth;

	// Only add the class if submenu will fit, remove it if it won't
	if ( wouldOverflow ) {
		if ( hasClass ) {
			parentItem.classList.remove( 'submenu-opens-on-horizontal-hover' );
		}
	} else if ( ! hasClass ) {
		parentItem.classList.add( 'submenu-opens-on-horizontal-hover' );
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
				// Check for submenu overflow when opening.
				// Use closest() to find the parent <li> since ref may be
				// the <li>, <button>, or <ul> depending on interaction type.
				if ( type === 'submenu' && ref ) {
					const parentItem = ref.closest( '.has-child' );
					if ( parentItem ) {
						const submenuContainer = parentItem.querySelector(
							'.wp-block-navigation__submenu-container'
						);
						checkSubmenuOverflow( submenuContainer );
					}
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
