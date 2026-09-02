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

// Matches the `min-width` the stylesheet gives a submenu once it is shown.
const SUBMENU_MIN_WIDTH = '200px';

/**
 * Measures how far a submenu tree would extend if every level were open.
 *
 * Closed submenus are collapsed to `width: 0`, so they cannot be measured as
 * they are. Each level is given its open dimensions, read, and restored within
 * the same synchronous block, so nothing is painted in between.
 *
 * @param {HTMLElement}   item       The `has-child` item that owns the tree.
 * @param {HTMLElement[]} containers Every submenu container in the tree.
 * @param {string}        direction  Direction to lay the tree out in.
 *
 * @return {{left: number, right: number}} Bounds of the widest chain.
 */
function measureSubmenuTree( item, containers, direction ) {
	const previousStyles = containers.map( ( el ) => el.getAttribute( 'style' ) );
	const wasOpenOnLeft = item.classList.contains( 'open-on-left' );
	const wasOpenOnRight = item.classList.contains( 'open-on-right' );

	item.classList.toggle( 'open-on-left', direction === 'left' );
	item.classList.toggle( 'open-on-right', direction === 'right' );

	containers.forEach( ( el ) => {
		// `important` so these survive whatever the stylesheet sets while the
		// submenu is closed.
		el.style.setProperty( 'visibility', 'hidden', 'important' );
		el.style.setProperty( 'width', 'auto', 'important' );
		el.style.setProperty( 'height', 'auto', 'important' );
		el.style.setProperty( 'overflow', 'visible', 'important' );
		el.style.setProperty( 'min-width', SUBMENU_MIN_WIDTH, 'important' );
	} );

	let left = Infinity;
	let right = -Infinity;
	containers.forEach( ( el ) => {
		const rect = el.getBoundingClientRect();
		left = Math.min( left, rect.left );
		right = Math.max( right, rect.right );
	} );

	containers.forEach( ( el, index ) => {
		if ( previousStyles[ index ] === null ) {
			el.removeAttribute( 'style' );
		} else {
			el.setAttribute( 'style', previousStyles[ index ] );
		}
	} );
	item.classList.toggle( 'open-on-left', wasOpenOnLeft );
	item.classList.toggle( 'open-on-right', wasOpenOnRight );

	return { left, right };
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
			get isSubmenuOpen() {
				const ctx = getContext();
				// Once the overlay itself is open, its styles always expand
				// every submenu regardless of hover/click/focus state, so the
				// toggle's `aria-expanded` should reflect that immediately
				// instead of waiting for a hover/click/focus interaction.
				const isOverlayOpen =
					Object.values( ctx.overlayOpenedBy || {} ).filter( Boolean )
						.length > 0;
				return isOverlayOpen || state.isMenuOpen;
			},
		},
		actions: {
			openMenuOnHover( event ) {
				// Pointer events from touch should not open the submenu on hover;
				// touch devices toggle via the click action instead.
				if ( event?.pointerType === 'touch' ) {
					return;
				}
				const { type } = getContext();
				if ( type === 'submenu' ) {
					actions.openMenu( 'hover' );
				}
			},
			closeMenuOnHover( event ) {
				if ( event?.pointerType === 'touch' ) {
					return;
				}
				const { type } = getContext();
				if ( type === 'submenu' ) {
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
					// Also clear hover in case it was set by a synthetic pointerenter
					// on touch (e.g. the browser-fired mouseenter-equivalent before
					// the click event), ensuring the submenu fully closes.
					actions.closeMenu( 'hover' );
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
			checkSubmenuPosition() {
				const { type } = getContext();

				// Only check positioning for submenus, not overlays
				if ( type !== 'submenu' ) {
					return;
				}

				if ( ! state.isMenuOpen ) {
					return;
				}

				const { ref } = getElement();

				// Only the outermost submenu picks a direction. Nested submenus
				// inherit it, so the whole tree opens the same way.
				if ( ref.closest( '.wp-block-navigation__submenu-container' ) ) {
					return;
				}

				const submenuContainer = ref.querySelector(
					':scope > .wp-block-navigation__submenu-container'
				);

				if ( ! submenuContainer ) {
					return;
				}

				// Every level in the tree, not just the one being opened. A
				// submenu that fits on its own can still have a child that does
				// not, and each level is offset further along than its parent.
				const containers = [
					submenuContainer,
					...submenuContainer.querySelectorAll(
						'.wp-block-navigation__submenu-container'
					),
				];

				// `clientWidth` rather than `innerWidth`, which counts the
				// scrollbar as usable space.
				const viewportWidth = document.documentElement.clientWidth;
				const openedRight = measureSubmenuTree( ref, containers, 'right' );
				const openedLeft = measureSubmenuTree( ref, containers, 'left' );

				const rightOverflow = openedRight.right - viewportWidth;
				const leftOverflow = -openedLeft.left;

				// Determine optimal positioning
				if ( rightOverflow <= 0 && leftOverflow <= 0 ) {
					// Fits either way - use default positioning
					ref.classList.remove( 'open-on-left' );
					ref.classList.remove( 'open-on-right' );
				} else if ( leftOverflow < rightOverflow ) {
					// Open left, either because opening right overflows or -
					// when a tree is too deep to fit either way - because it
					// spills less than opening right would.
					ref.classList.add( 'open-on-left' );
					ref.classList.remove( 'open-on-right' );
				} else {
					// Open right, on the same terms.
					ref.classList.add( 'open-on-right' );
					ref.classList.remove( 'open-on-left' );
				}
			},
		},
	},
	{ lock: true }
);
