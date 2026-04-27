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

let sliderTouchStartX = 0;
let sliderTouchStartY = 0;
let sliderTouchStartTime = 0;

const sliderTouchEndHandlerWrappers = new WeakMap();

function handleSliderTouchStart( event ) {
	const t = event.touches && event.touches[ 0 ];
	if ( t ) {
		sliderTouchStartX = t.clientX;
		sliderTouchStartY = t.clientY;
		sliderTouchStartTime = Date.now();
	}
}

function handleSliderTouchEnd( event, ref ) {
	const touchEndEvent =
		( event.changedTouches && event.changedTouches[ 0 ] ) ||
		( event.touches && event.touches[ 0 ] );
	const now = Date.now();
	if ( touchEndEvent ) {
		const deltaX = touchEndEvent.clientX - sliderTouchStartX;
		const deltaY = touchEndEvent.clientY - sliderTouchStartY;
		const absDeltaX = Math.abs( deltaX );
		const absDeltaY = Math.abs( deltaY );
		const elapsedMs = now - sliderTouchStartTime;
		const isHorizontalSwipe =
			absDeltaX > 50 && absDeltaX > absDeltaY * 1.5 && elapsedMs < 800;
		if ( isHorizontalSwipe ) {
			event.preventDefault();
			if ( deltaX < 0 ) {
				moveSlide( ref, 1 ); // Next slide
			} else {
				moveSlide( ref, -1 ); // Previous slide
			}
		}
	}
}

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

	const slideWidth = slides[ 0 ].offsetWidth;
	track.scrollTo( {
		left: nextIndex * slideWidth,
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

function getDebouncedUpdate( trackElement ) {
	if ( ! debouncedUpdates.has( trackElement ) ) {
		debouncedUpdates.set(
			trackElement,
			debounce( ( ref, context ) => {
				const slides = getSlides( ref );
				if ( slides.length === 0 ) {
					return;
				}

				const slideWidth = slides[ 0 ].offsetWidth;
				if ( slideWidth === 0 ) {
					return;
				}

				const scrollLeft = ref.scrollLeft;
				const currentIndex = clampIndex(
					Math.round( scrollLeft / slideWidth ),
					slides.length
				);

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

			// Add touch event listeners for swipe navigation
			// Remove previous listeners if any (to avoid duplicates)
			ref.removeEventListener( 'touchstart', handleSliderTouchStart );
			const prevWrapper = sliderTouchEndHandlerWrappers.get( ref );
			if ( prevWrapper ) {
				ref.removeEventListener( 'touchend', prevWrapper );
			}

			// Handler wrapper to pass ref
			function sliderTouchEndHandlerWrapper( event ) {
				handleSliderTouchEnd( event, ref );
			}
			// Store wrapper in WeakMap for removal if needed
			sliderTouchEndHandlerWrappers.set(
				ref,
				sliderTouchEndHandlerWrapper
			);

			ref.addEventListener( 'touchstart', handleSliderTouchStart, {
				passive: true,
			} );
			ref.addEventListener( 'touchend', sliderTouchEndHandlerWrapper, {
				passive: false,
			} );
		},
	},
} );
