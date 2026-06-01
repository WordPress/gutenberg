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
	function debounced( ...args ) {
		const later = () => {
			timeout = null;
			func( ...args );
		};
		clearTimeout( timeout );
		timeout = setTimeout( later, wait );
	}
	debounced.cancel = () => {
		clearTimeout( timeout );
		timeout = null;
	};
	return debounced;
}

const debouncedUpdates = new WeakMap();

// Store touch start data per track element to avoid cross-slider interference.
const touchStartData = new WeakMap();
const touchHandlers = new WeakMap();

function normalizeSlidesToShow( slidesToShow, totalSlides ) {
	const parsedSlidesToShow = Number.parseInt( slidesToShow, 10 );

	if ( Number.isNaN( parsedSlidesToShow ) ) {
		return 1;
	}

	return Math.min(
		Math.max( 1, parsedSlidesToShow ),
		Math.max( 1, totalSlides )
	);
}

function getMaxStartIndex( totalSlides, slidesToShow ) {
	return Math.max( 0, totalSlides - slidesToShow );
}

function clampIndex( index, totalSlides, slidesToShow ) {
	if ( totalSlides <= 0 ) {
		return 0;
	}

	const maxStartIndex = getMaxStartIndex( totalSlides, slidesToShow );

	return Math.max( 0, Math.min( index, maxStartIndex ) );
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

function updateSlideInert( slides, currentIndex, slidesToShow ) {
	const lastVisibleIndex = currentIndex + slidesToShow - 1;

	slides.forEach( ( slide, index ) => {
		if ( index >= currentIndex && index <= lastVisibleIndex ) {
			slide.removeAttribute( 'inert' );
		} else {
			slide.setAttribute( 'inert', '' );
		}
	} );
}

function getSliderElements( ref ) {
	const slider = ref.closest( '.wp-block-slider' );
	const explicitTrack =
		slider?.querySelector( '.wp-block-slider-track' ) ?? null;
	const track = explicitTrack ?? slider ?? null;

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
	const visibleSlides = normalizeSlidesToShow(
		context.slidesToShow,
		slides.length
	);
	const nextIndex = clampIndex( index, slides.length, visibleSlides );
	context.currentIndex = nextIndex;
	context.totalSlides = slides.length;
	context.slidesToShow = visibleSlides;
	updateSlideInert( slides, nextIndex, visibleSlides );

	/*
	 * Use getBoundingClientRect() to compute the scrollTo target so the same
	 * arithmetic works in both LTR and RTL without special-casing either one.
	 *
	 * slideRect.left - trackRect.left is the pixel offset of the slide's left
	 * edge from the track's currently-visible left edge.  Adding that delta to
	 * track.scrollLeft yields the exact scrollLeft value that places the slide
	 * flush with the left of the viewport.  Because scrollLeft in RTL is 0 or
	 * negative and getBoundingClientRect uses the same sign convention as the
	 * viewport, the delta naturally comes out negative for slides that are to
	 * the left of the viewport in RTL, producing the correct negative target.
	 */
	const targetSlide = slides[ nextIndex ];
	const trackRect = track.getBoundingClientRect();
	const slideRect = targetSlide.getBoundingClientRect();
	track.scrollTo( {
		left: track.scrollLeft + ( slideRect.left - trackRect.left ),
		behavior: 'smooth',
	} );
}

function moveSlide( ref, direction ) {
	const { track, slides } = getSliderElements( ref );
	if ( slides.length === 0 ) {
		return;
	}

	/*
	 * Cancel any pending debounced scroll update so it cannot overwrite the
	 * index we are about to set.  This is necessary because a touch-drag or
	 * mouse-wheel scroll moves the track DOM position without going through
	 * moveSlide, leaving context.currentIndex stale until the 150 ms debounce
	 * fires.  If the user clicks a button before that timer expires we must
	 * read the real scroll position from the DOM rather than the stale context
	 * value, and we must prevent the pending debounce from overwriting our
	 * new value afterward.
	 */
	const pendingUpdate = debouncedUpdates.get( track );
	if ( pendingUpdate ) {
		pendingUpdate.cancel();
	}

	const context = getContext();
	const visibleSlides = normalizeSlidesToShow(
		context.slidesToShow,
		slides.length
	);
	const maxStartIndex = getMaxStartIndex( slides.length, visibleSlides );

	// Read ground-truth index directly from the DOM scroll position so that
	// a drag/swipe that settled visually but hasn't yet updated context is
	// accounted for before we compute the next index.
	const domIndex = clampIndex(
		getClosestSlideIndex( track, slides ),
		slides.length,
		visibleSlides
	);
	if ( domIndex !== context.currentIndex ) {
		context.currentIndex = domIndex;
	}

	let nextIndex = context.currentIndex + direction;

	if ( nextIndex < 0 ) {
		nextIndex = context.loop ? maxStartIndex : 0;
	} else if ( nextIndex > maxStartIndex ) {
		nextIndex = context.loop ? 0 : maxStartIndex;
	}

	scrollToSlide( ref, nextIndex );
}

/**
 * Determines the closest slide index based on the current scroll position.
 *
 * Uses getBoundingClientRect() instead of offsetLeft/scrollLeft arithmetic
 * so the result is correct in both LTR and RTL without any special-casing.
 * slideRect.left - trackRect.left is the distance of each slide's left edge
 * from the track's visible left edge regardless of scroll direction or writing
 * mode, because both rects are in the same viewport coordinate space.
 *
 * @param {HTMLElement}   track  The track element containing the slides.
 * @param {HTMLElement[]} slides The array of slide elements.
 * @return {number} Zero-based index of the slide closest to the viewport.
 */
function getClosestSlideIndex( track, slides ) {
	const trackRect = track.getBoundingClientRect();
	let closestIndex = 0;
	let closestDistance = Infinity;

	slides.forEach( ( slide, index ) => {
		const distance = Math.abs(
			slide.getBoundingClientRect().left - trackRect.left
		);
		if ( distance < closestDistance ) {
			closestDistance = distance;
			closestIndex = index;
		}
	} );

	return closestIndex;
}

function getDebouncedUpdate( trackElement ) {
	if ( ! debouncedUpdates.has( trackElement ) ) {
		const debouncedFn = debounce( ( ref, context ) => {
			const slides = getSlides( ref );
			if ( slides.length === 0 ) {
				return;
			}
			const visibleSlides = normalizeSlidesToShow(
				context.slidesToShow,
				slides.length
			);

			const currentIndex = clampIndex(
				getClosestSlideIndex( ref, slides ),
				slides.length,
				visibleSlides
			);

			context.currentIndex = currentIndex;
			context.totalSlides = slides.length;
			context.slidesToShow = visibleSlides;
			updateSlideInert( slides, currentIndex, visibleSlides );
		}, 150 );
		debouncedUpdates.set( trackElement, debouncedFn );
	}
	return debouncedUpdates.get( trackElement );
}

store( 'core/slider', {
	state: {
		get isAtStart() {
			const context = getContext();
			const slidesToShow = normalizeSlidesToShow(
				context.slidesToShow,
				context.totalSlides
			);
			const maxStartIndex = getMaxStartIndex(
				context.totalSlides,
				slidesToShow
			);
			return (
				maxStartIndex === 0 ||
				( ! context.loop && context.currentIndex === 0 )
			);
		},
		get isAtEnd() {
			const context = getContext();
			const slidesToShow = normalizeSlidesToShow(
				context.slidesToShow,
				context.totalSlides
			);
			const maxStartIndex = getMaxStartIndex(
				context.totalSlides,
				slidesToShow
			);
			return (
				maxStartIndex === 0 ||
				( ! context.loop && context.currentIndex >= maxStartIndex )
			);
		},
		get ariaLive() {
			return getContext().hasFocus ? 'polite' : 'off';
		},
		get dots() {
			const { totalSlides, slidesToShow } = getContext();
			const normalizedSlidesToShow = normalizeSlidesToShow(
				slidesToShow,
				totalSlides
			);
			const maxStartIndex = getMaxStartIndex(
				totalSlides,
				normalizedSlidesToShow
			);
			return Array.from( { length: maxStartIndex + 1 }, ( _, i ) => i );
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
			context.slidesToShow = normalizeSlidesToShow(
				context.slidesToShow,
				context.totalSlides
			);
			context.currentIndex = clampIndex(
				context.currentIndex,
				context.totalSlides,
				context.slidesToShow
			);
			updateSlideInert(
				slides,
				context.currentIndex,
				context.slidesToShow
			);

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

				// Cancel any pending debounced scroll update so the timer
				// closure cannot fire after the track is torn down and
				// mutate stale context or hold the ref in memory.
				const pendingUpdate = debouncedUpdates.get( ref );
				if ( pendingUpdate ) {
					pendingUpdate.cancel();
					debouncedUpdates.delete( ref );
				}
			};
		},
	},
} );
