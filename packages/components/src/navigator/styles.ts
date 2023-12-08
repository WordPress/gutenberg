/**
 * External dependencies
 */
import { css, keyframes } from '@emotion/react';

export const navigatorProviderWrapper = css`
	/* Prevents horizontal overflow while animating screen transitions */
	overflow-x: hidden;

	contain: strict;
`;

const fadeInFromRight = keyframes( {
	'0%': {
		opacity: 0,
		transform: `translateX(50px)`,
	},
	'100%': { opacity: 1, transform: 'none' },
} );

const fadeInFromLeft = keyframes( {
	'0%': {
		opacity: 0,
		transform: `translateX(-50px)`,
	},
	'100%': { opacity: 1, transform: 'none' },
} );

type NavigatorScreenAnimationProps = {
	isInitial?: boolean;
	isBack?: boolean;
	isRTL: boolean;
};

const navigatorScreenAnimation = ( {
	isInitial,
	isBack,
	isRTL,
}: NavigatorScreenAnimationProps ) => {
	if ( isInitial && ! isBack ) {
		return css``;
	}

	const animationName =
		( isRTL && isBack ) || ( ! isRTL && ! isBack )
			? fadeInFromRight
			: fadeInFromLeft;

	return css`
		animation-duration: 0.14s;
		/* easeInOutCubic */
		animation-timing-function: cubic-bezier( 0.65, 0, 0.35, 1 );
		will-change: transform, opacity;
		/* Default animation.*/
		animation-name: ${ animationName };

		@media ( prefers-reduced-motion ) {
			animation-duration: 0s;
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
