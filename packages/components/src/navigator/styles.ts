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

const slideFromRight = keyframes( {
	from: {
		transform: 'translateX(100px)',
	},
} );

export const slideToLeft = keyframes( {
	to: {
		transform: 'translateX(-80px)',
	},
} );

const slideFromLeft = keyframes( {
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

export const TOTAL_ANIMATION_DURATION_OUT = Math.max(
	FADE.DURATION + FADE.DELAY.OUT,
	SLIDE.DURATION
);

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
}: NavigatorScreenAnimationProps ) => {
	return css`
		position: ${ isAnimatingOut ? 'absolute' : 'relative' };
		z-index: ${ isAnimatingOut ? 0 : 1 };
		${ isAnimatingOut &&
		css`
			inset: 0;
		` }

		animation: ${ skipAnimation
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
`;
