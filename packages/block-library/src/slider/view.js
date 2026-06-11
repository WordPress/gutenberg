/**
 * WordPress dependencies
 */
import {
	store,
	getContext,
	getElement,
	withSyncEvent,
} from '@wordpress/interactivity';

const SLIDER_SELECTOR = '.wp-block-slider';
const VIEWPORT_SELECTOR = '.wp-block-slider__viewport';
const SLIDE_SELECTOR = '.wp-block-slider__track > .wp-block-slide';

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
	const slides = slider
		? Array.from( slider.querySelectorAll( SLIDE_SELECTOR ) )
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

function getTargetScrollLeft( viewport, slides, index ) {
	const slide = slides[ index ];

	if ( ! viewport || ! slide ) {
		return 0;
	}

	if ( index <= 0 ) {
		return 0;
	}

	const maxScrollLeft = Math.max(
		0,
		viewport.scrollWidth - viewport.clientWidth
	);

	if ( index >= slides.length - 1 ) {
		return maxScrollLeft;
	}

	const viewportRect = viewport.getBoundingClientRect();
	const slideRect = slide.getBoundingClientRect();
	const slideStart = slideRect.left - viewportRect.left + viewport.scrollLeft;
	const centerOffset = Math.max(
		0,
		( viewportRect.width - slideRect.width ) / 2
	);

	return Math.max( 0, Math.min( slideStart - centerOffset, maxScrollLeft ) );
}

function scrollToSlide( viewport, slides, index, behavior = 'auto' ) {
	viewport?.scrollTo( {
		left: getTargetScrollLeft( viewport, slides, index ),
		behavior,
	} );
}

function refreshSlider() {
	const context = getContext();
	const { ref } = getElement();
	const { viewport, slides } = getSliderParts( ref );
	const slideCount = slides.length || context.slideCount || 0;
	const nextIndex = clampSlideIndex( context.activeSlideIndex, slideCount );

	context.slideCount = slideCount;
	context.activeSlideIndex = nextIndex;

	scrollToSlide( viewport, slides, nextIndex );
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
				const { viewport, slides } = getSliderParts( ref );
				const slideCount = slides.length || context.slideCount || 0;
				const nextIndex = clampSlideIndex( index, slideCount );

				context.activeSlideIndex = nextIndex;
				context.slideCount = slideCount;

				scrollToSlide( viewport, slides, nextIndex, 'smooth' );
			},
			handleScroll: withSyncEvent( ( event ) => {
				const context = getContext();
				const viewport = event.currentTarget;
				const { slides } = getSliderParts( viewport );
				const nextIndex = getClosestSlideIndex( viewport, slides );

				if ( nextIndex !== context.activeSlideIndex ) {
					context.activeSlideIndex = nextIndex;
				}

				context.slideCount = slides.length;
			} ),
		},
		callbacks: {
			init: refreshSlider,
			refresh: refreshSlider,
		},
	},
	{ lock: true }
);
