/**
 * WordPress dependencies
 */
import {
	store,
	getContext,
	getElement,
	getConfig,
} from '@wordpress/interactivity';

// Debounce utility for scroll handling
function debounce( func, wait ) {
	let timeout;
	return function ( ...args ) {
		const later = () => {
			clearTimeout( timeout );
			func( ...args );
		};
		clearTimeout( timeout );
		timeout = setTimeout( later, wait );
	};
}

const debouncedUpdates = new WeakMap();

// Store touch start data per track element to avoid cross-slider interference.
const touchStartData = new WeakMap();
const touchHandlers = new WeakMap();

function clampIndex( index, totalSlides ) {
	if ( totalSlides <= 0 ) {
		return 0;
	}

	return Math.max( 0, Math.min( index, totalSlides - 1 ) );
}

function getSlideLabel( index, totalSlides ) {
	const { slideLabelTemplate } = getConfig();
	return slideLabelTemplate
		.replace( '%1$d', index + 1 )
		.replace( '%2$d', totalSlides );
}

function getSlides( track ) {
	return Array.from( track.children ).filter( ( child ) =>
		child.classList.contains( 'wp-block-slide' )
	);
}

function updateSlideInert( slides, currentIndex ) {
	const hasPaginationInSlides = slides.some( ( slide ) =>
		slide.querySelector( '.wp-block-slider-pagination' )
	);

	slides.forEach( ( slide, index ) => {
		if ( hasPaginationInSlides || index === currentIndex ) {
			slide.removeAttribute( 'inert' );
		} else {
			slide.setAttribute( 'inert', '' );
		}
	} );
}

function getDirectSlidesTrack( slider ) {
	return Array.from( slider?.children ?? [] ).find( ( child ) =>
		child.classList.contains( 'wp-block-slider-track' )
	);
}

function getSliderElements( ref ) {
	const slider = ref.closest( '.wp-block-slider' );
	const track = getDirectSlidesTrack( slider );

	if ( ! slider || ! track ) {
		return {
			slider,
			track,
			slides: [],
		};
	}

	return {
		slider,
		track,
		slides: getSlides( track ),
	};
}

function scrollToSlide( ref, index ) {
	const { track, slides } = getSliderElements( ref );
	if ( slides.length === 0 ) {
		return;
	}

	const context = getContext();
	const nextIndex = clampIndex( index, slides.length );
	context.currentIndex = nextIndex;
	context.totalSlides = slides.length;
	updateSlideInert( slides, nextIndex );

	const targetSlide = slides[ nextIndex ];
	track.scrollTo( {
		left: targetSlide.offsetLeft - track.offsetLeft,
		behavior: 'smooth',
	} );
}

function moveSlide( ref, direction ) {
	const { slides } = getSliderElements( ref );
	if ( slides.length === 0 ) {
		return;
	}

	const context = getContext();
	let nextIndex = context.currentIndex + direction;

	if ( nextIndex < 0 ) {
		nextIndex = context.loop ? slides.length - 1 : 0;
	} else if ( nextIndex > slides.length - 1 ) {
		nextIndex = context.loop ? 0 : slides.length - 1;
	}

	scrollToSlide( ref, nextIndex );
}

/**
 * Determines the closest slide index based on the current scroll position.
 * @param {HTMLElement}   track  The track element containing the slides.
 * @param {HTMLElement[]} slides The array of slide elements.
 */
function getClosestSlideIndex( track, slides ) {
	const scrollLeft = track.scrollLeft;
	const trackLeft = track.offsetLeft;
	let closestIndex = 0;
	let closestDistance = Infinity;

	slides.forEach( ( slide, index ) => {
		const distance = Math.abs( slide.offsetLeft - trackLeft - scrollLeft );
		if ( distance < closestDistance ) {
			closestDistance = distance;
			closestIndex = index;
		}
	} );

	return closestIndex;
}

function getDebouncedUpdate( trackElement ) {
	if ( ! debouncedUpdates.has( trackElement ) ) {
		debouncedUpdates.set(
			trackElement,
			debounce( ( ref, context ) => {
				const slides = getSlides( ref );
				if ( slides.length === 0 ) {
					return;
				}

				const currentIndex = getClosestSlideIndex( ref, slides );

				context.currentIndex = currentIndex;
				context.totalSlides = slides.length;
				updateSlideInert( slides, currentIndex );
			}, 150 )
		);
	}
	return debouncedUpdates.get( trackElement );
}

