/**
 * Frontend fit text functionality.
 * Automatically detects and initializes fit text on blocks with the has-fit-text class.
 * Supports both initial page load and Interactivity API client-side navigation.
 */

/**
 * WordPress dependencies
 */
import { store, getElement, getContext } from '@wordpress/interactivity';

/**
 * Internal dependencies
 */
import { optimizeFitText } from './fit-text-utils';

// Initialize via Interactivity API for client-side navigation
store( 'core/fit-text', {
	callbacks: {
		init() {
			const context = getContext();
			const { ref } = getElement();

			// Initial fit text optimization.
			context.fontSize = optimizeFitText( ref );

			// Starts ResizeObserver to handle dynamic resizing.
			if ( window.ResizeObserver && ref.parentElement ) {
				const resizeObserver = new window.ResizeObserver( () => {
					context.fontSize = optimizeFitText( ref );
				} );
				resizeObserver.observe( ref.parentElement );

				// Return cleanup function to be called when element is removed.
				return () => {
					if ( resizeObserver ) {
						resizeObserver.disconnect();
					}
				};
			}
		},
	},
} );
