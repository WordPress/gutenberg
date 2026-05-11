/**
 * WordPress dependencies
 */
import {
	store,
	getContext,
	getElement,
	getConfig,
	withSyncEvent,
	withScope,
} from '@wordpress/interactivity';

/**
 * Internal dependencies
 */
import { IMAGE_PRELOAD_DELAY } from './constants';

/**
 * Tracks whether user is touching screen; used to differentiate behavior for
 * touch and mouse input.
 *
 * @type {boolean}
 */
let isTouching = false;

/**
 * Tracks the last time the screen was touched; used to differentiate behavior
 * for touch and mouse input.
 *
 * @type {number}
 */
let lastTouchTime = 0;

const touchStartEvent = {
	startX: 0,
	startY: 0,
	startTime: 0,
};

const focusableSelectors = [
	'.wp-lightbox-close-button',
	'.wp-lightbox-navigation-button',
];

/**
 * Returns the appropriate src URL for an image.
 *
 * @param {string} uploadedSrc - Full size image src.
 * @return {string} The source URL.
 */
function getImageSrc( { uploadedSrc } ) {
	return (
		uploadedSrc ||
		'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='
	);
}

/**
 * Returns the appropriate srcset for an image.
 *
 * @param {string} lightboxSrcset - Image srcset.
 * @return {string} The srcset value.
 */
function getImageSrcset( { lightboxSrcset } ) {
	return lightboxSrcset || '';
}

