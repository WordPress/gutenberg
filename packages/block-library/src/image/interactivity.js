/**
 * Internal dependencies
 */
import { store } from '../utils/interactivity';

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
				showLightbox: ( { context, event } ) => {
					context.core.image.initialized = true;
					context.core.image.lightboxEnabled = true;
					context.core.image.lastFocusedElement =
						window.document.activeElement;
					context.core.image.scrollPosition = window.scrollY;
					document.documentElement.classList.add(
						'has-lightbox-open'
					);

					if ( context.core.image.lightboxAnimation === 'zoom' ) {
						const { x: leftPosition, y: topPosition } =
							event.target.nextElementSibling.getBoundingClientRect();
						const scaleWidth =
							event.target.nextElementSibling.offsetWidth /
							event.target.nextElementSibling.naturalWidth;
						const scaleHeight =
							event.target.nextElementSibling.offsetHeight /
							event.target.nextElementSibling.naturalHeight;
						const root = document.documentElement;
						root.style.setProperty(
							'--lightbox-left-position',
							leftPosition + 'px'
						);
						root.style.setProperty(
							'--lightbox-top-position',
							topPosition + 'px'
						);
						root.style.setProperty(
							'--lightbox-scale-width',
							scaleWidth
						);
						root.style.setProperty(
							'--lightbox-scale-height',
							scaleHeight
						);
					}
				},
				hideLightbox: async ( { context, event } ) => {
					if ( context.core.image.lightboxEnabled ) {
						// If scrolling, wait a moment before closing the lightbox.
						if ( context.core.image.lightboxAnimation === 'fade' ) {
							if (
								event.type === 'mousewheel' &&
								Math.abs(
									window.scrollY -
										context.core.image.scrollPosition
								) < 5
							) {
								return;
							}
						} else if (
							context.core.image.lightboxAnimation === 'zoom'
						) {
							// Disable scroll until the zoom animation ends.
							// Get the current page scroll position
							const scrollTop =
								window.pageYOffset ||
								document.documentElement.scrollTop;
							const scrollLeft =
								window.pageXOffset ||
								document.documentElement.scrollLeft;
							// if any scroll is attempted, set this to the previous value.
							window.onscroll = function () {
								window.scrollTo( scrollLeft, scrollTop );
							};
							// Enable scrolling after the animation finishes
							setTimeout( function () {
								window.onscroll = function () {};
							}, 400 );
						}

						document.documentElement.classList.remove(
							'has-lightbox-open'
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
	selectors: {
		core: {
			image: {
				roleAttribute: ( { context } ) => {
					return context.core.image.lightboxEnabled ? 'dialog' : '';
				},
				imageSrc: ( { context } ) => {
					return context.core.image.initialized
						? context.core.image.imageSrc
						: '';
				},
			},
		},
	},
	effects: {
		core: {
			image: {
				initLightbox: async ( { context, ref } ) => {
					if ( context.core.image.lightboxEnabled ) {
						context.core.image.lightboxImage =
							ref.querySelector( 'img' );
						const focusableElements =
							ref.querySelectorAll( focusableSelectors );
						context.core.image.firstFocusableElement =
							focusableElements[ 0 ];
						context.core.image.lastFocusableElement =
							focusableElements[ focusableElements.length - 1 ];

						ref.querySelector( '.close-button' ).focus();
					}
				},
			},
		},
	},
} );
