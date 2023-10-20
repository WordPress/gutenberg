/**
 * WordPress dependencies
 */
import { store, getContext, getElement } from '@wordpress/interactivity';

store( 'core', {
	callbacks: {
		updateText: () => {
			const context = getContext();
			const { ref } = getElement();

			const observer = new window.IntersectionObserver(
				( entries ) => {
					entries.forEach( ( entry ) => {
						// Check if the element is in the viewport or above it.
						if ( entry.isIntersecting ) {
							let n = 0;
							const characters = context.originalText.split( '' );

							const interval = setInterval( () => {
								context.dynamicText =
									context.dynamicText + characters[ n ];
								n++;
								if ( n >= characters.length ) {
									clearInterval( interval );
								}
							}, 50 );
						}
					} );
				},
				{ rootMargin: '0px 0px -150px 0px' }
			);
			observer.observe( ref );
		},
	},
} );
