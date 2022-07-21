/**
 * External dependencies
 */
import { css } from '@emotion/react';
import type { CSSProperties } from 'react';

/**
 * Internal dependencies
 */
import { COLORS, CONFIG } from '../utils';
import { SliderColors } from './types';

const getBoxShadowStyle = ( color: CSSProperties[ 'color' ] ) => {
	return `
		0 0 0 ${ CONFIG.controlPseudoBoxShadowFocusWidth } ${ CONFIG.surfaceBackgroundColor },
		0 0 0 calc(${ CONFIG.controlPseudoBoxShadowFocusWidth } + 1px) ${ color }
	`;
};

const getFocusBoxShadow = ( color: CSSProperties[ 'color' ] ) => {
	const boxShadow = getBoxShadowStyle( color );
	return css`
		&::-webkit-slider-thumb {
			box-shadow: ${ boxShadow };
		}
		&::-moz-range-thumb {
			box-shadow: ${ boxShadow };
		}
	`;
};

const thumbStyles = ( thumbColor: CSSProperties[ 'color' ] ) => {
	return css`
		appearance: none;
		background-color: ${ thumbColor };
		border: 1px solid transparent;
		border-radius: 50%;
		box-shadow: none;
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

const trackStyles = ( { trackColor, trackBackgroundColor }: SliderColors ) => {
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

export const slider = ( colors: SliderColors ) => {
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
			${ thumbStyles( colors.thumbColor ) }

			*:disabled& {
				${ disabledThumbStyles }
			}
		}
		&::-moz-range-thumb {
			${ thumbStyles( colors.thumbColor ) }
			will-change: transform;

			*:disabled& {
				${ disabledThumbStyles }
			}
		}

		&:focus {
			${ getFocusBoxShadow( colors.thumbColor ) }
		}
	`;
};

export const focused = ( thumbColor: CSSProperties[ 'color' ] ) =>
	getFocusBoxShadow( thumbColor );

export const focusedError = ( errorColor: CSSProperties[ 'color' ] ) =>
	getFocusBoxShadow( errorColor );

export const error = ( { errorColor, trackBackgroundColor }: SliderColors ) => {
	return css`
		&::-webkit-slider-runnable-track {
			background: linear-gradient(
				to right,
				${ errorColor } calc( var( --slider--progress ) ),
				${ trackBackgroundColor } calc( var( --slider--progress ) )
			);
		}
		&::-moz-range-track {
			background: linear-gradient(
				to right,
				${ errorColor } calc( var( --slider--progress ) ),
				${ trackBackgroundColor } calc( var( --slider--progress ) )
			);
		}

		&::-webkit-slider-thumb {
			background-color: ${ errorColor };
			border: 1px solid ${ errorColor };
		}
		&::-moz-range-thumb {
			background-color: ${ errorColor };
			border: 1px solid ${ errorColor };
		}

		&:focus {
			${ getFocusBoxShadow( errorColor ) };
		}
	`;
};

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
