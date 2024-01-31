/**
 * External dependencies
 */
import { css, keyframes } from '@emotion/react';

export const navigatorProviderWrapper = css`
	/* Prevents horizontal overflow while animating screen transitions */
	overflow-x: hidden;
	/* Mark this subsection of the DOM as isolated, providing performance benefits
	 * by limiting calculations of layout, style and paint to a DOM subtree rather
	 * than the entire page.
	 */
	contain: content;
`;

const fadeInFromRight = keyframes( {
	'0%': {
		opacity: 0,
		transform: `translateX( 50px )`,
	},
	'100%': { opacity: 1, transform: 'none' },
} );

const fadeInFromLeft = keyframes( {
	'0%': {
		opacity: 0,
		transform: `translateX( -50px )`,
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
		return;
	}

	const animationName =
		( isRTL && isBack ) || ( ! isRTL && ! isBack )
			? fadeInFromRight
			: fadeInFromLeft;

	return css`
		animation-duration: 0.14s;
		animation-timing-function: ease-in-out;
		will-change: transform, opacity;
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
