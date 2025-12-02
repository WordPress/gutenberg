/**
 * Frontend Edit Overlay
 *
 * Displays "Edit this" hover buttons on the site frontend for template parts and post content.
 */

( function () {
	// Configuration
	const OVERLAY_BUTTON_CLASS = 'wp-edit-overlay__button';
	const OVERLAY_VISIBLE_CLASS = 'wp-edit-overlay--visible';
	const DEBOUNCE_DELAY = 50;
	const ATTRIBUTE_TARGET = 'data-wp-edit-overlay-target';
	const ATTRIBUTE_URL = 'data-wp-edit-url';

	let debounceTimer = null;
	let scrollTimer = null;
	const overlayButtons = new WeakMap(); // Store overlay button for each element
	const hoveredElements = new Set(); // Track which elements are currently hovered
	let editableElements = [];

	/**
	 * Create the overlay button element positioned as a floating action button.
	 *
	 * @return {HTMLElement} The overlay button element.
	 */
	function createOverlayButton() {
		const button = document.createElement( 'button' );
		button.className = OVERLAY_BUTTON_CLASS;
		button.setAttribute( 'type', 'button' );
		button.setAttribute( 'aria-label', 'Edit this' );
		button.textContent = 'Edit This';

		// Position as fixed so it floats and scrolls with the page
		button.style.position = 'fixed';
		button.style.zIndex = '999999';

		return button;
	}

	/**
	 * Show the overlay button for a given element.
	 *
	 * @param {HTMLElement} element The element to show the overlay for.
	 */
	function showOverlay( element ) {
		// Get the bounding rect of the element
		const rect = element.getBoundingClientRect();

		// Check if element is in viewport
		if ( rect.bottom < 0 || rect.top > window.innerHeight ) {
			return;
		}

		// Reuse existing button if available, otherwise create new one
		let button = overlayButtons.get( element );
		if ( ! button ) {
			button = createOverlayButton();
			document.body.appendChild( button );
			overlayButtons.set( element, button );

			// Get edit URL from data attribute and set up click handler
			const editUrl = element.getAttribute( ATTRIBUTE_URL );
			if ( editUrl ) {
				button.addEventListener( 'click', () => {
					window.location.href = editUrl;
				} );
			}

			// Add mouseenter/mouseleave handlers to prevent flickering
			button.addEventListener( 'mouseenter', () => {
				handleButtonMouseEnter( element );
			} );
			button.addEventListener( 'mouseleave', () => {
				handleButtonMouseLeave( element );
			} );

			// Show the button
			button.classList.add( OVERLAY_VISIBLE_CLASS );
		} else if ( ! button.classList.contains( OVERLAY_VISIBLE_CLASS ) ) {
			// Show the button if not already visible
			button.classList.add( OVERLAY_VISIBLE_CLASS );
		}

		// Position the button at the bottom-right corner of the element using viewport coordinates
		// Fixed positioning uses viewport coordinates, so we use rect directly
		button.style.top = rect.bottom - button.offsetHeight + 'px';
		button.style.left = rect.right - button.offsetWidth + 'px';
		button.style.right = 'auto';
		button.style.bottom = 'auto';
	}

	/**
	 * Hide the overlay button for a given element.
	 *
	 * @param {HTMLElement} element The element to hide the overlay for.
	 */
	function hideOverlay( element ) {
		const button = overlayButtons.get( element );
		if ( button ) {
			button.classList.remove( OVERLAY_VISIBLE_CLASS );
		}
	}

	/**
	 * Check if a button is currently focused.
	 *
	 * @param {HTMLElement} element The element the button belongs to.
	 * @return {boolean} True if the button is focused.
	 */
	function isButtonFocused( element ) {
		const button = overlayButtons.get( element );
		return button && button === button.ownerDocument.activeElement;
	}

	/**
	 * Handle mouse enter on an editable element.
	 *
	 * @param {HTMLElement} element The element that was entered.
	 */
	function handleMouseEnter( element ) {
		hoveredElements.add( element );
		clearTimeout( debounceTimer );
		debounceTimer = setTimeout( () => {
			showOverlay( element );
		}, DEBOUNCE_DELAY );
	}

	/**
	 * Handle mouse leave on an editable element.
	 *
	 * @param {HTMLElement} element The element that was left.
	 */
	function handleMouseLeave( element ) {
		hoveredElements.delete( element );
		clearTimeout( debounceTimer );
		debounceTimer = setTimeout( () => {
			// Only hide if the button is not focused and not being hovered
			const button = overlayButtons.get( element );
			if (
				! isButtonFocused( element ) &&
				! ( button && button.matches( ':hover' ) )
			) {
				hideOverlay( element );
			}
		}, DEBOUNCE_DELAY );
	}

	/**
	 * Handle mouse enter on the overlay button.
	 */
	function handleButtonMouseEnter() {
		// Keep overlay visible
		clearTimeout( debounceTimer );
	}

	/**
	 * Handle mouse leave on the overlay button.
	 *
	 * @param {HTMLElement} element The element the button belongs to.
	 */
	function handleButtonMouseLeave( element ) {
		// Check if element is still hovered, if not, hide overlay
		if (
			! hoveredElements.has( element ) &&
			! isButtonFocused( element )
		) {
			clearTimeout( debounceTimer );
			debounceTimer = setTimeout( () => {
				hideOverlay( element );
			}, DEBOUNCE_DELAY );
		}
	}

	/**
	 * Update the position of buttons for all currently hovered elements.
	 */
	function updateButtonPositions() {
		hoveredElements.forEach( ( element ) => {
			const button = overlayButtons.get( element );
			if (
				button &&
				button.classList.contains( OVERLAY_VISIBLE_CLASS )
			) {
				const rect = element.getBoundingClientRect();

				// Check if element is still in viewport
				if ( rect.bottom < 0 || rect.top > window.innerHeight ) {
					hideOverlay( element );
					return;
				}

				// Update button position
				button.style.top = rect.bottom - button.offsetHeight + 'px';
				button.style.left = rect.right - button.offsetWidth + 'px';
			}
		} );
	}

	/**
	 * Initialize the frontend edit overlay.
	 */
	function initialize() {
		// Find all elements marked with edit overlay target
		editableElements = Array.from(
			document.querySelectorAll( '[' + ATTRIBUTE_TARGET + ']' )
		);

		if ( editableElements.length === 0 ) {
			return;
		}

		// Add event listeners to each editable element
		editableElements.forEach( ( element ) => {
			element.addEventListener( 'mouseenter', () => {
				handleMouseEnter( element );
			} );

			element.addEventListener( 'mouseleave', () => {
				handleMouseLeave( element );
			} );

			// Handle focus on the element itself (for keyboard navigation to overlay)
			element.addEventListener(
				'focus',
				() => {
					showOverlay( element );
				},
				true
			);

			// Handle blur
			element.addEventListener(
				'blur',
				() => {
					if ( ! isButtonFocused( element ) ) {
						hideOverlay( element );
					}
				},
				true
			);
		} );

		// Handle scroll to update button positions
		window.addEventListener(
			'scroll',
			() => {
				clearTimeout( scrollTimer );
				scrollTimer = setTimeout( updateButtonPositions, 10 );
			},
			{ passive: true }
		);

		// Handle window resize to update button positions
		window.addEventListener(
			'resize',
			() => {
				clearTimeout( scrollTimer );
				scrollTimer = setTimeout( updateButtonPositions, 10 );
			},
			{ passive: true }
		);

		// Handle escape key to hide all overlays
		document.addEventListener( 'keydown', ( event ) => {
			if ( event.key === 'Escape' ) {
				editableElements.forEach( ( element ) => {
					hideOverlay( element );
				} );
			}
		} );
	}

	// Initialize when DOM is ready
	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', initialize );
	} else {
		initialize();
	}
} )();
