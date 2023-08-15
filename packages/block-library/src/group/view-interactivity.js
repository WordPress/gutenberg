/**
 * WordPress dependencies
 */
import { store } from '@wordpress/interactivity';

store( {
	effects: {
		core: {
			showInView: async ( { context, ref } ) => {
				const observer = new IntersectionObserver(
					( entries ) => {
						entries.forEach( ( entry ) => {
							// Check if the element is in the viewport or above it.
							if (
								entry.isIntersecting ||
								entry.boundingClientRect.y <= 0
							) {
								context.core.isLoaded = true;
								observer.unobserve( ref );
							} else {
								context.core.shouldAnimateInView = true;
							}
						} );
					},
					{ rootMargin: '0px 0px -150px 0px' }
				);
				observer.observe( ref );
			},
		},
	},
} );
