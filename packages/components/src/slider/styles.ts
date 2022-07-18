/**
 * External dependencies
 */
import { css } from '@emotion/react';

/**
 * Internal dependencies
 */
import { COLORS, CONFIG, flow } from '../utils';
import { space } from '../ui/utils/space';

const boxShadow = flow(
	[
		'0 0 0',
		CONFIG.controlPseudoBoxShadowFocusWidth,
		CONFIG.surfaceBackgroundColor,
	],
	[
		'0 0 0',
		`calc(${ CONFIG.controlPseudoBoxShadowFocusWidth } + 1px)`,
		COLORS.admin.theme,
	]
);
const errorBoxShadow = flow(
	[
		'0 0 0',
		CONFIG.controlPseudoBoxShadowFocusWidth,
		CONFIG.surfaceBackgroundColor,
	],
	[
		'0 0 0',
		`calc(${ CONFIG.controlPseudoBoxShadowFocusWidth } + 1px)`,
		COLORS.alert.red,
	]
);

function getFocusBoxShadow( color = boxShadow ) {
	return css`
		&::-webkit-slider-thumb {
			box-shadow: ${ color };
		}
		&::-moz-range-thumb {
			box-shadow: ${ color };
		}
	`;
}

export const focusedError = css`
	${ getFocusBoxShadow( errorBoxShadow ) };
`;

export const slider = css`
	appearance: none;
	background-color: transparent;
	border: 0;
	border-radius: ${ CONFIG.controlBorderRadius };
	cursor: pointer;
	display: block;
	height: ${ CONFIG.controlHeight };
	max-width: 100%;
	min-width: 0;
	padding: 0;
	margin: 0;
	width: 100%;

	&:focus {
		outline: none;
	}

	&::-moz-focus-outer {
		border: 0;
	}

	&::-webkit-slider-runnable-track {
		background: linear-gradient(
			to right,
			${ COLORS.admin.theme } calc( var( --progress ) ),
			${ CONFIG.controlBackgroundDimColor } calc( var( --progress ) )
		);
		border-radius: 2px;
		height: 2px;

		*:disabled& {
			background: ${ CONFIG.controlBackgroundDimColor };
		}
	}
	&::-moz-range-track {
		background: linear-gradient(
			to right,
			${ COLORS.admin.theme } calc( var( --progress ) ),
			${ CONFIG.controlBackgroundDimColor } calc( var( --progress ) )
		);
		border-radius: 2px;
		height: 2px;
		will-change: transform;

		*:disabled& {
			background: ${ CONFIG.controlBackgroundDimColor };
		}
	}

	&::-webkit-slider-thumb {
		appearance: none;
		background-color: ${ CONFIG.sliderThumbBackgroundColor };
		border: 1px solid ${ CONFIG.sliderThumbBorderColor };
		border-radius: 50%;
		box-shadow: ${ CONFIG.sliderThumbBoxShadow };
		cursor: pointer;
		height: 12px;
		margin-top: -5px;
		opacity: 1;
		width: 12px;
		transition: box-shadow ease ${ CONFIG.transitionDurationFast };

		*:disabled& {
			background: ${ COLORS.ui.textDisabled };
			border-color: ${ COLORS.ui.textDisabled };
		}
	}
	&::-moz-range-thumb {
		appearance: none;
		background-color: ${ CONFIG.sliderThumbBackgroundColor };
		border: 1px solid ${ CONFIG.sliderThumbBorderColor };
		border-radius: 50%;
		box-shadow: ${ CONFIG.sliderThumbBoxShadow };
		cursor: pointer;
		height: 12px;
		margin-top: -5px;
		opacity: 1;
		width: 12px;
		transition: box-shadow ease ${ CONFIG.transitionDurationFast };
		will-change: transform;

		*:disabled& {
			background: ${ COLORS.ui.textDisabled };
			border-color: ${ COLORS.ui.textDisabled };
		}
	}

	&:focus {
		${ getFocusBoxShadow() }
	}
`;

export const focused = css`
	${ getFocusBoxShadow() }
`;

export const error = css`
	&::-webkit-slider-runnable-track {
		background: linear-gradient(
			to right,
			${ CONFIG.controlDestructiveBorderColor } calc( var( --progress ) ),
			${ CONFIG.controlBackgroundDimColor } calc( var( --progress ) )
		);
	}
	&::-moz-range-track {
		background: linear-gradient(
			to right,
			${ CONFIG.controlDestructiveBorderColor } calc( var( --progress ) ),
			${ CONFIG.controlBackgroundDimColor } calc( var( --progress ) )
		);
	}

	&::-webkit-slider-thumb {
		background-color: ${ CONFIG.controlDestructiveBorderColor };
		border: 1px solid ${ CONFIG.controlDestructiveBorderColor };
	}
	&::-moz-range-thumb {
		background-color: ${ CONFIG.controlDestructiveBorderColor };
		border: 1px solid ${ CONFIG.controlDestructiveBorderColor };
	}

	&:focus {
		${ getFocusBoxShadow( errorBoxShadow ) };
	}
`;

export const large = css`
	/*
	 * Uses hardcoded 40px height to match design goal instead of
	 * CONFIG.controlHeightLarge which is only 36px.
	 */
	height: 40px;
`;

export const small = css`
	height: ${ CONFIG.controlHeightSmall };
`;
