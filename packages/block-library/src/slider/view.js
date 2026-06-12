/**
 * WordPress dependencies
 */
import { store, getContext, getElement } from '@wordpress/interactivity';

const SLIDER_SELECTOR = '.wp-block-slider';
const VIEWPORT_SELECTOR = '.wp-block-slider__viewport';

function clampSlideIndex( index, slideCount ) {
	return Math.max( 0, Math.min( index, Math.max( slideCount - 1, 0 ) ) );
}

function getSliderRoot( ref ) {
	return ref?.classList?.contains( 'wp-block-slider' )
		? ref
		: ref?.closest( SLIDER_SELECTOR );
}

function getSliderParts( ref ) {
	const slider = getSliderRoot( ref );
	const viewport = slider?.querySelector( VIEWPORT_SELECTOR );
	const track = Array.from( viewport?.children ?? [] ).find( ( element ) =>
		element.classList.contains( 'wp-block-slider__track' )
	);
	const slides = track
		? Array.from( track.children ).filter( ( element ) =>
				element.classList.contains( 'wp-block-slide' )
		  )
		: [];

	return { slider, viewport, slides };
}

function getClosestSlideIndex( viewport, slides ) {
	if ( ! viewport || slides.length === 0 ) {
		return 0;
	}

	const viewportRect = viewport.getBoundingClientRect();
	const viewportCenter = viewportRect.left + viewportRect.width / 2;
	let closestIndex = 0;
	let closestDistance = Infinity;

	slides.forEach( ( slide, index ) => {
		const slideRect = slide.getBoundingClientRect();
		const slideCenter = slideRect.left + slideRect.width / 2;
		const distance = Math.abs( viewportCenter - slideCenter );

		if ( distance < closestDistance ) {
			closestDistance = distance;
			closestIndex = index;
		}
	} );

	return closestIndex;
}

function scrollToSlide( slides, index, behavior = 'auto' ) {
	const slide = slides[ index ];

	if ( slide ) {
		slide.scrollIntoView( {
			behavior,
			block: 'nearest',
			inline: 'start',
		} );
	}

	return !! slide;
}

function setActiveSlideIndex( context, nextIndex, slideCount ) {
	const activeSlideIndex = context.activeSlideIndex ?? 0;

	if ( nextIndex !== activeSlideIndex ) {
		const direction = nextIndex > activeSlideIndex ? 'next' : 'previous';

		context.dotAnimationDirection = direction;
		context.dotAnimationFrame = ! context.dotAnimationFrame;
		context.hasOutgoingPreviousDot =
			direction === 'next' && activeSlideIndex > 0;
		context.hasOutgoingNextDot =
			direction === 'previous' &&
			activeSlideIndex < Math.max( slideCount - 1, 0 );
	}

	context.activeSlideIndex = nextIndex;
}

function clearPendingScroll( context ) {
	context.pendingSlideIndex = undefined;
	context.pendingScrollUntil = undefined;
}

function refreshSlider() {
	const context = getContext();
	const { ref } = getElement();
	const { slides } = getSliderParts( ref );
	const slideCount = slides.length || context.slideCount || 0;
	const nextIndex = clampSlideIndex( context.activeSlideIndex, slideCount );

	context.slideCount = slideCount;
	context.activeSlideIndex = nextIndex;
	context.dotAnimationDirection = '';
	context.hasOutgoingPreviousDot = false;
	context.hasOutgoingNextDot = false;
	clearPendingScroll( context );

	scrollToSlide( slides, nextIndex );
}

const { actions } = store(
	'core/slider',
	{
		state: {
			get canGoPrevious() {
				const { activeSlideIndex } = getContext();
				return activeSlideIndex > 0;
			},
			get canGoNext() {
				const { activeSlideIndex, slideCount } = getContext();
				return activeSlideIndex < slideCount - 1;
			},
			get slideStatus() {
				const { activeSlideIndex, slideCount } = getContext();
				return `Slide ${ activeSlideIndex + 1 } of ${ slideCount }`;
			},
			get isDotAnimationNext() {
				const { dotAnimationDirection } = getContext();
				return dotAnimationDirection === 'next';
			},
			get isDotAnimationPrevious() {
				const { dotAnimationDirection } = getContext();
				return dotAnimationDirection === 'previous';
			},
			get isDotAnimationFrameA() {
				const { dotAnimationFrame } = getContext();
				return !! dotAnimationFrame;
			},
			get isDotAnimationFrameB() {
				const { dotAnimationFrame } = getContext();
				return ! dotAnimationFrame;
			},
			get hasOutgoingPreviousDot() {
				const { hasOutgoingPreviousDot } = getContext();
				return !! hasOutgoingPreviousDot;
			},
			get hasOutgoingNextDot() {
				const { hasOutgoingNextDot } = getContext();
				return !! hasOutgoingNextDot;
			},
		},
		actions: {
			previous() {
				const context = getContext();
				actions.goTo( context.activeSlideIndex - 1 );
			},
			next() {
				const context = getContext();
				actions.goTo( context.activeSlideIndex + 1 );
			},
			goTo( index ) {
				const context = getContext();
				const { ref } = getElement();
				const { slides } = getSliderParts( ref );
				const slideCount = slides.length || context.slideCount || 0;
				const nextIndex = clampSlideIndex( index, slideCount );

				setActiveSlideIndex( context, nextIndex, slideCount );
				context.slideCount = slideCount;
				context.pendingSlideIndex = nextIndex;
				context.pendingScrollUntil = Date.now() + 600;
				scrollToSlide( slides, nextIndex, 'smooth' );
			},
			handleScroll() {
				const context = getContext();
				const { ref: viewport } = getElement();
				const { slides } = getSliderParts( viewport );
				const nextIndex = getClosestSlideIndex( viewport, slides );

				if ( context.pendingSlideIndex !== undefined ) {
					const isPendingScrollExpired =
						Date.now() > ( context.pendingScrollUntil ?? 0 );

					if ( nextIndex === context.pendingSlideIndex ) {
						clearPendingScroll( context );
					} else if ( ! isPendingScrollExpired ) {
						context.slideCount = slides.length;
						return;
					}
				}

				if ( nextIndex !== context.activeSlideIndex ) {
					setActiveSlideIndex( context, nextIndex, slides.length );
				}

				context.slideCount = slides.length;
			},
		},
		callbacks: {
			init: refreshSlider,
			refresh: refreshSlider,
		},
	},
	{ lock: true }
);
