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

/**
 * Measures how far a submenu tree would extend if every level were open, once
 * for each direction it could open in.
 *
 * Closed submenus are collapsed to `width: 0`, so they cannot be measured as
 * they are. Every level is given its open dimensions, measured in both
 * directions, then restored within the same synchronous block, so nothing is
 * painted in between.
 *
 * The bounds span every container in the tree rather than the chain being
 * opened: a single direction is applied to the whole tree, so it has to suit
 * whichever branch is opened next.
 *
 * @param {HTMLElement}   item       The `has-child` item that owns the tree.
 * @param {HTMLElement[]} containers Every submenu container in the tree, the
 *                                   already-open first level first.
 *
 * @return {Object} Bounds of the tree keyed by the direction applied to it.
 */
function measureSubmenuTree( item, containers ) {
	const previousStyles = containers.map( ( el ) =>
		el.getAttribute( 'style' )
	);
	const wasOpenOnLeft = item.classList.contains( 'open-on-left' );
	const wasOpenOnRight = item.classList.contains( 'open-on-right' );

	// The first level is already open, so this is the `min-width` that is
	// really in effect, whether it comes from the stylesheet or from a theme.
	const { minWidth } = window.getComputedStyle( containers[ 0 ] );

	function measure( direction ) {
		item.classList.toggle( 'open-on-left', direction === 'left' );
		item.classList.toggle( 'open-on-right', direction === 'right' );

		let left = Infinity;
		let right = -Infinity;
		containers.forEach( ( el ) => {
			const rect = el.getBoundingClientRect();
			left = Math.min( left, rect.left );
			right = Math.max( right, rect.right );
		} );

		return { left, right };
	}

	let bounds;
	try {
		containers.forEach( ( el ) => {
			// `important` so these survive whatever the stylesheet sets
			// while the submenu is closed.
			el.style.setProperty( 'visibility', 'hidden', 'important' );
			el.style.setProperty( 'width', 'auto', 'important' );
			el.style.setProperty( 'height', 'auto', 'important' );
			el.style.setProperty( 'overflow', 'visible', 'important' );
			el.style.setProperty( 'min-width', minWidth, 'important' );
		} );

		bounds = { left: measure( 'left' ), right: measure( 'right' ) };
	} finally {
		// A tree left at `visibility: hidden` has no way back, so restore it
		// even if measuring threw part way through.
		containers.forEach( ( el, index ) => {
			if ( previousStyles[ index ] === null ) {
				el.removeAttribute( 'style' );
			} else {
				el.setAttribute( 'style', previousStyles[ index ] );
			}
		} );
		item.classList.toggle( 'open-on-left', wasOpenOnLeft );
		item.classList.toggle( 'open-on-right', wasOpenOnRight );
	}

	return bounds;
}

/**
 * Picks the direction a submenu tree opens in so that it stays inside the
 * viewport, and applies it to the item that owns the tree.
 *
 * @param {HTMLElement} item The outermost `has-child` item of the tree.
 */
function applySubmenuDirection( item ) {
	// Inside an open overlay every level is laid out in flow, so there is no
	// direction to pick and nothing the classes could change.
	const overlaySelector =
		'.wp-block-navigation__responsive-container.is-menu-open';
	if ( item.closest( overlaySelector ) ) {
		return;
	}

	const submenuContainer = item.querySelector(
		':scope > .wp-block-navigation__submenu-container'
	);

	if ( ! submenuContainer ) {
		return;
	}

	// Every level in the tree, not just the one being opened. A submenu that
	// fits on its own can still have a child that does not, and each level is
	// offset further along than its parent.
	const containers = [
		submenuContainer,
		...submenuContainer.querySelectorAll(
			'.wp-block-navigation__submenu-container'
		),
	];

	const bounds = measureSubmenuTree( item, containers );

	// `clientWidth` rather than `innerWidth`, which counts the scrollbar as
	// usable space.
	const viewportWidth = document.documentElement.clientWidth;

	// Score both edges of each layout. Which way a class opens is up to the
	// stylesheet - `open-on-left` opens rightward once the CSS is flipped for
	// right-to-left languages - so neither class can be assumed to overflow on
	// one side only.
	const spill = ( { left, right } ) =>
		Math.max( 0, -left ) + Math.max( 0, right - viewportWidth );
	const leftSpill = spill( bounds.left );
	const rightSpill = spill( bounds.right );

	if ( leftSpill === 0 && rightSpill === 0 ) {
		// Fits either way, so leave the stylesheet's own positioning alone.
		item.classList.remove( 'open-on-left' );
		item.classList.remove( 'open-on-right' );
	} else if ( leftSpill < rightSpill ) {
		// Open left, either because opening right overflows or - when a tree
		// is too deep to fit either way - because it spills less than opening
		// right would.
		item.classList.add( 'open-on-left' );
		item.classList.remove( 'open-on-right' );
	} else {
		// Open right, on the same terms.
		item.classList.add( 'open-on-right' );
		item.classList.remove( 'open-on-left' );
	}
}

// Trees that are open right now, so their direction can be measured again when
// the viewport changes under them.
const openSubmenuTrees = new Set();

let submenuDirectionTimeout;
window.addEventListener( 'resize', () => {
	window.clearTimeout( submenuDirectionTimeout );
	submenuDirectionTimeout = window.setTimeout( () => {
		openSubmenuTrees.forEach( ( item ) => {
			if ( item.isConnected ) {
				applySubmenuDirection( item );
			} else {
				openSubmenuTrees.delete( item );
			}
		} );
	}, 100 );
} );

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

				// Only submenus open to one side; overlays do not.
				if ( type !== 'submenu' ) {
					return;
				}

				const { ref } = getElement();

				// Only the outermost item of a tree carries a direction. Nested
				// levels inherit it, so the whole tree opens the same way.
				let item = ref;
				let parent = item.parentElement?.closest( 'li.has-child' );
				while ( parent ) {
					item = parent;
					parent = item.parentElement?.closest( 'li.has-child' );
				}

				if ( ! state.isMenuOpen ) {
					// A nested level closing leaves the tree itself open.
					if ( ref === item ) {
						openSubmenuTrees.delete( item );
					}
					return;
				}

				openSubmenuTrees.add( item );

				// Measured again whenever a level opens, rather than trusting a
				// direction that may have been picked at a different viewport
				// width.
				applySubmenuDirection( item );
			},
		},
	},
	{ lock: true }
);
