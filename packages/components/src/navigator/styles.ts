/**
 * External dependencies
 */
import { css, keyframes } from '@emotion/react';

export const navigatorProviderWrapper = css`
	position: relative;
	/* Prevents horizontal overflow while animating screen transitions */
	overflow-x: clip;
	/*
	 * Mark this DOM subtree as isolated when it comes to layout calculations,
	 * providing performance benefits.
	 */
	contain: layout;
`;

const fadeIn = keyframes( {
	from: {
		opacity: 0,
	},
} );

const fadeOut = keyframes( {
	to: {
		opacity: 0,
	},
} );

export const slideFromRight = keyframes( {
	from: {
		transform: 'translateX(100px)',
	},
} );

export const slideToLeft = keyframes( {
	to: {
		transform: 'translateX(-80px)',
	},
} );

export const slideFromLeft = keyframes( {
	from: {
		transform: 'translateX(-100px)',
	},
} );

export const slideToRight = keyframes( {
	to: {
		transform: 'translateX(80px)',
	},
} );

type NavigatorScreenAnimationProps = {
	skipAnimation: boolean;
	animationDirection: 'forwards' | 'backwards';
	isAnimatingOut: boolean;
	isAnimatingIn: boolean;
};

const FADE = {
	DURATION: 70,
	EASING: 'linear',
	DELAY: {
		IN: 70,
		OUT: 40,
	},
};
const SLIDE = {
	DURATION: 300,
	EASING: 'cubic-bezier(0.33, 0, 0, 1)',
};

export const TOTAL_ANIMATION_DURATION = {
	IN: Math.max( FADE.DURATION + FADE.DELAY.IN, SLIDE.DURATION ),
	OUT: Math.max( FADE.DURATION + FADE.DELAY.OUT, SLIDE.DURATION ),
};

export const ANIMATION_END_NAMES = {
	forwards: {
		in: slideFromRight.name,
		out: slideToLeft.name,
	},
	backwards: {
		in: slideFromLeft.name,
		out: slideToRight.name,
	},
};

const ANIMATION = {
	forwards: {
		in: css`
			${ FADE.DURATION }ms ${ FADE.EASING } ${ FADE.DELAY
				.IN }ms both ${ fadeIn }, ${ SLIDE.DURATION }ms ${ SLIDE.EASING } both ${ slideFromRight }
		`,
		out: css`
			${ FADE.DURATION }ms ${ FADE.EASING } ${ FADE.DELAY
				.IN }ms both ${ fadeOut }, ${ SLIDE.DURATION }ms ${ SLIDE.EASING } both ${ slideToLeft }
		`,
	},
	backwards: {
		in: css`
			${ FADE.DURATION }ms ${ FADE.EASING } ${ FADE.DELAY
				.IN }ms both ${ fadeIn }, ${ SLIDE.DURATION }ms ${ SLIDE.EASING } both ${ slideFromLeft }
		`,
		out: css`
			${ FADE.DURATION }ms ${ FADE.EASING } ${ FADE.DELAY
				.OUT }ms both ${ fadeOut }, ${ SLIDE.DURATION }ms ${ SLIDE.EASING } both ${ slideToRight }
		`,
	},
};
export const navigatorScreenAnimation = ( {
	animationDirection,
	skipAnimation,
	isAnimatingOut,
	isAnimatingIn,
}: NavigatorScreenAnimationProps ) => {
	return css`
		position: ${ isAnimatingOut ? 'absolute' : 'relative' };
		z-index: ${ isAnimatingOut ? 0 : 1 };
		inset-block-start: ${ isAnimatingOut ? 0 : 'initial' };
		inset-inline-start: ${ isAnimatingOut ? 0 : 'initial' };
		inset-inline-end: ${ isAnimatingOut ? 0 : 'initial' };

		animation: ${ skipAnimation || ( ! isAnimatingOut && ! isAnimatingIn )
			? 'none'
			: ANIMATION[ animationDirection ][
					isAnimatingOut ? 'out' : 'in'
			  ] };

		@media ( prefers-reduced-motion ) {
			animation: none;
		}
	`;
};

export const navigatorScreen = css`
	/* Ensures horizontal overflow is visually accessible */
	overflow-x: auto;
	/* In case the root has a height, it should not be exceeded */
	max-height: 100%;
	box-sizing: border-box;
`;
