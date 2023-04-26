/**
 * Internal dependencies
 */
import { store } from '../utils/interactivity';

const raf = window.requestAnimationFrame;
// Until useSignalEffects is fixed: https://github.com/preactjs/signals/issues/228
const tick = () => new Promise( ( r ) => raf( () => raf( r ) ) );

store( {
	effects: {
		alert: ( { context } ) => {
			// eslint-disable-next-line no-console
			console.log( context.text );
		},
	},
	actions: {
		core: {
			showLightbox: ( { context, event } ) => {
				context.core.initialized = true;
				context.core.lightboxEnabled = ! context.core.lightboxEnabled;
				context.core.lastFocusedElement =
					event.target.ownerDocument.activeElement;

				context.core.handleScroll = () => {
					context.core.lightboxEnabled = false;
					window.removeEventListener(
						'scroll',
						context.core.handleScroll
					);
				};

				if ( context.core.lightboxEnabled ) {
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
			hideLightbox: ( { context, event } ) => {
				context.core.lightboxEnabled = false;
				if ( event.pointerType === '' ) {
					context.core.lastFocusedElement.focus();
				}
			},
			hideLightboxOnEsc: ( { context } ) => {
				function handleEscKey( event ) {
					if (
						context.core.lightboxEnabled &&
						( event.key === 'Escape' || event.keyCode === 27 )
					) {
						context.core.lightboxEnabled = false;
						context.core.lastFocusedElement.focus();
					}
				}
				// Add the event listener for the 'keydown' event on the document
				document.addEventListener( 'keydown', handleEscKey );
				return () => {
					document.removeEventListener( 'keydown', handleEscKey );
				};
			},
			hideLightboxOnTab: ( { context } ) => {
				async function handleTab( event ) {
					if (
						context.core.lightboxEnabled &&
						( event.key === 'Tab' || event.keyCode === 9 )
					) {
						event.preventDefault();
						context.core.lightboxEnabled = false;
						context.core.lastFocusedElement.focus();
					}
				}
				// Add the event listener for the 'keydown' event on the document
				document.addEventListener( 'keydown', handleTab );
				return () => {
					document.removeEventListener( 'keydown', handleTab );
				};
			},
			toggleAriaHidden: ( { context, ref } ) => {
				ref.setAttribute(
					'aria-hidden',
					! context.core.lightboxEnabled
				);
			},
			focusOnClose: async ( { context, ref } ) => {
				if ( context.core.lightboxEnabled ) {
					// We need to wait until the DOM is updated and able
					// to receive focus updates for accessibility
					await tick();
					await tick();
					ref.focus();
				}
			},
		},
	},
} );