const { state, actions, callbacks } = store(
	'core/image',
	{
		state: {
			selectedImageId: null,
			selectedGalleryId: null,
			preloadTimers: new Map(),
			preloadedImageIds: new Set(),
			get galleryImages() {
				if ( ! state.selectedGalleryId ) {
					return [ state.selectedImageId ];
				}

				// Get all images in this gallery and sort by galleryOrder
				return Object.entries( state.metadata )
					.filter(
						( [ , value ] ) =>
							value.galleryId === state.selectedGalleryId
					)
					.sort( ( [ , a ], [ , b ] ) => {
						const orderA = a.order ?? 0;
						const orderB = b.order ?? 0;
						return orderA - orderB;
					} )
					.map( ( [ key ] ) => key );
			},
			get selectedImageIndex() {
				return state.galleryImages.findIndex(
					( id ) => id === state.selectedImageId
				);
			},
			get selectedImage() {
				return state.metadata[ state.selectedImageId ];
			},
			get hasNavigationIcon() {
				const { navigationButtonType } = state.selectedImage;
				return (
					navigationButtonType === 'icon' ||
					navigationButtonType === 'both'
				);
			},
			get hasNavigationText() {
				const { navigationButtonType } = state.selectedImage;
				return (
					navigationButtonType === 'text' ||
					navigationButtonType === 'both'
				);
			},
			get thisImage() {
				const { imageId } = getContext();
				return state.metadata[ imageId ];
			},
			get hasNavigation() {
				return state.galleryImages.length > 1;
			},
			get hasNextImage() {
				return (
					state.selectedImageIndex + 1 < state.galleryImages.length
				);
			},
			get hasPreviousImage() {
				return state.selectedImageIndex - 1 >= 0;
			},
			get overlayOpened() {
				return state.selectedImageId !== null;
			},
			get roleAttribute() {
				return state.overlayOpened ? 'dialog' : null;
			},
			get ariaModal() {
				return state.overlayOpened ? 'true' : null;
			},
			get ariaLabel() {
				return (
					state.selectedImage.customAriaLabel ||
					getConfig().defaultAriaLabel
				);
			},
			get closeButtonAriaLabel() {
				return state.hasNavigationText
					? undefined
					: getConfig().closeButtonText;
			},
			get prevButtonAriaLabel() {
				return state.hasNavigationText
					? undefined
					: getConfig().prevButtonText;
			},
			get nextButtonAriaLabel() {
				return state.hasNavigationText
					? undefined
					: getConfig().nextButtonText;
			},
			get enlargedSrc() {
				return getImageSrc( state.selectedImage );
			},
			get enlargedSrcset() {
				return getImageSrcset( state.selectedImage );
			},
			get figureStyles() {
				return (
					state.overlayOpened &&
					`${ state.selectedImage.figureStyles?.replace(
						/margin[^;]*;?/g,
						''
					) };`
				);
			},
			get imgStyles() {
				return (
					state.overlayOpened &&
					`${ state.selectedImage.imgStyles?.replace(
						/;$/,
						''
					) }; object-fit:cover;`
				);
			},
			get isContentHidden() {
				const ctx = getContext();
				return (
					state.overlayEnabled &&
					state.selectedImageId === ctx.imageId
				);
			},
			get isContentVisible() {
				const ctx = getContext();
				return (
					! state.overlayEnabled &&
					state.selectedImageId === ctx.imageId
				);
			},
		},
		actions: {
			showLightbox() {
				const { imageId } = getContext();

				// Bails out if the image has not loaded yet.
				if ( ! state.metadata[ imageId ].imageRef?.complete ) {
					return;
				}

				// Stores the positions of the scroll to fix it until the overlay is
				// closed.
				state.scrollTopReset = document.documentElement.scrollTop;
				state.scrollLeftReset = document.documentElement.scrollLeft;

				// Sets the selected image and gallery and enables the overlay.
				state.selectedImageId = imageId;
				const { galleryId } = getContext( 'core/gallery' ) || {};
				state.selectedGalleryId = galleryId || null;
				state.overlayEnabled = true;

				// Computes the styles of the overlay for the animation.
				callbacks.setOverlayStyles();
			},
			hideLightbox() {
				if ( state.overlayEnabled ) {
					state.overlayEnabled = false;

					// Waits until the close animation has completed before allowing a
					// user to scroll again. The duration of this animation is defined in
					// the `styles.scss` file, but in any case we should wait a few
					// milliseconds longer than the duration, otherwise a user may scroll
					// too soon and cause the animation to look sloppy.
					setTimeout( function () {
						// Delays before changing the focus. Otherwise the focus ring will
						// appear on Firefox before the image has finished animating, which
						// looks broken.
						state.selectedImage.buttonRef.focus( {
							preventScroll: true,
						} );

						// Resets the selected image and gallery ids.
						state.selectedImageId = null;
						state.selectedGalleryId = null;
					}, 450 );
				}
			},
			showPreviousImage: withSyncEvent( ( event ) => {
				event.stopPropagation();
				const nextIndex = state.hasPreviousImage
					? state.selectedImageIndex - 1
					: state.galleryImages.length - 1;
				state.selectedImageId = state.galleryImages[ nextIndex ];
				callbacks.setOverlayStyles();
			} ),
			showNextImage: withSyncEvent( ( event ) => {
				event.stopPropagation();
				const nextIndex = state.hasNextImage
					? state.selectedImageIndex + 1
					: 0;
				state.selectedImageId = state.galleryImages[ nextIndex ];
				callbacks.setOverlayStyles();
			} ),
			handleKeydown: withSyncEvent( ( event ) => {
				if ( state.overlayEnabled ) {
					if ( event.key === 'Escape' ) {
						actions.hideLightbox();
					} else if ( event.key === 'ArrowLeft' ) {
						actions.showPreviousImage( event );
					} else if ( event.key === 'ArrowRight' ) {
						actions.showNextImage( event );
					} else if ( event.key === 'Tab' ) {
						// Traps focus within the overlay.
						const focusableElements = Array.from(
							document.querySelectorAll( focusableSelectors )
						);
						const firstFocusableElement = focusableElements[ 0 ];
						const lastFocusableElement =
							focusableElements[ focusableElements.length - 1 ];
						if (
							event.shiftKey &&
							event.target === firstFocusableElement
						) {
							event.preventDefault();
							lastFocusableElement.focus();
						} else if (
							! event.shiftKey &&
							event.target === lastFocusableElement
						) {
							event.preventDefault();
							firstFocusableElement.focus();
						}
					}
				}
			} ),
			handleTouchMove: withSyncEvent( ( event ) => {
				// On mobile devices, prevents triggering the scroll event because
				// otherwise the page jumps around when it resets the scroll position.
				// This also means that closing the lightbox requires that a user
				// perform a simple tap. This may be changed in the future if there is a
				// better alternative to override or reset the scroll position during
				// swipe actions.
				if ( state.overlayEnabled ) {
					event.preventDefault();
				}
			} ),
			handleTouchStart( event ) {
				isTouching = true;
				const t = event.touches && event.touches[ 0 ];
				if ( t ) {
					touchStartEvent.startX = t.clientX;
					touchStartEvent.startY = t.clientY;
					touchStartEvent.startTime = Date.now();
				}
			},
			handleTouchEnd: withSyncEvent( ( event ) => {
				const touchEndEvent =
					( event.changedTouches && event.changedTouches[ 0 ] ) ||
					( event.touches && event.touches[ 0 ] );
				const now = Date.now();

				if ( touchEndEvent && state.overlayEnabled ) {
					const deltaX =
						touchEndEvent.clientX - touchStartEvent.startX;
					const deltaY =
						touchEndEvent.clientY - touchStartEvent.startY;
					const absDeltaX = Math.abs( deltaX );
					const absDeltaY = Math.abs( deltaY );
					const elapsedMs = now - touchStartEvent.startTime;
					const isHorizontalSwipe =
						// Swipe distance is greater than 50px
						absDeltaX > 50 &&
						// Horizontal movement is much larger than the vertical movement
						absDeltaX > absDeltaY * 1.5 &&
						// Fast action of less than 800ms
						elapsedMs < 800;

					if ( isHorizontalSwipe ) {
						event.preventDefault();
						if ( deltaX < 0 ) {
							actions.showNextImage( event );
						} else {
							actions.showPreviousImage( event );
						}
					}
				}

				lastTouchTime = now;
				isTouching = false;
			} ),
			handleScroll() {
				// Prevents scrolling behaviors that trigger content shift while the
				// lightbox is open. It would be better to accomplish through CSS alone,
				// but using overflow: hidden is currently the only way to do so and
				// that causes a layout to shift and prevents the zoom animation from
				// working in some cases because it's not possible to account for the
				// layout shift when doing the animation calculations. Instead, it uses
				// JavaScript to prevent and reset the scrolling behavior.
				if ( state.overlayOpened ) {
					// Avoids overriding the scroll behavior on mobile devices because
					// doing so breaks the pinch to zoom functionality, and users should
					// be able to zoom in further on the high-res image.
					if ( ! isTouching && Date.now() - lastTouchTime > 450 ) {
						// It doesn't rely on `event.preventDefault()` to prevent scrolling
						// because the scroll event can't be canceled, so it resets the
						// position instead.
						window.scrollTo(
							state.scrollLeftReset,
							state.scrollTopReset
						);
					}
				}
			},
			preloadImage() {
				const { imageId } = getContext();

				// Bails if it has already been preloaded. This could help
				// prevent unnecessary preloading of the same image multiple times,
				// leading to duplicate link elements in the document head.
				if ( state.preloadedImageIds.has( imageId ) ) {
					return;
				}

				// Link element to preload the image.
				const imageMetadata = state.metadata[ imageId ];
				const imageLink = document.createElement( 'link' );
				imageLink.rel = 'preload';
				imageLink.as = 'image';
				imageLink.href = getImageSrc( imageMetadata );

				// Apply srcset if available for responsive preloading
				const srcset = getImageSrcset( imageMetadata );
				if ( srcset ) {
					imageLink.setAttribute( 'imagesrcset', srcset );
					imageLink.setAttribute( 'imagesizes', '100vw' );
				}

				document.head.appendChild( imageLink );
				state.preloadedImageIds.add( imageId );
			},
			preloadImageWithDelay() {
				const { imageId } = getContext();

				actions.cancelPreload();

				// Set a new timer to preload the image after a short delay.
				const timerId = setTimeout(
					withScope( () => {
						actions.preloadImage();
						state.preloadTimers.delete( imageId );
					} ),
					IMAGE_PRELOAD_DELAY
				);
				state.preloadTimers.set( imageId, timerId );
			},
			cancelPreload() {
				const { imageId } = getContext();
				if ( state.preloadTimers.has( imageId ) ) {
					clearTimeout( state.preloadTimers.get( imageId ) );
					state.preloadTimers.delete( imageId );
				}
			},
		},
		callbacks: {
			setOverlayStyles() {
				if ( ! state.overlayEnabled ) {
					return;
				}

				let {
					naturalWidth,
					naturalHeight,
					offsetWidth: originalWidth,
					offsetHeight: originalHeight,
				} = state.selectedImage.imageRef;
				let { x: screenPosX, y: screenPosY } =
					state.selectedImage.imageRef.getBoundingClientRect();

				// Natural ratio of the image clicked to open the lightbox.
				const naturalRatio = naturalWidth / naturalHeight;
				// Original ratio of the image clicked to open the lightbox.
				let originalRatio = originalWidth / originalHeight;

				// If it has object-fit: contain, recalculates the original sizes
				// and the screen position without the blank spaces.
				if ( state.selectedImage.scaleAttr === 'contain' ) {
					if ( naturalRatio > originalRatio ) {
						const heightWithoutSpace = originalWidth / naturalRatio;
						// Recalculates screen position without the top space.
						screenPosY +=
							( originalHeight - heightWithoutSpace ) / 2;
						originalHeight = heightWithoutSpace;
					} else {
						const widthWithoutSpace = originalHeight * naturalRatio;
						// Recalculates screen position without the left space.
						screenPosX += ( originalWidth - widthWithoutSpace ) / 2;
						originalWidth = widthWithoutSpace;
					}
				}
				originalRatio = originalWidth / originalHeight;

				// Typically, it uses the image's full-sized dimensions. If those
				// dimensions have not been set (i.e. an external image with only one
				// size), the image's dimensions in the lightbox are the same
				// as those of the image in the content.
				let imgMaxWidth = parseFloat(
					state.selectedImage.targetWidth &&
						state.selectedImage.targetWidth !== 'none'
						? state.selectedImage.targetWidth
						: naturalWidth
				);
				let imgMaxHeight = parseFloat(
					state.selectedImage.targetHeight &&
						state.selectedImage.targetHeight !== 'none'
						? state.selectedImage.targetHeight
						: naturalHeight
				);

				// Ratio of the biggest image stored in the database.
				let imgRatio = imgMaxWidth / imgMaxHeight;
				let containerMaxWidth = imgMaxWidth;
				let containerMaxHeight = imgMaxHeight;
				let containerWidth = imgMaxWidth;
				let containerHeight = imgMaxHeight;

				// Checks if the target image has a different ratio than the original
				// one (thumbnail). Recalculates the width and height.
				if ( naturalRatio.toFixed( 2 ) !== imgRatio.toFixed( 2 ) ) {
					if ( naturalRatio > imgRatio ) {
						// If the width is reached before the height, it keeps the maxWidth
						// and recalculates the height unless the difference between the
						// maxHeight and the reducedHeight is higher than the maxWidth,
						// where it keeps the reducedHeight and recalculate the width.
						const reducedHeight = imgMaxWidth / naturalRatio;
						if ( imgMaxHeight - reducedHeight > imgMaxWidth ) {
							imgMaxHeight = reducedHeight;
							imgMaxWidth = reducedHeight * naturalRatio;
						} else {
							imgMaxHeight = imgMaxWidth / naturalRatio;
						}
					} else {
						// If the height is reached before the width, it keeps the maxHeight
						// and recalculate the width unlesss the difference between the
						// maxWidth and the reducedWidth is higher than the maxHeight, where
						// it keeps the reducedWidth and recalculate the height.
						const reducedWidth = imgMaxHeight * naturalRatio;
						if ( imgMaxWidth - reducedWidth > imgMaxHeight ) {
							imgMaxWidth = reducedWidth;
							imgMaxHeight = reducedWidth / naturalRatio;
						} else {
							imgMaxWidth = imgMaxHeight * naturalRatio;
						}
					}
					containerWidth = imgMaxWidth;
					containerHeight = imgMaxHeight;
					imgRatio = imgMaxWidth / imgMaxHeight;

					// Calculates the max size of the container.
					if ( originalRatio > imgRatio ) {
						containerMaxWidth = imgMaxWidth;
						containerMaxHeight = containerMaxWidth / originalRatio;
					} else {
						containerMaxHeight = imgMaxHeight;
						containerMaxWidth = containerMaxHeight * originalRatio;
					}
				}

				// If the image has been pixelated on purpose, it keeps that size.
				if (
					originalWidth > containerWidth ||
					originalHeight > containerHeight
				) {
					containerWidth = originalWidth;
					containerHeight = originalHeight;
				}

				// Calculates the final lightbox image size and the scale factor.
				// MaxWidth is either the window container (accounting for padding) or
				// the image resolution.

				// 480px width or less
				let horizontalPadding = 0;
				let verticalPadding = 160;
				// Greater than 480px wide and less than or equal to 960px
				if ( 480 < window.innerWidth ) {
					horizontalPadding = 80;
					verticalPadding = 160;
				}
				// Greater than 960px wide
				if ( 960 < window.innerWidth ) {
					horizontalPadding = state.hasNavigation ? 320 : 80;
					verticalPadding = 80;
				}

				const targetMaxWidth = Math.min(
					window.innerWidth - horizontalPadding,
					containerWidth
				);
				const targetMaxHeight = Math.min(
					window.innerHeight - verticalPadding,
					containerHeight
				);
				const targetContainerRatio = targetMaxWidth / targetMaxHeight;

				if ( originalRatio > targetContainerRatio ) {
					// If targetMaxWidth is reached before targetMaxHeight.
					containerWidth = targetMaxWidth;
					containerHeight = containerWidth / originalRatio;
				} else {
					// If targetMaxHeight is reached before targetMaxWidth.
					containerHeight = targetMaxHeight;
					containerWidth = containerHeight * originalRatio;
				}

				const containerScale = originalWidth / containerWidth;
				const lightboxImgWidth =
					imgMaxWidth * ( containerWidth / containerMaxWidth );
				const lightboxImgHeight =
					imgMaxHeight * ( containerHeight / containerMaxHeight );

				// As of this writing, using the calculations above will render the
				// lightbox with a small, erroneous whitespace on the left side of the
				// image in iOS Safari, perhaps due to an inconsistency in how browsers
				// handle absolute positioning and CSS transformation. In any case,
				// adding 1 pixel to the container width and height solves the problem,
				// though this can be removed if the issue is fixed in the future.
				state.overlayStyles = `
					--wp--lightbox-initial-top-position: ${ screenPosY }px;
					--wp--lightbox-initial-left-position: ${ screenPosX }px;
					--wp--lightbox-container-width: ${ containerWidth + 1 }px;
					--wp--lightbox-container-height: ${ containerHeight + 1 }px;
					--wp--lightbox-image-width: ${ lightboxImgWidth }px;
					--wp--lightbox-image-height: ${ lightboxImgHeight }px;
					--wp--lightbox-scale: ${ containerScale };
					--wp--lightbox-scrollbar-width: ${
						window.innerWidth - document.documentElement.clientWidth
					}px;
				`;
			},
			setButtonStyles() {
				const { ref } = getElement();

				// This guard prevents errors in images with the `srcset`
				// attribute, which can dispatch `load` events even after DOM
				// removal. Preact doesn't automatically clean up `load` event
				// listeners on unmounted `img` elements (see
				// https://github.com/preactjs/preact/issues/3141).
				if ( ! ref ) {
					return;
				}

				const { imageId } = getContext();

				state.metadata[ imageId ].imageRef = ref;
				state.metadata[ imageId ].currentSrc = ref.currentSrc;

				const {
					naturalWidth,
					naturalHeight,
					offsetWidth,
					offsetHeight,
				} = ref;

				// If the image isn't loaded yet, it can't calculate where the button
				// should be.
				if ( naturalWidth === 0 || naturalHeight === 0 ) {
					return;
				}

				const figure = ref.parentElement;
				const figureWidth = ref.parentElement.clientWidth;

				// It needs special handling for the height because a caption will cause
				// the figure to be taller than the image, which means it needs to
				// account for that when calculating the placement of the button in the
				// top right corner of the image.
				let figureHeight = ref.parentElement.clientHeight;
				const caption = figure.querySelector( 'figcaption' );
				if ( caption ) {
					const captionComputedStyle =
						window.getComputedStyle( caption );
					if (
						! [ 'absolute', 'fixed' ].includes(
							captionComputedStyle.position
						)
					) {
						figureHeight =
							figureHeight -
							caption.offsetHeight -
							parseFloat( captionComputedStyle.marginTop ) -
							parseFloat( captionComputedStyle.marginBottom );
					}
				}

				const buttonOffsetTop = figureHeight - offsetHeight;
				const buttonOffsetRight = figureWidth - offsetWidth;

				let buttonTop = buttonOffsetTop + 16;
				let buttonRight = buttonOffsetRight + 16;

				// In the case of an image with object-fit: contain, the size of the
				// <img> element can be larger than the image itself, so it needs to
				// calculate where to place the button.
				if ( state.metadata[ imageId ].scaleAttr === 'contain' ) {
					// Natural ratio of the image.
					const naturalRatio = naturalWidth / naturalHeight;
					// Offset ratio of the image.
					const offsetRatio = offsetWidth / offsetHeight;

					if ( naturalRatio >= offsetRatio ) {
						// If it reaches the width first, it keeps the width and compute the
						// height.
						const referenceHeight = offsetWidth / naturalRatio;
						buttonTop =
							( offsetHeight - referenceHeight ) / 2 +
							buttonOffsetTop +
							16;
						buttonRight = buttonOffsetRight + 16;
					} else {
						// If it reaches the height first, it keeps the height and compute
						// the width.
						const referenceWidth = offsetHeight * naturalRatio;
						buttonTop = buttonOffsetTop + 16;
						buttonRight =
							( offsetWidth - referenceWidth ) / 2 +
							buttonOffsetRight +
							16;
					}
				}

				state.metadata[ imageId ].buttonTop = buttonTop;
				state.metadata[ imageId ].buttonRight = buttonRight;
			},
			setOverlayFocus() {
				if ( state.overlayEnabled ) {
					// Moves the focus to the dialog when it opens.
					const { ref } = getElement();
					ref.focus();
				}
			},
			setInertElements() {
				// Makes all children of the document inert exempt .wp-lightbox-overlay.
				document
					.querySelectorAll( 'body > :not(.wp-lightbox-overlay)' )
					.forEach( ( el ) => {
						if ( state.overlayEnabled ) {
							el.setAttribute( 'inert', '' );
						} else {
							el.removeAttribute( 'inert' );
						}
					} );
			},
			initTriggerButton() {
				const { imageId } = getContext();
				const { ref } = getElement();
				state.metadata[ imageId ].buttonRef = ref;
			},
		},
	},
	{ lock: true }
);
