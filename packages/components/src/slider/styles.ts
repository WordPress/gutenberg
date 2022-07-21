/**
 * External dependencies
 */
import { css } from '@emotion/react';
import type { CSSProperties } from 'react';

/**
 * Internal dependencies
 */
import { COLORS, CONFIG } from '../utils';
import { flow } from '../utils/flow';
import { SliderColors } from './types';

const getBoxShadowStyle = (
	color: CSSProperties[ 'color' ] = COLORS.admin.theme
) => {
	return flow(
		[
			'0 0 0',
			CONFIG.controlPseudoBoxShadowFocusWidth,
			CONFIG.surfaceBackgroundColor,
		],
		[
			'0 0 0',
			`calc(${ CONFIG.controlPseudoBoxShadowFocusWidth } + 1px)`,
			color,
		]
	);
};

const getFocusBoxShadow = ( color: CSSProperties[ 'boxShadow' ] ) => {
	return css`
		&::-webkit-slider-thumb {
			box-shadow: ${ color };
		}
		&::-moz-range-thumb {
			box-shadow: ${ color };
		}
	`;
};

export const focusedError = css`
	${ getFocusBoxShadow( getBoxShadowStyle( COLORS.alert.red ) ) };
`;

const thumbStyles = ( colors: SliderColors ) => {
	const { thumbColor = CONFIG.sliderThumbBackgroundColor } = colors;
	return css`
		appearance: none;
		background-color: ${ thumbColor };
		border: 1px solid ${ CONFIG.sliderThumbBorderColor };
		border-radius: 50%;
		box-shadow: ${ CONFIG.sliderThumbBoxShadow };
		cursor: pointer;
		height: 12px;
		margin-top: -5px;
		opacity: 1;
		width: 12px;
		transition: box-shadow ease ${ CONFIG.transitionDurationFast };
	`;
};

const disabledThumbStyles = css`
	background: ${ COLORS.ui.textDisabled };
	border-color: ${ COLORS.ui.textDisabled };
`;

const trackStyles = ( colors: SliderColors ) => {
	const {
		thumbColor = COLORS.admin.theme,
		trackColor = COLORS.admin.theme,
		trackBackgroundColor = CONFIG.controlBackgroundDimColor,
	} = colors;

	return css`
		background: linear-gradient(
			to right,
			${ trackColor } calc( var( --slider--progress ) ),
			${ trackBackgroundColor } calc( var( --slider--progress ) )
		);
		border-radius: 2px;
		height: 2px;
	`;
};

export const slider = ( colors ) => {
	return css`
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
			${ trackStyles( colors ) }

			*:disabled& {
				background: ${ CONFIG.controlBackgroundDimColor };
			}
		}
		&::-moz-range-track {
			${ trackStyles( colors ) }
			will-change: transform;

			*:disabled& {
				background: ${ CONFIG.controlBackgroundDimColor };
			}
		}

		/* Vendor prefixes don't work correctly when comma separated. */
		&::-webkit-slider-thumb {
			${ thumbStyles( colors ) }

			*:disabled& {
				${ disabledThumbStyles }
			}
		}
		&::-moz-range-thumb {
			${ thumbStyles( colors ) }
			will-change: transform;

			*:disabled& {
				${ disabledThumbStyles }
			}
		}

		&:focus {
			${ getFocusBoxShadow( getBoxShadowStyle( colors?.thumbColor ) ) }
		}
	`;
};

export const focused = ( colors: SliderColors ) => {
	return css`
		${ getFocusBoxShadow( getBoxShadowStyle( colors?.thumbColor ) ) }
	`;
};

export const error = css`
	&::-webkit-slider-runnable-track {
		background: linear-gradient(
			to right,
			${ CONFIG.controlDestructiveBorderColor }
				calc( var( --slider--progress ) ),
			${ CONFIG.controlBackgroundDimColor }
				calc( var( --slider--progress ) )
		);
	}
	&::-moz-range-track {
		background: linear-gradient(
			to right,
			${ CONFIG.controlDestructiveBorderColor }
				calc( var( --slider--progress ) ),
			${ CONFIG.controlBackgroundDimColor }
				calc( var( --slider--progress ) )
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
		${ getFocusBoxShadow( getBoxShadowStyle( COLORS.alert.red ) ) };
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
