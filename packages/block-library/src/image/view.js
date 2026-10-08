import {
	store,
	getContext,
	getElement,
	getConfig,
	withSyncEvent,
	withScope,
} from '@wordpress/interactivity';
import { prefersReducedMotion } from '../utils/reduced-motion';
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

/**
 * Elements made inert while the lightbox is open, so only those are restored
 * when it closes.
 *
 * @type {Element[]}
 */
let inertElements = [];

/**
 * Per-gesture state for the in-progress horizontal drag on the lightbox.
 *
 * `direction` is null until the gesture exceeds a small disambiguation
 * threshold, then latches to 'horizontal' or 'vertical' for the rest of it;
 * vertical gestures bypass the drag-tracking path so native scroll suppression
 * keeps working unchanged.
 */
const touchDrag = {
	isDragging: false,
	direction: null,
	// The elements the gesture moves. The drag offset is written on these
	// rather than on the overlay, whose `style` attribute is bound to
	// `state.overlayStyles`: the framework rewrites that attribute whole
	// whenever the bound value changes, so a resize part way through a gesture
	// used to wipe the drag out from under the finger. Nothing is bound to the
	// containers, so what is written here stays written.
	slideEls: [],
	// Animations currently running on `slideEls`, so an interrupted gesture can
	// stop them.
	animations: [],
	// Finishes a committed swipe once its slide is over. Held so that a new
	// gesture can settle a swipe still in flight rather than stranding it.
	settle: null,
};

// Duration of the commit slide and of the fade that follows it, in
// milliseconds. These drive `element.animate()` directly, so they are the only
// definition: nothing in `style.scss` has to be kept in step with them.
const SLIDE_DURATION_MS = 220;
const FADE_DURATION_MS = 150;
const SLIDE_EASING = 'cubic-bezier(0.2, 0.7, 0.2, 1)';

// Movement (px) needed before a gesture latches to horizontal or vertical.
const DIRECTION_LATCH_THRESHOLD_PX = 10;

// Horizontal movement must exceed vertical by this ratio to count as a swipe.
const HORIZONTAL_DOMINANCE_RATIO = 1.5;

// Fraction of a slide a drag must pass to commit to the next image.
const COMMIT_DISTANCE_RATIO = 0.2;

// A short, fast horizontal flick commits even below the distance threshold.
const FLICK_DISTANCE_PX = 50;
const FLICK_MAX_DURATION_MS = 300;

/**
 * How far a committed swipe travels before the image is swapped.
 *
 * The enlarged image is centred in the viewport, so one viewport width is one
 * slide. Naming it keeps the commit distance and the commit threshold in step,
 * and marks the single place that would change if the images were ever laid
 * out as a strip rather than one at a time.
 *
 * @return {number} The slide pitch in pixels.
 */
function getSlidePitch() {
	return window.innerWidth;
}

/**
 * The transform that places a slide at a given horizontal offset from rest.
 *
 * Mirrors the `transform` the stylesheet gives `.lightbox-image-container`, so
 * an animation can start and end on values the element would hold on its own.
 *
 * @param {number} offset Offset from the resting position, in pixels.
 * @return {string} A CSS transform value.
 */
function slideTransform( offset ) {
	return `translate(calc(-50% + ${ offset }px), -50%)`;
}

/**
 * Places the slides at a horizontal offset from rest.
 *
 * @param {Element[]} els    The slide elements.
 * @param {number}    offset Offset in pixels; 0 returns them to rest.
 */
function setDragOffset( els, offset ) {
	els.forEach( ( el ) => {
		if ( offset ) {
			el.style.setProperty(
				'--wp--lightbox-drag-offset',
				`${ offset }px`
			);
		} else {
			el.style.removeProperty( '--wp--lightbox-drag-offset' );
		}
	} );
}

/**
 * Stops whatever the gesture is animating.
 *
 * Cancelling drops a `fill`, so the slides fall back to the transform the
 * stylesheet gives them, which reads the offset set by `setDragOffset()`.
 */
function stopDragAnimations() {
	touchDrag.animations.forEach( ( animation ) => animation.cancel() );
	touchDrag.animations = [];
}

/**
 * Clears the per-gesture drag state.
 *
 * A committed swipe still animating is left alone: it is started as a gesture
 * ends and holds its own references. `touchDrag.settle` deals with that side.
 */
