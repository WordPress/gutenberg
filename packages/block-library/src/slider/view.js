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

			// Debug logging
			// eslint-disable-next-line no-console
			console.log( 'nextSlide called, ref:', ref );

			// Find the track element (go up to slider, then find track)
			const slider = ref.closest( '.wp-block-slider' );
			const track = slider?.querySelector( '.wp-block-slider-track' );

			// eslint-disable-next-line no-console
			console.log( 'slider:', slider, 'track:', track );

			if ( ! track ) {
				// eslint-disable-next-line no-console
				console.warn( 'Track not found!' );
				return;
			}

			const slides = track.querySelectorAll( '.wp-block-slide' );
			if ( slides.length === 0 ) {
				// eslint-disable-next-line no-console
				console.warn( 'No slides found!' );
				return;
			}

			const slideWidth = slides[ 0 ].offsetWidth;

			// Debug scroll dimensions
			// eslint-disable-next-line no-console
			console.log( 'Track dimensions:', {
				scrollWidth: track.scrollWidth,
				clientWidth: track.clientWidth,
				scrollLeft: track.scrollLeft,
				canScroll: track.scrollWidth > track.clientWidth,
				slideWidth,
				slideCount: slides.length,
			} );

			// eslint-disable-next-line no-console
			console.log(
				'Scrolling by',
				slideWidth,
				'current scrollLeft:',
				track.scrollLeft
			);
			track.scrollBy( { left: slideWidth, behavior: 'smooth' } );
		},
		prevSlide() {
			const { ref } = getElement();

			// Debug logging
			// eslint-disable-next-line no-console
			console.log( 'prevSlide called, ref:', ref );

			// Find the track element
			const slider = ref.closest( '.wp-block-slider' );
			const track = slider?.querySelector( '.wp-block-slider-track' );

			if ( ! track ) {
				// eslint-disable-next-line no-console
				console.warn( 'Track not found!' );
				return;
			}

			const slides = track.querySelectorAll( '.wp-block-slide' );
			if ( slides.length === 0 ) {
				// eslint-disable-next-line no-console
				console.warn( 'No slides found!' );
				return;
			}

			const slideWidth = slides[ 0 ].offsetWidth;
			// eslint-disable-next-line no-console
			console.log(
				'Scrolling by',
				-slideWidth,
				'current scrollLeft:',
				track.scrollLeft
			);
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

			// Context is already initialized from PHP with currentIndex and totalSlides
			// Just set up accessibility and keyboard navigation

			// Add ARIA attributes
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
