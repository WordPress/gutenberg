/**
 * WordPress dependencies
 */
import { store } from '@wordpress/interactivity';

store( {
	effects: {
		core: {
			showInView: ( { context, ref } ) => {
				// TODO: Check if the element is in the top.
				const observer = new IntersectionObserver(
					( entries ) => {
						entries.forEach( ( entry ) => {
							entry.isIntersecting
								? ( context.core.isVisible = true )
								: ( context.core.hiddenOnFirstLoad = true );
						} );
					},
					{ rootMargin: '0px 0px -150px 0px' }
				);
				observer.observe( ref );

				return () => observer.unobserve( ref );
			},
		},
	},
} );
