/**
 * Internal dependencies
 */
import { store } from '../utils/interactivity';

const raf = window.requestAnimationFrame;
// Until useSignalEffects is fixed: https://github.com/preactjs/signals/issues/228
const tick = () => new Promise( ( r ) => raf( () => raf( r ) ) );

const focusableSelectors = [
	'a[href]',
	'area[href]',
	'input:not([disabled]):not([type="hidden"]):not([aria-hidden])',
	'select:not([disabled]):not([aria-hidden])',
	'textarea:not([disabled]):not([aria-hidden])',
	'button:not([disabled]):not([aria-hidden])',
	'iframe',
	'object',
	'embed',
	'[contenteditable]',
	'[tabindex]:not([tabindex^="-"])',
];

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

					context.core.image.documentElement.classList.add(
						'has-lightbox-open'
					);

					context.core.image.adminElement.setAttribute(
						'inert',
						true
					);

					context.core.image.siteBlocksElement.setAttribute(
						'inert',
						true
					);
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
						document.documentElement.classList.remove(
							'has-lightbox-open'
						);

						context.core.image.adminElement.removeAttribute(
							'inert'
						);

						context.core.image.siteBlocksElement.removeAttribute(
							'inert'
						);

						context.core.image.lightboxEnabled = false;
						context.core.image.lastFocusedElement.focus();
					}
				},
				handleKeydown: ( { context, actions, event } ) => {
					if ( context.core.image.lightboxEnabled ) {
						if ( event.key === 'Tab' || event.keyCode === 9 ) {
							// If shift + tab it change the direction
							if (
								event.shiftKey &&
								window.document.activeElement ===
									context.core.image.firstFocusableElement
							) {
								event.preventDefault();
								context.core.image.lastFocusableElement.focus();
							} else if (
								! event.shiftKey &&
								window.document.activeElement ===
									context.core.image.lastFocusableElement
							) {
								event.preventDefault();
								context.core.image.firstFocusableElement.focus();
							}
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
					context.core.image.documentElement =
						document.documentElement;
					context.core.image.adminElement =
						document.querySelector( '#wpadminbar' );
					context.core.image.siteBlocksElement =
						document.querySelector( '.wp-site-blocks' );

					const focusableElements =
						ref.querySelectorAll( focusableSelectors );
					context.core.image.firstFocusableElement =
						focusableElements[ 0 ];
					context.core.image.lastFocusableElement =
						focusableElements[ focusableElements.length - 1 ];

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
