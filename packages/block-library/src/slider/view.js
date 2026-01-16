/**
 * WordPress dependencies
 */
import { store, getContext, getElement } from '@wordpress/interactivity';

// Debounce helper
function debounce( func, wait ) {
	let timeout;
	return function executedFunction( ...args ) {
		const later = () => {
			clearTimeout( timeout );
			func( ...args );
		};
		clearTimeout( timeout );
		timeout = setTimeout( later, wait );
	};
}

store( 'core/slider', {
	state: {
		get isAtStart() {
			const context = getContext();
			return context.currentIndex === 0;
		},
		get isAtEnd() {
			const context = getContext();
			return context.currentIndex >= context.totalSlides - 1;
		},
	},
	actions: {
		nextSlide() {
			const { ref } = getElement();

			// Find the track element (go up to slider, then find track)
			const slider = ref.closest( '.wp-block-slider' );
			const track = slider?.querySelector( '.wp-block-slider-track' );

			if ( ! track ) {
				return;
			}

			const slides = track.querySelectorAll( '.wp-block-slide' );
			if ( slides.length === 0 ) {
				return;
			}

			const slideWidth = slides[ 0 ].offsetWidth;
			track.scrollBy( { left: slideWidth, behavior: 'smooth' } );
		},
		prevSlide() {
			const { ref } = getElement();

			// Find the track element
			const slider = ref.closest( '.wp-block-slider' );
			const track = slider?.querySelector( '.wp-block-slider-track' );

			if ( ! track ) {
				return;
			}

			const slides = track.querySelectorAll( '.wp-block-slide' );
			if ( slides.length === 0 ) {
				return;
			}

			const slideWidth = slides[ 0 ].offsetWidth;
			track.scrollBy( { left: -slideWidth, behavior: 'smooth' } );
		},
		handleScroll: debounce( function () {
			const { ref } = getElement();

			const slides = ref.querySelectorAll( '.wp-block-slide' );
			if ( slides.length === 0 ) {
				return;
			}

			const slideWidth = slides[ 0 ].offsetWidth;
			const scrollLeft = ref.scrollLeft;
			const currentIndex = Math.round( scrollLeft / slideWidth );

			const context = getContext();
			context.currentIndex = currentIndex;
			context.totalSlides = slides.length;
		}, 150 ),
	},
	callbacks: {
		initTrack() {
			const context = getContext();
			const { ref } = getElement();

			const slides = ref.querySelectorAll( '.wp-block-slide' );

			// Initialize state
			context.currentIndex = 0;
			context.totalSlides = slides.length;

			// Add keyboard navigation
			ref.setAttribute( 'tabindex', '0' );
			ref.setAttribute( 'role', 'region' );
			ref.setAttribute( 'aria-roledescription', 'carousel' );
			ref.setAttribute(
				'aria-label',
				`Slide ${ context.currentIndex + 1 } of ${
					context.totalSlides
				}`
			);

			// Handle keyboard events
			ref.addEventListener( 'keydown', ( event ) => {
				if ( event.key === 'ArrowLeft' ) {
					event.preventDefault();
					const slider = ref.closest( '.wp-block-slider' );
					const prevButton = slider?.querySelector(
						'.wp-block-slider-controls__previous'
					);
					if ( prevButton && ! prevButton.disabled ) {
						prevButton.click();
					}
				} else if ( event.key === 'ArrowRight' ) {
					event.preventDefault();
					const slider = ref.closest( '.wp-block-slider' );
					const nextButton = slider?.querySelector(
						'.wp-block-slider-controls__next'
					);
					if ( nextButton && ! nextButton.disabled ) {
						nextButton.click();
					}
				}
			} );
		},
		updateTrack() {
			const context = getContext();
			const { ref } = getElement();

			// Update ARIA label
			ref.setAttribute(
				'aria-label',
				`Slide ${ context.currentIndex + 1 } of ${
					context.totalSlides
				}`
			);
		},
	},
} );
