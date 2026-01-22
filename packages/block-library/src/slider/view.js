/**
 * WordPress dependencies
 */
import { store, getContext, getElement } from '@wordpress/interactivity';

// Debounce utility for scroll handling
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

// Create debounced update function outside the store
// to avoid context issues with getElement()
const debouncedUpdates = new Map();

function getDebouncedUpdate( trackElement ) {
	if ( ! debouncedUpdates.has( trackElement ) ) {
		debouncedUpdates.set(
			trackElement,
			debounce( ( ref, context ) => {
				const slides = ref.querySelectorAll( '.wp-block-slide' );
				if ( slides.length === 0 ) {
					return;
				}

				const slideWidth = slides[ 0 ].offsetWidth;
				const scrollLeft = ref.scrollLeft;
				const currentIndex = Math.round( scrollLeft / slideWidth );

				context.currentIndex = currentIndex;
				context.totalSlides = slides.length;
			}, 150 )
		);
	}
	return debouncedUpdates.get( trackElement );
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

			// Find the track element - support both dedicated slider and query loop slider
			const container =
				ref.closest( '.wp-block-slider' ) ||
				ref.closest( '.wp-block-query' );
			const track =
				container?.querySelector( '.wp-block-slider-track' ) ||
				container?.querySelector( '.is-slider-track' );

			if ( ! track ) {
				return;
			}

			const slides = track.querySelectorAll( '.wp-block-slide' );
			if ( slides.length === 0 ) {
				return;
			}

			const context = getContext();

			// Update state immediately (don't wait for scroll event)
			const nextIndex = Math.min(
				context.currentIndex + 1,
				context.totalSlides - 1
			);
			context.currentIndex = nextIndex;

			const slideWidth = slides[ 0 ].offsetWidth;
			track.scrollBy( { left: slideWidth, behavior: 'smooth' } );
		},
		prevSlide() {
			const { ref } = getElement();

			// Find the track element - support both dedicated slider and query loop slider
			const container =
				ref.closest( '.wp-block-slider' ) ||
				ref.closest( '.wp-block-query' );
			const track =
				container?.querySelector( '.wp-block-slider-track' ) ||
				container?.querySelector( '.is-slider-track' );

			if ( ! track ) {
				return;
			}

			const slides = track.querySelectorAll( '.wp-block-slide' );
			if ( slides.length === 0 ) {
				return;
			}

			const context = getContext();

			// Update state immediately (don't wait for scroll event)
			const prevIndex = Math.max( context.currentIndex - 1, 0 );
			context.currentIndex = prevIndex;

			const slideWidth = slides[ 0 ].offsetWidth;
			track.scrollBy( { left: -slideWidth, behavior: 'smooth' } );
		},
		handleScroll() {
			// Get ref and context in the action scope (before debounce)
			const { ref } = getElement();
			const context = getContext();

			// Get the debounced update function for this track
			const updateScroll = getDebouncedUpdate( ref );
			updateScroll( ref, context );
		},
	},
	callbacks: {
		initTrack() {
			const context = getContext();
			const { ref } = getElement();

			// Update totalSlides from actual DOM (in case it differs from PHP count)
			const slides = ref.querySelectorAll( '.wp-block-slide' );
			context.totalSlides = slides.length;

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
				// Support both dedicated slider and query loop slider
				const container =
					ref.closest( '.wp-block-slider' ) ||
					ref.closest( '.wp-block-query' );

				if ( event.key === 'ArrowLeft' ) {
					event.preventDefault();
					const prevButton = container?.querySelector(
						'.wp-block-slider-controls__previous .wp-block-button__link'
					);
					if ( prevButton && ! prevButton.disabled ) {
						prevButton.click();
					}
				} else if ( event.key === 'ArrowRight' ) {
					event.preventDefault();
					const nextButton = container?.querySelector(
						'.wp-block-slider-controls__next .wp-block-button__link'
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
