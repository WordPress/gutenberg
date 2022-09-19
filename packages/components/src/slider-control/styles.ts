/**
 * External dependencies
 */
import { css } from '@emotion/react';
import type { CSSProperties } from 'react';

/**
 * Internal dependencies
 */
import { COLORS, CONFIG, reduceMotion, rtl } from '../utils';

import type {
	MarkProps,
	SliderColors,
	SliderSizes,
	TooltipProps,
} from './types';

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
		border-radius: 50%;
		border: 1px solid transparent;
		box-shadow: none;
		cursor: pointer;
		height: 12px;
		margin-top: -5px;
		opacity: 1;
		position: absolute;
		transition: box-shadow ease ${ CONFIG.transitionDurationFast };
		width: 12px;
		${ rtl(
			{
				transform: 'translateX(-50%)',
				left: `var( --slider--progress )`,
			},
			{
				transform: 'translate(50%)',
				right: `var( --slider--progress )`,
			}
		)() }
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
			${ trackColor } var( --slider--progress ),
			${ trackBackgroundColor } var( --slider--progress )
		);
		border-radius: 2px;
		height: 2px;
	`;
};

const sliderSizes = {
	default: '36px',
	'__unstable-large': '40px',
};

export const slider = ( colors: SliderColors, size: SliderSizes ) => {
	return css`
		appearance: none;
		background-color: transparent;
		border: 0;
		border-radius: ${ CONFIG.controlBorderRadius };
		cursor: pointer;
		display: block;
		height: ${ sliderSizes[ size ] };
		max-width: 100%;
		min-width: 0;
		padding: 0;
		margin: 0;
		width: 100%;
		z-index: 1; /* Ensures marks are beneath the thumb */

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

export const sliderControl = css``;
export const sliderWrapper = css`
	position: relative;
`;

export const marks = css`
	box-sizing: border-box;
	display: block;
	pointer-events: none;
	position: absolute;
	width: 100%;
	user-select: none;
`;

const markFill = ( { disabled, isFilled }: MarkProps ) => {
	let backgroundColor = isFilled ? COLORS.ui.theme : COLORS.gray[ 300 ];

	if ( disabled ) {
		backgroundColor = COLORS.gray[ 400 ];
	}

	return css( { backgroundColor } );
};

export const mark = ( markProps: MarkProps ) => {
	return css`
		box-sizing: border-box;
		height: 12px;
		left: 0;
		position: absolute;
		top: -4px;
		width: 1px;
		${ markFill( markProps ) }
	`;
};

const markLabelFill = ( { isFilled }: MarkProps ) => {
	return css( {
		color: isFilled ? COLORS.gray[ 700 ] : COLORS.gray[ 300 ],
	} );
};

export const markLabel = ( markProps: MarkProps ) => {
	return css`
		box-sizing: border-box;
		color: ${ COLORS.gray[ 300 ] };
		left: 0;
		font-size: 11px;
		position: absolute;
		top: 12px;
		transform: translateX( -50% );
		white-space: nowrap;
		${ markLabelFill( markProps ) };
	`;
};

const tooltipPosition = ( props: TooltipProps ) => {
	const { position, fillPercentage } = props;

	if ( position === 'bottom' ) {
		return css`
			bottom: -60%;
			${ rtl(
				{
					transform: 'translateX(-50%)',
					left: `${ fillPercentage }%`,
				},
				{
					transform: 'translateX(50%)',
					right: `${ fillPercentage }%`,
				}
			)() }
		`;
	}

	return css`
		top: -50%;
		${ rtl(
			{
				transform: 'translate(-50%, -60%)',
				left: `${ fillPercentage }%`,
			},
			{
				transform: 'translate(50%, -60%)',
				right: `${ fillPercentage }%`,
			}
		)() }
	`;
};

export const tooltip = ( props: TooltipProps ) => {
	const { show, zIndex } = props;

	return css`
		background: rgba( 0, 0, 0, 0.8 );
		border-radius: 2px;
		box-sizing: border-box;
		color: white;
		display: inline-block;
		font-size: 12px;
		min-width: 32px;
		opacity: 0;
		padding: 4px 8px;
		pointer-events: none;
		position: absolute;
		text-align: center;
		transition: opacity 120ms ease;
		user-select: none;
		line-height: 1.4;
		opacity: ${ show ? 1 : 0 };
		z-index: ${ zIndex };

		${ tooltipPosition( props ) };
		${ reduceMotion( 'transition' ) };
	`;
};
