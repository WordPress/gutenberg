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
				},
				hideLightbox: ( { context, event } ) => {
					if ( context.core.image.lightboxEnabled ) {
						context.core.image.lightboxEnabled = false;

						// We only want to focus the last focused element
						// if the lightbox was closed by the keyboard.
						// Note: Pressing enter on a button will trigger
						// a click event with a blank pointerType.
						if (
							( event.key && event.type === 'keydown' ) ||
							( event.type === 'click' &&
								event.pointerType === '' )
						) {
							context.core.image.lastFocusedElement.focus();
						}
					}
				},
				handleKeydown: ( { context, actions, event } ) => {
					if ( context.core.image.lightboxEnabled ) {
						const isTabKeyPressed =
							event.key === 'Tab' || event.keyCode === 9;
						const escapeKeyPressed =
							event.key === 'Escape' || event.keyCode === 27;

						if ( isTabKeyPressed ) {
							event.preventDefault();
						}

						if ( escapeKeyPressed || isTabKeyPressed ) {
							actions.core.hideLightbox( { context, event } );
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
