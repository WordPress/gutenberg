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

/**
 * Hamburger-to-close morph animation.
 *
 * When a Navigation block has a custom overlay with a Navigation Overlay Close
 * block, the hamburger icon flies to the close button's position while its two
 * horizontal lines morph into an X. The reverse plays on close.
 */
const MORPH_DURATION = 350;
const MORPH_EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';

// Morphed-state transforms for the two hamburger lines. Mirror of the
// .is-morphed CSS rules in style.scss; driven via WAAPI so the morph
// fires reliably in both directions (CSS transitions on
// freshly-inserted elements can fail to trigger).
const MORPH_LINE_TRANSFORM = [
	'translateY(3.75px) rotate(45deg) scaleX(1.24)',
	'translateY(-3.75px) rotate(-45deg) scaleX(1.24)',
];
const MORPH_LINE_IDENTITY = 'translateY(0) rotate(0) scaleX(1)';

/**
 * Animate a phantom's two hamburger-line rects from one transform to another.
 *
 * @param {HTMLElement} phantom - The phantom element.
 * @param {boolean}     toMorphed - true to animate horizontal lines → X;
 *                                  false to animate X → horizontal lines.
 */
function animatePhantomLines( phantom, toMorphed ) {
	const lines = phantom.querySelectorAll(
		'.wp-block-navigation__hamburger-line'
	);
	lines.forEach( ( line, i ) => {
		line.animate(
			toMorphed
				? [
						{ transform: MORPH_LINE_IDENTITY },
						{ transform: MORPH_LINE_TRANSFORM[ i ] },
				  ]
				: [
						{ transform: MORPH_LINE_TRANSFORM[ i ] },
						{ transform: MORPH_LINE_IDENTITY },
				  ],
			{
				duration: MORPH_DURATION,
				easing: MORPH_EASING,
				fill: 'forwards',
			}
		);
	} );
}

// Track active morph animations per navigation block element.
const activeMorphAnimations = new WeakMap();

/**
 * Whether morph animation should play (respects reduced motion preference).
 *
 * @return {boolean} True if animation should play.
 */
function shouldAnimateMorph() {
	return ! window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches;
}

/**
 * Cancel and clean up any in-progress morph animation for a navigation block.
 *
 * @param {HTMLElement} nav - The navigation block element.
 */
function cleanupMorphAnimation( nav ) {
	const morph = activeMorphAnimations.get( nav );
	if ( morph ) {
		morph.animation?.cancel();
		morph.phantom?.remove();
		if ( morph.closeBtn ) {
			morph.closeBtn.style.visibility = '';
		}
		activeMorphAnimations.delete( nav );
	}
}

/**
 * Create a phantom element (clone of the hamburger button) for the flight
 * animation. The phantom is positioned fixed above the overlay and is inert
 * (no click handlers, not focusable, hidden from screen readers).
 *
 * @param {HTMLElement} hamburgerBtn - The hamburger button to clone.
 * @param {boolean}     isMorphed   - Whether to start in the morphed (X) state.
 * @return {HTMLElement} The phantom element, already appended to document.body.
 */
function createMorphPhantom( hamburgerBtn, isMorphed ) {
	const phantom = hamburgerBtn.cloneNode( true );
	// Remove Interactivity API directives so the clone is inert.
	phantom.removeAttribute( 'data-wp-on--click' );
	phantom.removeAttribute( 'data-wp-on--keydown' );
	phantom.setAttribute( 'aria-hidden', 'true' );
	phantom.setAttribute( 'tabindex', '-1' );
	phantom.classList.add( 'wp-block-navigation__morph-phantom' );
	phantom.style.position = 'fixed';
	phantom.style.zIndex = '100001';
	phantom.style.pointerEvents = 'none';
	phantom.style.margin = '0';
	// Inherit the computed color so the phantom matches the hamburger's theme.
	phantom.style.color = window.getComputedStyle( hamburgerBtn ).color;
	if ( isMorphed ) {
		phantom.classList.add( 'is-morphed' );
	}
	document.body.appendChild( phantom );
	return phantom;
}

/**
 * Run the open morph animation: hamburger flies to close button, lines → X.
 *
 * @param {HTMLElement} nav          - The navigation block element.
 * @param {HTMLElement} hamburgerBtn - The hamburger button element.
 * @param {HTMLElement} closeBtn     - The overlay close button element.
 * @param {DOMRect}     startRect   - The hamburger's bounding rect (captured before overlay opened).
 */
function runOpenMorphAnimation( nav, hamburgerBtn, closeBtn, startRect ) {
	cleanupMorphAnimation( nav );

	if ( ! shouldAnimateMorph() ) {
		return;
	}

	requestAnimationFrame( () => {
		const endRect = closeBtn.getBoundingClientRect();

		// Hide the real close button during the animation.
		closeBtn.style.visibility = 'hidden';

		// Create phantom at the hamburger's captured position (un-morphed).
		const phantom = createMorphPhantom( hamburgerBtn, false );
		phantom.style.top = startRect.top + 'px';
		phantom.style.left = startRect.left + 'px';

		// Calculate the translation to fly from hamburger to close button,
		// centering on the close button's position.
		const dx =
			endRect.left +
			( endRect.width - startRect.width ) / 2 -
			startRect.left;
		const dy =
			endRect.top +
			( endRect.height - startRect.height ) / 2 -
			startRect.top;

		animatePhantomLines( phantom, true );

		const animation = phantom.animate(
			[
				{ transform: 'translate(0, 0)' },
				{
					transform: `translate(${ dx }px, ${ dy }px)`,
				},
			],
			{
				duration: MORPH_DURATION,
				easing: MORPH_EASING,
				fill: 'forwards',
			}
		);

		activeMorphAnimations.set( nav, {
			animation,
			phantom,
			closeBtn,
		} );

		animation.onfinish = () => {
			phantom.remove();
			closeBtn.style.visibility = '';
			activeMorphAnimations.delete( nav );
		};
	} );
}

