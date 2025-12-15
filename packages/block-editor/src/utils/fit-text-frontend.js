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

			const applyFontSize = ( fontSize ) => {
				if ( fontSize === 0 ) {
					ref.style.fontSize = '';
				} else {
					ref.style.fontSize = `${ fontSize }px`;
				}
			};

			// Initial fit text optimization.
			context.fontSize = optimizeFitText( ref, applyFontSize );

			// Starts ResizeObserver to handle dynamic resizing.
			if ( window.ResizeObserver && ref.parentElement ) {
				const resizeObserver = new window.ResizeObserver( () => {
					context.fontSize = optimizeFitText( ref, applyFontSize );
				} );
				resizeObserver.observe( ref.parentElement );
				resizeObserver.observe( ref );

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
