/**
 * Frontend fit text functionality.
 * Automatically detects and initializes fit text on blocks with the has-fit-text class.
 * Supports both initial page load and Interactivity API client-side navigation.
 */

/**
 * WordPress dependencies
 */
import { store, getElement } from '@wordpress/interactivity';

/**
 * Internal dependencies
 */
import { optimizeFitText } from './fit-text-utils';

/**
 * Initialize fit text functionality for a single element.
 * Uses inline styles for better performance and automatic cleanup.
 *
 * @param {HTMLElement} element Element with fit text enabled.
 * @return {ResizeObserver|null} The ResizeObserver instance, or null if not created.
 */
function initializeFitText( element ) {
	const applyFitText = () => {
		// Apply font size directly to the element via inline style attribute.
		// The callback receives font size in pixels from optimizeFitText.
		const applyFontSize = ( fontSize ) => {
			if ( fontSize === 0 ) {
				element.style.fontSize = '';
			} else {
				element.style.fontSize = `${ fontSize }px`;
			}
		};

		// Use the shared utility function with inline style callback.
		optimizeFitText( element, applyFontSize );
	};

	// Initial sizing
	applyFitText();

	// Watch for parent container resize
	if ( window.ResizeObserver && element.parentElement ) {
		const resizeObserver = new window.ResizeObserver( applyFitText );
		resizeObserver.observe( element.parentElement );
		return resizeObserver;
	}

	return null;
}

// Initialize via Interactivity API for client-side navigation
store( 'core/fit-text', {
	callbacks: {
		init() {
			const { ref } = getElement();
			if ( ! ref || ! ref.classList.contains( 'has-fit-text' ) ) {
				return;
			}

			const observer = initializeFitText( ref );

			// Return cleanup function to be called when element is removed.
			return () => {
				if ( observer ) {
					observer.disconnect();
				}
			};
		},
	},
} );