store( 'core/slider', {
	state: {
		get isAtStart() {
			const context = getContext();
			return (
				context.totalSlides <= 1 ||
				( ! context.loop && context.currentIndex === 0 )
			);
		},
		get isAtEnd() {
			const context = getContext();
			return (
				context.totalSlides <= 1 ||
				( ! context.loop &&
					context.currentIndex >= context.totalSlides - 1 )
			);
		},
		get ariaLive() {
			return getContext().hasFocus ? 'polite' : 'off';
		},
		get dots() {
			const { totalSlides } = getContext();
			return Array.from( { length: totalSlides }, ( _, i ) => i );
		},
		get isDotActive() {
			const { item, currentIndex } = getContext();
			return item === currentIndex;
		},
		get dotLabel() {
			const { item, totalSlides } = getContext();
			return getSlideLabel( item, totalSlides );
		},
		get currentSlideLabel() {
			const { currentIndex, totalSlides } = getContext();
			return getSlideLabel( currentIndex, totalSlides );
		},
	},
	actions: {
		nextSlide() {
			const { ref } = getElement();
			if ( ref.getAttribute( 'aria-disabled' ) === 'true' ) {
				return;
			}
			moveSlide( ref, 1 );
		},
		prevSlide() {
			const { ref } = getElement();
			if ( ref.getAttribute( 'aria-disabled' ) === 'true' ) {
				return;
			}
			moveSlide( ref, -1 );
		},
		handleScroll() {
			// Get ref and context in the action scope (before debounce)
			const { ref } = getElement();
			const context = getContext();

			// Get the debounced update function for this track
			const updateScroll = getDebouncedUpdate( ref );
			updateScroll( ref, context );
		},
		goToSlide() {
			const { ref } = getElement();
			const context = getContext();
			scrollToSlide( ref, context.item );
		},
		handleFocusIn() {
			getContext().hasFocus = true;
		},
		handleFocusOut() {
			getContext().hasFocus = false;
		},
	},
	callbacks: {
		initTrack() {
			const context = getContext();
			const { ref } = getElement();

			// Update totalSlides from actual DOM (in case it differs from PHP count)
			const slides = getSlides( ref );
			context.totalSlides = slides.length;
			context.currentIndex = clampIndex(
				context.currentIndex,
				context.totalSlides
			);
			updateSlideInert( slides, context.currentIndex );

			// Clean up previous touch listeners if initTrack runs again.
			const prev = touchHandlers.get( ref );
			if ( prev ) {
				ref.removeEventListener( 'touchstart', prev.start );
				ref.removeEventListener( 'touchend', prev.end );
			}

			// Touch start: store per-track touch data.
			function onTouchStart( event ) {
				const t = event.touches && event.touches[ 0 ];
				if ( t ) {
					touchStartData.set( ref, {
						x: t.clientX,
						y: t.clientY,
						time: Date.now(),
					} );
				}
			}

			// Touch end: determine swipe direction using per-track data.
			function onTouchEnd( event ) {
				const startData = touchStartData.get( ref );
				if ( ! startData ) {
					return;
				}

				const touchEndEvent =
					( event.changedTouches && event.changedTouches[ 0 ] ) ||
					( event.touches && event.touches[ 0 ] );
				if ( ! touchEndEvent ) {
					return;
				}

				const deltaX = touchEndEvent.clientX - startData.x;
				const deltaY = touchEndEvent.clientY - startData.y;
				const absDeltaX = Math.abs( deltaX );
				const absDeltaY = Math.abs( deltaY );
				const elapsedMs = Date.now() - startData.time;
				const isHorizontalSwipe =
					absDeltaX > 50 &&
					absDeltaX > absDeltaY * 1.5 &&
					elapsedMs < 800;

				if ( isHorizontalSwipe ) {
					event.preventDefault();
					moveSlide( ref, deltaX < 0 ? 1 : -1 );
				}
			}

			touchHandlers.set( ref, { start: onTouchStart, end: onTouchEnd } );

			ref.addEventListener( 'touchstart', onTouchStart, {
				passive: true,
			} );
			ref.addEventListener( 'touchend', onTouchEnd, {
				passive: false,
			} );

			// Return cleanup function for when the element is removed.
			return () => {
				ref.removeEventListener( 'touchstart', onTouchStart );
				ref.removeEventListener( 'touchend', onTouchEnd );
				touchHandlers.delete( ref );
				touchStartData.delete( ref );
			};
		},
	},
} );
