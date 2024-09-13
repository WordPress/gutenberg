/**
 * External dependencies
 */
import { css } from '@emotion/react';

export const navigatorProviderWrapper = css`
	position: relative;
	/* Prevents horizontal overflow while animating screen transitions */
	overflow-x: clip;
	/*
	 * Mark this DOM subtree as isolated when it comes to layout calculations,
	 * providing performance benefits.
	 */
	contain: layout;

	display: grid;
	grid-template-columns: 1fr;
	grid-template-rows: 1fr;
	align-items: start;
`;

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
	AMOUNT: {
		IN: 100,
		OUT: 80,
	},
};

export const TOTAL_ANIMATION_DURATION = {
	IN: Math.max( FADE.DURATION + FADE.DELAY.IN, SLIDE.DURATION ),
	OUT: Math.max( FADE.DURATION + FADE.DELAY.OUT, SLIDE.DURATION ),
};

export const navigatorScreenAnimation = css`
	@media not ( prefers-reduced-motion ) {
		/* Initial transition values for the enter animation */
		opacity: 0;
		z-index: 0;
		&[data-animation-direction='to-left'] {
			transform: translateX( ${ SLIDE.AMOUNT.IN }px );
		}
		&[data-animation-direction='to-right'] {
			transform: translateX( -${ SLIDE.AMOUNT.IN }px );
		}

		/* Visible (ie. end of the enter animation, start of the exit animation) */
		&[data-animation-in] {
			z-index: 1;
			opacity: 1;
			transform: none;

			&:not( [data-animation-skip] ) {
				will-change: opacity, transform;
				transition:
					opacity ${ FADE.DURATION }ms ${ FADE.EASING }
						${ FADE.DELAY.IN }ms,
					transform ${ SLIDE.DURATION }ms ${ SLIDE.EASING };
			}
		}

		/* Out (ie. the end of the exit animation) */
		&[data-animation-in][data-animation-out] {
			z-index: 0;
			opacity: 0;

			&[data-animation-direction='to-left'] {
				transform: translateX( -${ SLIDE.AMOUNT.OUT }px );
			}
			&[data-animation-direction='to-right'] {
				transform: translateX( ${ SLIDE.AMOUNT.OUT }px );
			}

			&:not( [data-animation-skip] ) {
				transition:
					opacity ${ FADE.DURATION }ms ${ FADE.EASING }
						${ FADE.DELAY.OUT }ms,
					transform ${ SLIDE.DURATION }ms ${ SLIDE.EASING };
			}
		}
	}
`;

export const navigatorScreen = css`
	/* Ensures horizontal overflow is visually accessible */
	overflow-x: auto;
	/* In case the root has a height, it should not be exceeded */
	max-height: 100%;
	box-sizing: border-box;

	position: relative;

	grid-column: 1 / -1;
	grid-row: 1 / -1;
`;