function resetTouchDrag() {
	touchDrag.isDragging = false;
	touchDrag.direction = null;
	touchDrag.slideEls = [];
}

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
				if ( ! state.overlayEnabled ) {
					return;
				}

				// Prevents triggering the scroll event because otherwise the page
				// jumps around when it resets the scroll position. This also means
				// that closing the lightbox requires a simple tap. May change in
				// the future with a better way to reset scroll during swipes.
				event.preventDefault();

				const t = event.touches && event.touches[ 0 ];
				if ( ! t || ! state.hasNavigation ) {
					return;
				}

				const deltaX = t.clientX - touchStartEvent.startX;
				const deltaY = t.clientY - touchStartEvent.startY;
				const absDeltaX = Math.abs( deltaX );
				const absDeltaY = Math.abs( deltaY );

				// Latches direction once the user has moved past a small
				// disambiguation threshold, then sticks with that decision for the
				// rest of the gesture.
				if (
					! touchDrag.direction &&
					( absDeltaX > DIRECTION_LATCH_THRESHOLD_PX ||
						absDeltaY > DIRECTION_LATCH_THRESHOLD_PX )
				) {
					touchDrag.direction =
						absDeltaX > absDeltaY ? 'horizontal' : 'vertical';
					touchDrag.slideEls = Array.from(
						event.currentTarget.querySelectorAll(
							'.lightbox-image-container'
						)
					);
				}

				if (
					touchDrag.direction === 'horizontal' &&
					touchDrag.slideEls.length
				) {
					touchDrag.isDragging = true;
					setDragOffset( touchDrag.slideEls, deltaX );
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
				// Settles a swipe left over from the previous gesture, so this one
				// starts from an image at rest rather than part way through a
				// slide. Dropping it instead would leave the image parked
				// off-screen and never swap it for the next one.
				touchDrag.settle?.();
				stopDragAnimations();
				resetTouchDrag();
			},
			handleTouchCancel() {
				// The gesture was interrupted — the browser cancelled the drag, or
				// a system gesture took over — so no `touchend` will arrive to
				// settle the image. Abandon the drag rather than committing it,
				// otherwise the offset stays on the slides, which outlive the
				// lightbox being closed and reopened.
				stopDragAnimations();
				setDragOffset( touchDrag.slideEls, 0 );
				resetTouchDrag();
				lastTouchTime = Date.now();
				isTouching = false;
			},
			handleTouchEnd: withSyncEvent( ( event ) => {
				const touchEndEvent =
					( event.changedTouches && event.changedTouches[ 0 ] ) ||
					( event.touches && event.touches[ 0 ] );
				const now = Date.now();

				if (
					touchEndEvent &&
					state.overlayEnabled &&
					touchDrag.isDragging
				) {
					event.preventDefault();

					const deltaX =
						touchEndEvent.clientX - touchStartEvent.startX;
					const deltaY =
						touchEndEvent.clientY - touchStartEvent.startY;
					const absDeltaX = Math.abs( deltaX );
					const absDeltaY = Math.abs( deltaY );
					const elapsedMs = now - touchStartEvent.startTime;
					const slidePitch = getSlidePitch();
					const isHorizontalDominant =
						absDeltaX > absDeltaY * HORIZONTAL_DOMINANCE_RATIO;
					const pastDistanceThreshold =
						absDeltaX > slidePitch * COMMIT_DISTANCE_RATIO;
					const isFastFlick =
						absDeltaX > FLICK_DISTANCE_PX &&
						elapsedMs < FLICK_MAX_DURATION_MS;
					const shouldCommit =
						isHorizontalDominant &&
						( pastDistanceThreshold || isFastFlick );
					const showsNextImage = deltaX < 0;

					const slideEls = touchDrag.slideEls;
					const reducedMotion = prefersReducedMotion();
					// A committed swipe carries the image off the side it was
					// dragged towards; an uncommitted one falls back to rest.
					const committedOffset = showsNextImage
						? -slidePitch
						: slidePitch;
					const endOffset = shouldCommit ? committedOffset : 0;

					// Swaps the image and puts the slides back at rest, once the
					// slide has played out. Runs exactly once, whether it is
					// reached by the animation finishing or by the next gesture
					// settling it early.
					const settle = () => {
						if ( touchDrag.settle !== settle ) {
							return;
						}
						touchDrag.settle = null;
						stopDragAnimations();
						setDragOffset( slideEls, 0 );

						if ( ! shouldCommit ) {
							return;
						}
						if ( showsNextImage ) {
							actions.showNextImage( event );
						} else {
							actions.showPreviousImage( event );
						}
						if ( reducedMotion ) {
							return;
						}
						// Fades the image that replaced the one carried off.
						// Scripted animations take precedence over the overlay's
						// own CSS animations without touching its class list, so
						// this cannot disturb the zoom the lightbox plays when an
						// image is first opened.
						touchDrag.animations = slideEls.map( ( el ) =>
							el.animate( [ { opacity: 0 }, { opacity: 1 } ], {
								duration: FADE_DURATION_MS,
								easing: 'ease-out',
							} )
						);
					};
					touchDrag.settle = settle;

					if ( reducedMotion ) {
						settle();
					} else {
						touchDrag.animations = slideEls.map( ( el ) =>
							el.animate(
								[
									{ transform: slideTransform( deltaX ) },
									{
										transform: slideTransform( endOffset ),
									},
								],
								{
									duration: SLIDE_DURATION_MS,
									easing: SLIDE_EASING,
									// Holds the end position until `settle()` has
									// moved the slides there itself.
									fill: 'forwards',
								}
							)
						);
						touchDrag.animations[ 0 ].onfinish =
							withScope( settle );
					}
				}

				lastTouchTime = now;
				isTouching = false;
				resetTouchDrag();
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
				const originalRatio = originalWidth / originalHeight;

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

				// Typically, it uses the image's full-sized dimensions. If those
				// dimensions have not been set (i.e. an external image with only one
				// size), the image's dimensions in the lightbox are the same
				// as those of the image in the content.
				const imgMaxWidth = parseFloat(
					state.selectedImage.targetWidth &&
						state.selectedImage.targetWidth !== 'none'
						? state.selectedImage.targetWidth
						: naturalWidth
				);
				const imgMaxHeight = parseFloat(
					state.selectedImage.targetHeight &&
						state.selectedImage.targetHeight !== 'none'
						? state.selectedImage.targetHeight
						: naturalHeight
				);

				// Ratio of the biggest image stored in the database.
				const fullSizeRatio = imgMaxWidth / imgMaxHeight;
				let containerWidth = imgMaxWidth;
				let containerHeight = imgMaxHeight;

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

				if ( fullSizeRatio > targetContainerRatio ) {
					// If targetMaxWidth is reached before targetMaxHeight.
					containerWidth = targetMaxWidth;
					containerHeight = containerWidth / fullSizeRatio;
				} else {
					// If targetMaxHeight is reached before targetMaxWidth.
					containerHeight = targetMaxHeight;
					containerWidth = containerHeight * fullSizeRatio;
				}

				const hasCroppedSource =
					naturalRatio.toFixed( 2 ) !== fullSizeRatio.toFixed( 2 );
				const sourceRatio = hasCroppedSource
					? naturalRatio
					: fullSizeRatio;

				// Include any crop already applied to the thumbnail file.
				const containerScale = Math.max(
					originalWidth / containerWidth,
					originalHeight / containerHeight,
					originalWidth / ( containerHeight * sourceRatio ),
					( originalHeight * sourceRatio ) / containerWidth
				);
				const thumbnailWidth = originalWidth / containerScale;
				const thumbnailHeight = originalHeight / containerScale;
				const cropX = ( containerWidth - thumbnailWidth ) / 2;
				const cropY = ( containerHeight - thumbnailHeight ) / 2;
				screenPosX -= cropX * containerScale;
				screenPosY -= cropY * containerScale;

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
					--wp--lightbox-image-width: ${ containerWidth }px;
					--wp--lightbox-image-height: ${ containerHeight }px;
					--wp--lightbox-initial-clip: inset(${ cropY }px ${ cropX }px);
					--wp--lightbox-thumbnail-width: ${
						hasCroppedSource ? thumbnailWidth : containerWidth
					}px;
					--wp--lightbox-thumbnail-height: ${
						hasCroppedSource ? thumbnailHeight : containerHeight
					}px;
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
				if ( ! state.overlayEnabled ) {
					inertElements.forEach( ( el ) =>
						el.removeAttribute( 'inert' )
					);
					inertElements = [];
					return;
				}
				// Inerts the overlay's siblings at each level, not its ancestors.
				const { ref } = getElement();
				let node = ref;
				while ( node && node !== document.body && node.parentElement ) {
					for ( const sibling of node.parentElement.children ) {
						if (
							sibling !== node &&
							! sibling.hasAttribute( 'inert' )
						) {
							sibling.setAttribute( 'inert', '' );
							inertElements.push( sibling );
						}
					}
					node = node.parentElement;
				}
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
