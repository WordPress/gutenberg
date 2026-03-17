/**
 * External dependencies
 */
import { css, keyframes } from '@emotion/react';

export const navigatorWrapper = css`
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
	end: {
		in: slideFromRight.name,
		out: slideToLeft.name,
	},
	start: {
		in: slideFromLeft.name,
		out: slideToRight.name,
	},
};

const ANIMATION = {
	end: {
		in: css`
			${ FADE.DURATION }ms ${ FADE.EASING } ${ FADE.DELAY
				.IN }ms both ${ fadeIn }, ${ SLIDE.DURATION }ms ${ SLIDE.EASING } both ${ slideFromRight }
		`,
		out: css`
			${ FADE.DURATION }ms ${ FADE.EASING } ${ FADE.DELAY
				.OUT }ms both ${ fadeOut }, ${ SLIDE.DURATION }ms ${ SLIDE.EASING } both ${ slideToLeft }
		`,
	},
	start: {
		in: css`
			${ FADE.DURATION }ms ${ FADE.EASING } ${ FADE.DELAY
				.IN }ms both ${ fadeIn }, ${ SLIDE.DURATION }ms ${ SLIDE.EASING } both ${ slideFromLeft }
		`,
		out: css`
			${ FADE.DURATION }ms ${ FADE.EASING } ${ FADE.DELAY
				.OUT }ms both ${ fadeOut }, ${ SLIDE.DURATION }ms ${ SLIDE.EASING } both ${ slideToRight }
		`,
	},
} as const;
export const navigatorScreenAnimation = css`
	z-index: 1;

	&[data-animation-type='out'] {
		z-index: 0;
	}

	@media not ( prefers-reduced-motion ) {
		&:not( [data-skip-animation] ) {
			${ ( [ 'start', 'end' ] as const ).map( ( direction ) =>
				( [ 'in', 'out' ] as const ).map(
					( type ) => css`
						&[data-animation-direction='${ direction }'][data-animation-type='${ type }'] {
							animation: ${ ANIMATION[ direction ][ type ] };
						}
					`
				)
			) }
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
