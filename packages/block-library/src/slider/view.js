/**
 * WordPress dependencies
 */
import {
	store,
	getContext,
	getElement,
	getConfig,
} from '@wordpress/interactivity';

// Debounce utility.
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

function formatLabel( template, index, totalSlides ) {
	return template.replace( '%1$d', index + 1 ).replace( '%2$d', totalSlides );
}

function getSlideLabel( index, totalSlides ) {
	return formatLabel( getConfig().slideLabelTemplate, index, totalSlides );
}

function getVisibleSlidesLabel( index, totalSlides, slidesToShow ) {
	if ( slidesToShow === 1 ) {
		return getSlideLabel( index, totalSlides );
	}

	const firstSlide = index + 1;
	const lastSlide = Math.min( index + slidesToShow, totalSlides );

	return getConfig()
		.slidesLabelTemplate.replace( '%1$d', firstSlide )
		.replace( '%2$d', lastSlide )
		.replace( '%3$d', totalSlides );
}

function getIndicatorLabel( index, totalSlides ) {
	return formatLabel(
		getConfig().indicatorLabelTemplate,
		index,
		totalSlides
	);
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

function updateSliderStateFromCSS( track, context ) {
	const slider = track.closest( '.wp-block-slider' );
	const slides = getSlides( track );

	// CSS overrides the configured "slides to show" value to display one slide at a time on mobile.
	// Read the actual number of visible slides so navigation and inert state match the layout.
	const computedSlidesToShow = slider
		? Number.parseInt(
				window
					.getComputedStyle( slider )
					.getPropertyValue( '--wp--slider-slides-to-show' ),
				10
		  )
		: context.slidesToShow;
	const slidesToShow = normalizeSlidesToShow(
		computedSlidesToShow,
		slides.length
	);
	const currentIndex = clampIndex(
		context.currentIndex,
		slides.length,
		slidesToShow
	);

	context.totalSlides = slides.length;
	context.slidesToShow = slidesToShow;
	context.currentIndex = currentIndex;
	updateSlideInert( slides, currentIndex, slidesToShow );
}

function getSliderElements( ref ) {
	const slider = ref.closest( '.wp-block-slider' );
	const track =
		Array.from( slider?.children ?? [] ).find( ( child ) =>
			child.classList.contains( 'wp-block-slider-track' )
		) ?? null;

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
	 * Align the leading edge of the target slide to the leading edge of the
	 * track. In LTR the leading edge is the left edge; in RTL it is the right
	 * edge. getBoundingClientRect() always uses viewport coordinates
	 * (left increases left-to-right) so the delta is direction-aware when we
	 * choose the correct edge for each axis.
	 */
	const isRTL = window.getComputedStyle( track ).direction === 'rtl';
	const targetSlide = slides[ nextIndex ];
	const trackRect = track.getBoundingClientRect();
	const slideRect = targetSlide.getBoundingClientRect();
	const offset = isRTL
		? slideRect.right - trackRect.right
		: slideRect.left - trackRect.left;
	track.scrollTo( {
		left: track.scrollLeft + offset,
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
 * Compares leading edges in the current writing direction: the left edge in
 * LTR and the right edge in RTL. This ensures the slide whose leading edge is
 * flush with the track's leading edge is identified as the current slide,
 * which is correct for both single and multi-slide configurations.
 *
 * @param {HTMLElement}   track  The track element containing the slides.
 * @param {HTMLElement[]} slides The array of slide elements.
 * @return {number} Zero-based index of the slide closest to the track's leading edge.
 */
function getClosestSlideIndex( track, slides ) {
	const trackRect = track.getBoundingClientRect();
	const isRTL = window.getComputedStyle( track ).direction === 'rtl';
	let closestIndex = 0;
	let closestDistance = Infinity;

	slides.forEach( ( slide, index ) => {
		const slideRect = slide.getBoundingClientRect();
		const distance = Math.abs(
			isRTL
				? slideRect.right - trackRect.right
				: slideRect.left - trackRect.left
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
		get indicators() {
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
		get isIndicatorActive() {
			const { item, currentIndex } = getContext();
			return item === currentIndex;
		},
		get indicatorLabel() {
			const { item, currentIndex, totalSlides, slidesToShow } =
				getContext();
			return item === currentIndex
				? getVisibleSlidesLabel( item, totalSlides, slidesToShow )
				: getIndicatorLabel( item, totalSlides );
		},
		get currentSlideLabel() {
			const { currentIndex, totalSlides, slidesToShow } = getContext();
			return getVisibleSlidesLabel(
				currentIndex,
				totalSlides,
				slidesToShow
			);
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
			if ( ref.getAttribute( 'aria-disabled' ) === 'true' ) {
				return;
			}
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

			// Apply the effective responsive value to the slider state.
			updateSliderStateFromCSS( ref, context );

			const handleResize = debounce(
				() => updateSliderStateFromCSS( ref, context ),
				150
			);
			window.addEventListener( 'resize', handleResize );

			// Return cleanup function for when the element is removed.
			return () => {
				window.removeEventListener( 'resize', handleResize );
				handleResize.cancel();
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
