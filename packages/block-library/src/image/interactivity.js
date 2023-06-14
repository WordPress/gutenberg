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
					context.core.image.lastFocusedElement =
						window.document.activeElement;
					context.core.image.scrollPosition = window.scrollY;
					document.documentElement.classList.add(
						'has-lightbox-open'
					);

					const imgDom = document.createElement( 'img' );
					imgDom.onload = function () {
						context.core.image.lightboxEnabled = true;
						if ( context.core.image.lightboxAnimation === 'zoom' ) {
							let targetWidth = imgDom.naturalWidth;
							let targetHeight = imgDom.naturalHeight;

							const figureStyle = window.getComputedStyle(
								context.core.image.figureRef
							);

							const topPadding = parseInt(
								figureStyle.getPropertyValue( 'padding-top' )
							);
							const bottomPadding = parseInt(
								figureStyle.getPropertyValue( 'padding-bottom' )
							);
							const figureWidth =
								context.core.image.figureRef.clientWidth;
							let horizontalPadding = 0;
							if ( figureWidth > 480 ) {
								horizontalPadding = 40;
							} else if ( figureWidth > 1920 ) {
								horizontalPadding = 80;
							}

							const figureHeight =
								context.core.image.figureRef.clientHeight -
								topPadding -
								bottomPadding;

							// Check difference between the image and figure dimensions
							const widthOverflow = Math.abs(
								Math.min( figureWidth - targetWidth, 0 )
							);
							const heightOverflow = Math.abs(
								Math.min( figureHeight - targetHeight, 0 )
							);

							// If image is larger than the figure, resize along its largest axis
							if ( widthOverflow > 0 || heightOverflow > 0 ) {
								if ( widthOverflow > heightOverflow ) {
									targetWidth =
										figureWidth - horizontalPadding * 2;
									targetHeight =
										imgDom.naturalHeight *
										( targetWidth / imgDom.naturalWidth );
								} else {
									targetHeight = figureHeight;
									targetWidth =
										imgDom.naturalWidth *
										( targetHeight / imgDom.naturalHeight );
								}
							}

							const { x: leftPosition, y: topPosition } =
								event.target.nextElementSibling.getBoundingClientRect();
							const scaleWidth =
								event.target.nextElementSibling.offsetWidth /
								targetWidth;

							const scaleHeight =
								event.target.nextElementSibling.offsetHeight /
								targetHeight;
							let targetLeft = 0;
							if ( targetWidth >= figureWidth ) {
								targetLeft = horizontalPadding;
							} else {
								targetLeft = ( figureWidth - targetWidth ) / 2;
							}

							let targetTop = 0;
							if ( targetHeight >= figureHeight ) {
								targetTop = topPadding;
							} else {
								targetTop =
									( figureHeight - targetHeight ) / 2 +
									topPadding;
							}
							const root = document.documentElement;

							root.style.setProperty(
								'--lightbox-image-max-width',
								targetWidth + 'px'
							);
							root.style.setProperty(
								'--lightbox-image-max-height',
								targetHeight + 'px'
							);
							root.style.setProperty(
								'--lightbox-initial-left-position',
								leftPosition + 'px'
							);
							root.style.setProperty(
								'--lightbox-initial-top-position',
								topPosition + 'px'
							);
							root.style.setProperty(
								'--lightbox-target-left-position',
								targetLeft + 'px'
							);
							root.style.setProperty(
								'--lightbox-target-top-position',
								targetTop + 'px'
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
					};
					imgDom.setAttribute( 'src', context.core.image.imageSrc );
				},
				hideLightbox: async ( { context, event } ) => {
					context.core.image.animateOutEnabled = true;
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
					context.core.image.figureRef =
						ref.querySelector( 'figure' );
					context.core.image.imageRef = ref.querySelector( 'img' );
					if ( context.core.image.lightboxEnabled ) {
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
