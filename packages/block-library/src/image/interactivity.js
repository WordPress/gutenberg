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
			showLightbox: ( { context } ) => {
				context.core.initialized = true;
				context.core.lightboxEnabled = true;
				context.core.lastFocusedElement = window.document.activeElement;
			},
			hideLightbox: ( { context, event } ) => {
				if ( context.core.lightboxEnabled ) {
					context.core.lightboxEnabled = false;

					// We only want to focus the last focused element
					// if the lightbox was closed by the keyboard.
					// Note: Pressing enter on a button will trigger
					// a click event with a blank pointerType.
					if (
						( event.key && event.type === 'keydown' ) ||
						( event.type === 'click' && event.pointerType === '' )
					) {
						context.core.lastFocusedElement.focus();
					}
				}
			},
			handleKeydown: ( { context, actions, event } ) => {
				if ( context.core.lightboxEnabled ) {
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
	effects: {
		core: {
			initLightbox: async ( { context, ref } ) => {
				if ( context.core.lightboxEnabled ) {
					// We need to wait until the DOM is able
					// to receive focus updates for accessibility
					await tick();
					ref.querySelector( '.close-button' ).focus();
				}
			},
		},
	},
} );