/**
 * Run the close morph animation: X flies back to hamburger, lines restore.
 *
 * @param {HTMLElement} nav           - The navigation block element.
 * @param {HTMLElement} hamburgerBtn  - The hamburger button element.
 * @param {HTMLElement} closeBtn      - The overlay close button element.
 * @param {DOMRect}     hamburgerRect - The hamburger's original bounding rect.
 * @param {Function}    onComplete    - Callback to run after animation finishes.
 */
function runCloseMorphAnimation(
	nav,
	hamburgerBtn,
	closeBtn,
	hamburgerRect,
	onComplete
) {
	cleanupMorphAnimation( nav );

	if ( ! shouldAnimateMorph() ) {
		onComplete();
		return;
	}

	const closeRect = closeBtn.getBoundingClientRect();

	// Hide the real close button.
	closeBtn.style.visibility = 'hidden';

	// Create the phantom without the morphed class; WAAPI applies the
	// X transform as its first keyframe and then animates back.
	const phantom = createMorphPhantom( hamburgerBtn, false );
	phantom.style.top = closeRect.top + 'px';
	phantom.style.left = closeRect.left + 'px';

	const dx =
		hamburgerRect.left +
		( hamburgerRect.width - closeRect.width ) / 2 -
		closeRect.left;
	const dy =
		hamburgerRect.top +
		( hamburgerRect.height - closeRect.height ) / 2 -
		closeRect.top;

	animatePhantomLines( phantom, false );

	const animation = phantom.animate(
		[
			{ transform: 'translate(0, 0)' },
			{ transform: `translate(${ dx }px, ${ dy }px)` },
		],
		{
			duration: MORPH_DURATION,
			easing: MORPH_EASING,
			fill: 'forwards',
		}
	);

	activeMorphAnimations.set( nav, { animation, phantom, closeBtn } );

	animation.onfinish = () => {
		phantom.remove();
		activeMorphAnimations.delete( nav );
		onComplete();
	};
}

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

				// Capture hamburger position before the overlay covers it.
				// Only for the "handle" icon variant (has rect-based SVG lines).
				if (
					ref.querySelector(
						'.wp-block-navigation__hamburger-line'
					)
				) {
					const rect = ref.getBoundingClientRect();
					ctx.morphStartRect = {
						top: rect.top,
						left: rect.left,
						width: rect.width,
						height: rect.height,
					};
				}

				actions.openMenu( 'click' );
			},
			closeMenuOnClick() {
				const ctx = getContext();
				const { ref } = getElement();

				// Check if the reverse morph animation should play.
				// Applies to both the default close button and the custom
				// Navigation Overlay Close block.
				if (
					ctx.morphStartRect &&
					( ref.classList.contains(
						'wp-block-navigation-overlay-close'
					) ||
						ref.classList.contains(
							'wp-block-navigation__responsive-container-close'
						) )
				) {
					const nav = ref.closest( '.wp-block-navigation' );
					const hamburgerBtn = nav?.querySelector(
						'.wp-block-navigation__responsive-container-open'
					);

					if (
						nav &&
						hamburgerBtn &&
						hamburgerBtn.querySelector(
							'.wp-block-navigation__hamburger-line'
						)
					) {
						runCloseMorphAnimation(
							nav,
							hamburgerBtn,
							ref,
							ctx.morphStartRect,
							() => {
								actions.closeMenu( 'click' );
								actions.closeMenu( 'focus' );
							}
						);
						return;
					}
				}

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

					// Trigger the open morph animation if applicable.
					if ( ctx.morphStartRect ) {
						const nav = ref.closest( '.wp-block-navigation' );
						const hamburgerBtn = nav?.querySelector(
							'.wp-block-navigation__responsive-container-open'
						);
						const closeBtn = ref.querySelector(
							'.wp-block-navigation-overlay-close, .wp-block-navigation__responsive-container-close'
						);

						if ( nav && hamburgerBtn && closeBtn ) {
							// Suppress the overlay's translateY fade-in
							// animation. Any transform on an ancestor makes
							// it the containing block for position: fixed
							// descendants, which would otherwise drag the
							// close button as the transform animates away
							// and cause a snap at the end of the morph.
							ref.style.animation = 'none';
							ref.style.transform = 'none';

							// Anchor the close button to the hamburger's
							// exact viewport position so the morph ends
							// where it started.
							closeBtn.style.position = 'fixed';
							closeBtn.style.top =
								ctx.morphStartRect.top + 'px';
							closeBtn.style.left =
								ctx.morphStartRect.left + 'px';
							closeBtn.style.right = 'auto';

							runOpenMorphAnimation(
								nav,
								hamburgerBtn,
								closeBtn,
								ctx.morphStartRect
							);
						}
					}
				} else if ( ctx.type === 'overlay' ) {
					// Menu closed — clean up any in-progress morph animation
					// (e.g. if Escape was pressed during a close animation).
					const nav = ref.closest( '.wp-block-navigation' );
					if ( nav ) {
						cleanupMorphAnimation( nav );
					}
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
