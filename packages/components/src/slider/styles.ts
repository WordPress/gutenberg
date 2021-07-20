/**
 * External dependencies
 */
import { css } from '@emotion/react';

/**
 * Internal dependencies
 */
import { CONFIG, COLORS } from '../utils';
import { space } from '../ui/utils/space';

export const Slider = css`
	appearance: none;
	background-color: transparent;
	border: 1px solid transparent;
	border-radius: ${ CONFIG.controlBorderRadius };
	cursor: pointer;
	display: block;
	height: ${ CONFIG.controlHeight };
	max-width: 100%;
	min-width: 0;
	padding: ${ space( 1 ) };
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
		background-color: ${ COLORS.admin.theme };
		border: 1px solid transparent;
		border-radius: 50%;
		box-shadow: ${ CONFIG.sliderThumbBoxShadow };
		cursor: pointer;
		height: 12px;
		margin-top: -5px;
		opacity: 1;
		width: 12px;
		transition: box-shadow ease ${ CONFIG.transitionDurationFast };

		*:disabled& {
			background: ${ CONFIG.colorTextMuted };
			border-color: ${ CONFIG.colorTextMuted };
		}
	}
	&::-moz-range-thumb {
		appearance: none;
		background-color: ${ COLORS.admin.theme };
		border: 1px solid transparent;
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
			background: ${ CONFIG.colorTextMuted };
			border-color: ${ CONFIG.colorTextMuted };
		}
	}

	&:focus {
		${ getFocusBoxShadow() }
	}
`;

export const focused = css`
	${ getFocusBoxShadow() }
`;

export const large = css`
	height: ${ CONFIG.controlHeightLarge };
`;

export const small = css`
	height: ${ CONFIG.controlHeightSmall };
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
		${ getFocusBoxShadow(
			CONFIG.controlDestructivePseudoBoxShadowFocusSmall
		) };
	}
`;

export const focusedError = css`
	${ getFocusBoxShadow(
		CONFIG.controlDestructivePseudoBoxShadowFocusSmall
	) };
`;

function getFocusBoxShadow( color = CONFIG.controlPseudoBoxShadowFocusSmall ) {
	return css`
		&::-webkit-slider-thumb {
			box-shadow: ${ color };
		}
		&::-moz-range-thumb {
			box-shadow: ${ color };
		}
	`;
}
