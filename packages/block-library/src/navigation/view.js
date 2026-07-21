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
			openMenuOnHover( event ) {
				// Pointer events from touch should not open the submenu on hover;
				// touch devices toggle via the click action instead.
				if ( event?.pointerType === 'touch' ) {
					return;
				}
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
			closeMenuOnHover( event ) {
				if ( event?.pointerType === 'touch' ) {
					return;
				}
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
				// Remember which element opened the overlay so the close
				// button can be placed in the same spot instead of jumping
				// to a hard-coded corner. See #49402. We store a reference
				// rather than a computed rect so position is always
				// re-measured fresh (e.g. after a resize), and so this
				// never forces a synchronous layout on click.
				if ( ctx.type === 'overlay' ) {
					ctx.toggleButtonRef = ref;
				}
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
					// See comment in `openMenuOnClick` above. Gated to
					// overlay-type toggles only, so submenu clicks (which
					// also go through this action) don't do any extra work.
					if ( ctx.type === 'overlay' ) {
						ctx.toggleButtonRef = ref;
					}
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
			// Positions the default overlay close button so that it lands
			// exactly where the toggle (burger) button was, instead of a
			// fixed top-right corner that rarely matches the toggle's real
			// position in the theme's layout. See #49402.
			//
			// Because the close button can now end up anywhere vertically
			// (not just pinned to the top), it also pushes the menu content
			// down far enough to always clear the button, via a CSS custom
			// property the stylesheet falls back from.
			positionCloseButton() {
				const ctx = getContext();

				// Only the top-level overlay uses this positioning strategy;
				// submenus keep their own (unrelated) close behavior.
				if ( ctx.type !== 'overlay' ) {
					return;
				}

				const { ref } = getElement();
				const dialog = ref.closest(
					'.wp-block-navigation__responsive-dialog'
				);

				// Nothing to align to, or the overlay isn't open: reset to
				// the CSS-defined defaults so we don't leave stale inline
				// styles/vars lying around, and tear down any resize
				// listener left over from the previous open state.
				if ( ! state.isMenuOpen || ! ctx.toggleButtonRef ) {
					if ( ctx.closeButtonResizeHandler ) {
						window.removeEventListener(
							'resize',
							ctx.closeButtonResizeHandler
						);
						ctx.closeButtonResizeHandler = null;
					}
					ref.style.removeProperty( 'top' );
					ref.style.removeProperty( 'right' );
					ref.style.removeProperty( 'left' );
					dialog?.style.removeProperty(
						'--wp-navigation-overlay-content-offset'
					);
					return;
				}

				if ( ! dialog ) {
					return;
				}

				// Measure the close button's own box *before* moving it —
				// repositioning via top/right doesn't change its size, so
				// this lets us compute the content offset without a second
				// forced layout read after writing the new position.
				const closeButtonHeight = ref.offsetHeight;
				const rootFontSize =
					parseFloat(
						window.getComputedStyle( document.documentElement )
							.fontSize
					) || 16;
				// Keep the same breathing room the static default used
				// (2rem) below the close button's bottom edge.
				const gap = rootFontSize * 2;

				const applyPosition = () => {
					const dialogRect = dialog.getBoundingClientRect();
					const openRect =
						ctx.toggleButtonRef.getBoundingClientRect();

					ref.style.top = `${ openRect.top - dialogRect.top }px`;
					ref.style.right = `${
						dialogRect.right - openRect.right
					}px`;
					ref.style.left = 'auto';

					const contentOffset =
						openRect.top - dialogRect.top + closeButtonHeight + gap;

					dialog.style.setProperty(
						'--wp-navigation-overlay-content-offset',
						`${ contentOffset }px`
					);
				};

				applyPosition();

				// `data-wp-watch` re-runs when reactive state/context it
				// reads changes (e.g. isMenuOpen), but not on viewport
				// resize. Track the position manually while the overlay
				// stays open so it doesn't go stale; tear down above once
				// the overlay closes.
				if ( ! ctx.closeButtonResizeHandler ) {
					ctx.closeButtonResizeHandler = applyPosition;
					window.addEventListener( 'resize', applyPosition );
				}
			},
		},
	},
	{ lock: true }
);
