import './runtime/init.js';
import { store } from './runtime';

store( {
	actions: {
		core: {
			imageZoom: ( { context } ) => {
				context.core.isZoomed = ! context.core.isZoomed;
				context.core.handleScroll = () => {
					context.core.isZoomed = false;
					window.removeEventListener(
						'scroll',
						context.core.handleScroll
					);
				};

				if ( context.core.isZoomed ) {
					window.addEventListener(
						'scroll',
						context.core.handleScroll
					);
				} else if ( context.core.handleScroll ) {
					window.removeEventListener(
						'scroll',
						context.core.handleScroll
					);
				}
			},
			closeZoom: ( { context } ) => {
				console.log( 'closing zoom' );
				context.core.isZoomed = false;
			},
			closeZoomOnEsc: ( { context } ) => {
				// Function to handle the ESC key press
				function handleEscKey( event ) {
					if ( event.key === 'Escape' || event.keyCode === 27 ) {
						console.log( 'ESC key pressed' );
						// Add any custom logic you want to execute when the ESC key is pressed
						context.core.isZoomed = false;
					}
				}
				// Add the event listener for the 'keydown' event on the document
				document.addEventListener( 'keydown', handleEscKey );
				return () => {
					document.removeEventListener( 'keydown', handleEscKey );
				};
			},
		},
	},
} );
