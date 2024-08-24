/**
 * External dependencies
 */
import { css, keyframes } from '@emotion/react';

export const navigatorProviderWrapper = css`
	position: relative;
	/* Prevents horizontal overflow while animating screen transitions */
	overflow-x: hidden;
	/* Mark this subsection of the DOM as isolated, providing performance benefits
	 * by limiting calculations of layout, style and paint to a DOM subtree rather
	 * than the entire page.
	 */
	contain: content;
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
	skipInitialAnimation: boolean;
	direction: 'forwards' | 'backwards';
	isAnimatingOut: boolean;
};

const ANIMATION = {
	forwards: {
		in: css`70ms cubic-bezier(0, 0, 0.2, 1) 70ms both ${ fadeIn }, 300ms cubic-bezier(0.4, 0, 0.2, 1) both ${ slideFromRight }`,
		out: css`70ms cubic-bezier(0.4, 0, 1, 1) 40ms forwards ${ fadeOut }, 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards ${ slideToLeft }`,
	},
	backwards: {
		in: css`70ms cubic-bezier(0, 0, 0.2, 1) 70ms both ${ fadeIn }, 300ms cubic-bezier(0.4, 0, 0.2, 1) both ${ slideFromLeft }`,
		out: css`70ms cubic-bezier(0.4, 0, 1, 1) 40ms forwards ${ fadeOut }, 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards ${ slideToRight }`,
	},
};
const navigatorScreenAnimation = ( {
	direction,
	skipInitialAnimation,
	isAnimatingOut,
}: NavigatorScreenAnimationProps ) => {
	return css`
		position: ${ isAnimatingOut ? 'absolute' : 'relative' };
		z-index: ${ isAnimatingOut ? 0 : 1 };
		${ isAnimatingOut &&
		css`
			inset: 0;
		` }

		animation: ${ skipInitialAnimation
			? 'none'
			: ANIMATION[ direction ][ isAnimatingOut ? 'out' : 'in' ] };

		@media ( prefers-reduced-motion ) {
			animation: none;
		}
	`;
};

export const navigatorScreen = ( props: NavigatorScreenAnimationProps ) => css`
	/* Ensures horizontal overflow is visually accessible */
	overflow-x: auto;
	/* In case the root has a height, it should not be exceeded */
	max-height: 100%;

	${ navigatorScreenAnimation( props ) }
`;
