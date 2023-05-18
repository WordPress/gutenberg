/**
 * Internal dependencies
 */
import { store } from '../utils/interactivity';

const raf = window.requestAnimationFrame;
// Until useSignalEffects is fixed: https://github.com/preactjs/signals/issues/228
const tick = () => new Promise( ( r ) => raf( () => raf( r ) ) );

store( {
	actions: {
		core: {
			image: {
				showLightbox: ( { context } ) => {
					context.core.image.initialized = true;
					context.core.image.lightboxEnabled = true;
					context.core.image.lastFocusedElement =
						window.document.activeElement;
					context.core.image.scrollPosition = window.scrollY;
				},
				hideLightbox: async ( { context, event } ) => {
					if ( context.core.image.lightboxEnabled ) {
						// If scrolling, wait a moment before closing the lightbox.
						if (
							event.type === 'mousewheel' &&
							Math.abs(
								window.scrollY -
									context.core.image.scrollPosition
							) < 5
						) {
							return;
						}
						context.core.image.lightboxEnabled = false;
						context.core.image.lastFocusedElement.focus();
					}
				},
				handleKeydown: ( { context, actions, event } ) => {
					if ( context.core.image.lightboxEnabled ) {
						if ( event.key === 'Tab' || event.keyCode === 9 ) {
							event.preventDefault();
						}

						if ( event.key === 'Escape' || event.keyCode === 27 ) {
							actions.core.image.hideLightbox( {
								context,
								event,
							} );
						}
					}
				},
			},
		},
	},
	effects: {
		core: {
			image: {
				initLightbox: async ( { context, ref } ) => {
					if ( context.core.image.lightboxEnabled ) {
						// We need to wait until the DOM is able
						// to receive focus updates for accessibility
						await tick();
						ref.querySelector( '.close-button' ).focus();
					}
				},
			},
		},
	},
} );
