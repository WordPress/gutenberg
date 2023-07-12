/**
 * WordPress dependencies
 */
import { store } from '@wordpress/interactivity';

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
					// We can't initialize the lightbox until the reference
					// image is loaded, otherwise the UX is broken.
					if ( ! context.core.image.imageLoaded ) {
						return;
					}
					context.core.image.initialized = true;
					context.core.image.lastFocusedElement =
						window.document.activeElement;
					context.core.image.scrollDelta = 0;

					context.core.image.lightboxEnabled = true;
					if ( context.core.image.lightboxAnimation === 'zoom' ) {
						setZoomStyles(
							event.target.nextElementSibling,
							context,
							event
						);
					}
					// Hide overflow only when the animation is in progress,
					// otherwise the removal of the scrollbars will draw attention
					// to itself and look like an error
					document.documentElement.classList.add(
						'has-lightbox-open'
					);

					// Since the img is hidden and its src not loaded until
					// the lightbox is opened, let's create an img element on the fly
					// so we can get the dimensions we need to calculate the styles
					context.core.image.preloadInitialized = true;
					const imgDom = document.createElement( 'img' );
					imgDom.onload = function () {
						context.core.image.activateLargeImage = true;
					};
					imgDom.setAttribute(
						'src',
						context.core.image.imageUploadedSrc
					);
				},
				hideLightbox: async ( { context, event } ) => {
					context.core.image.hideAnimationEnabled = true;
					if ( context.core.image.lightboxEnabled ) {
						// If scrolling, wait a moment before closing the lightbox.
						if ( context.core.image.lightboxAnimation === 'fade' ) {
							context.core.image.scrollDelta += event.deltaY;
							if (
								event.type === 'mousewheel' &&
								Math.abs(
									window.scrollY -
										context.core.image.scrollDelta
								) < 10
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
				preloadLightboxImage: ( { context } ) => {
					if ( ! context.core.image.preloadInitialized ) {
						context.core.image.preloadInitialized = true;
						const imgDom = document.createElement( 'img' );
						imgDom.setAttribute(
							'src',
							context.core.image.imageUploadedSrc
						);
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
				responsiveImgSrc: ( { context } ) => {
					return context.core.image.activateLargeImage &&
						context.core.image.hideAnimationEnabled
						? ''
						: context.core.image.imageCurrentSrc;
				},
				enlargedImgSrc: ( { context } ) => {
					return context.core.image.initialized
						? context.core.image.imageUploadedSrc
						: '';
				},
			},
		},
	},
	effects: {
		core: {
			image: {
				setCurrentSrc: ( { context, ref } ) => {
					if ( ref.complete ) {
						context.core.image.imageLoaded = true;
						context.core.image.imageCurrentSrc = ref.currentSrc;
					} else {
						ref.addEventListener( 'load', function () {
							context.core.image.imageLoaded = true;
							context.core.image.imageCurrentSrc =
								this.currentSrc;
						} );
					}
				},
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

function setZoomStyles( imgDom, context, event ) {
	// Typically, we use the image's full-sized dimensions. If those
	// dimensions have not been set (i.e. an external image with only one size),
	// the image's dimensions in the lightbox are the same
	// as those of the image in the content.
	let targetWidth =
		context.core.image.targetWidth !== 'none'
			? context.core.image.targetWidth
			: event.target.nextElementSibling.naturalWidth;
	let targetHeight =
		context.core.image.targetHeight !== 'none'
			? context.core.image.targetHeight
			: event.target.nextElementSibling.naturalHeight;

	// Since the lightbox image has `position:absolute`, it
	// ignores its parent's padding, so we need to set padding here
	// to calculate dimensions and positioning.

	// As per the design, let's constrain the height with fixed padding
	const containerOuterHeight = window.innerHeight;
	const verticalPadding = 40;
	const containerInnerHeight = containerOuterHeight - verticalPadding * 2;

	// Let's set a variable horizontal padding based on the container width
	const containerOuterWidth = window.innerWidth;
	let horizontalPadding = 0;
	if ( containerOuterWidth > 480 ) {
		horizontalPadding = 40;
	} else if ( containerOuterWidth > 1920 ) {
		horizontalPadding = 80;
	}
	const containerInnerWidth = containerOuterWidth - horizontalPadding * 2;

	// Check difference between the image and figure dimensions
	const widthOverflow = Math.abs(
		Math.min( containerInnerWidth - targetWidth, 0 )
	);
	const heightOverflow = Math.abs(
		Math.min( containerInnerHeight - targetHeight, 0 )
	);

	// If the image is larger than the container, let's resize
	// it along the greater axis relative to the container
	if ( widthOverflow > 0 || heightOverflow > 0 ) {
		const containerInnerAspectRatio =
			containerInnerWidth / containerInnerHeight;
		const imageAspectRatio = targetWidth / targetHeight;

		if ( imageAspectRatio > containerInnerAspectRatio ) {
			targetWidth = containerInnerWidth;
			targetHeight =
				( targetWidth * imgDom.naturalHeight ) / imgDom.naturalWidth;
		} else {
			targetHeight = containerInnerHeight;
			targetWidth =
				( targetHeight * imgDom.naturalWidth ) / imgDom.naturalHeight;
		}
	}

	// The reference img element lies adjacent to the event target button in the DOM
	const { x: originLeft, y: originTop } =
		event.target.nextElementSibling.getBoundingClientRect();
	const scaleWidth =
		event.target.nextElementSibling.offsetWidth / targetWidth;
	const scaleHeight =
		event.target.nextElementSibling.offsetHeight / targetHeight;

	// Get values used to center the image
	let targetLeft = 0;
	if ( targetWidth >= containerInnerWidth ) {
		targetLeft = horizontalPadding;
	} else {
		targetLeft = ( containerOuterWidth - targetWidth ) / 2;
	}
	let targetTop = 0;
	if ( targetHeight >= containerInnerHeight ) {
		targetTop = verticalPadding;
	} else {
		targetTop = ( containerOuterHeight - targetHeight ) / 2;
	}

	const root = document.documentElement;
	root.style.setProperty( '--lightbox-scale-width', scaleWidth );
	root.style.setProperty( '--lightbox-scale-height', scaleHeight );
	root.style.setProperty( '--lightbox-image-max-width', targetWidth + 'px' );
	root.style.setProperty(
		'--lightbox-image-max-height',
		targetHeight + 'px'
	);
	root.style.setProperty(
		'--lightbox-initial-left-position',
		originLeft + 'px'
	);
	root.style.setProperty(
		'--lightbox-initial-top-position',
		originTop + 'px'
	);
	root.style.setProperty(
		'--lightbox-target-left-position',
		targetLeft + 'px'
	);
	root.style.setProperty(
		'--lightbox-target-top-position',
		targetTop + 'px'
	);
}
