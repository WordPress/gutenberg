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
					context.core.image.scrollDelta = 0;

					// Since the img is hidden and its src not loaded until
					// the lightbox is opened, let's create an img element on the fly
					// so we can get the dimensions we need to calculate the styles
					const imgDom = document.createElement( 'img' );

					imgDom.onload = function () {
						// Enable the lightbox only after the image
						// is loaded to prevent flashing of unstyled content
						context.core.image.lightboxEnabled = true;
						if ( context.core.image.lightboxAnimation === 'zoom' ) {
							setZoomStyles( imgDom, context, event );
						}

						// Hide overflow only when the animation is in progress,
						// otherwise the removal of the scrollbars will draw attention
						// to itself and look like an error
						document.documentElement.classList.add(
							'has-lightbox-open'
						);
					};
					imgDom.setAttribute( 'src', context.core.image.imageSrc );
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

function setZoomStyles( imgDom, context, event ) {
	let targetWidth = imgDom.naturalWidth;
	let targetHeight = imgDom.naturalHeight;

	const verticalPadding = 40;

	// As per the design, let's allow the image to stretch
	// to the full width of its containing figure, but for the height,
	// constrain it with a fixed padding
	const containerWidth = context.core.image.figureRef.clientWidth;

	// The lightbox image has `positione:absolute` and
	// ignores its parent's padding, so let's set the padding here,
	// to be used when calculating the image width and positioning
	let horizontalPadding = 0;
	if ( containerWidth > 480 ) {
		horizontalPadding = 40;
	} else if ( containerWidth > 1920 ) {
		horizontalPadding = 80;
	}

	const containerHeight =
		context.core.image.figureRef.clientHeight - verticalPadding * 2;

	// Check difference between the image and figure dimensions
	const widthOverflow = Math.abs(
		Math.min( containerWidth - targetWidth, 0 )
	);
	const heightOverflow = Math.abs(
		Math.min( containerHeight - targetHeight, 0 )
	);

	// If image is larger than its container any dimension, resize along its largest axis.
	// For vertically oriented devices, always maximize the width.
	if ( widthOverflow > 0 || heightOverflow > 0 ) {
		if (
			widthOverflow >= heightOverflow ||
			containerHeight >= containerWidth
		) {
			targetWidth = containerWidth - horizontalPadding * 2;
			targetHeight =
				imgDom.naturalHeight * ( targetWidth / imgDom.naturalWidth );
		} else {
			targetHeight = containerHeight;
			targetWidth =
				imgDom.naturalWidth * ( targetHeight / imgDom.naturalHeight );
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
	if ( targetWidth >= containerWidth ) {
		targetLeft = horizontalPadding;
	} else {
		targetLeft = ( containerWidth - targetWidth ) / 2;
	}
	let targetTop = 0;
	if ( targetHeight >= containerHeight ) {
		targetTop = verticalPadding;
	} else {
		targetTop = ( containerHeight - targetHeight ) / 2 + verticalPadding;
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
