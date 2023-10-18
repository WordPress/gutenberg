/**
 * WordPress dependencies
 */
import { store, getContext, getElement } from '@wordpress/interactivity';

store( 'core', {
	callbacks: {
		showInView: () => {
			const context = getContext();
			const { ref } = getElement();

			const observer = new window.IntersectionObserver(
				( entries ) => {
					entries.forEach( ( entry ) => {
						// Check if the element is in the viewport or above it.
						if (
							entry.isIntersecting ||
							entry.boundingClientRect.y <= 0
						) {
							context.isLoaded = true;
							observer.unobserve( ref );
						} else {
							context.shouldAnimateInView = true;
						}
					} );
				},
				{ rootMargin: '0px 0px -150px 0px' }
			);
			observer.observe( ref );
		},
	},
} );
