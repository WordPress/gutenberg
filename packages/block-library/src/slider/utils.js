/**
 * WordPress dependencies
 */
import { __experimentalGetGapCSSValue as getGapCSSValue } from '@wordpress/block-editor';

export const DEFAULT_PEEK_AMOUNT = 32;
export const DEFAULT_PEEK_UNIT = 'px';
export const ZERO_PEEK_CLASS = 'is-zero-peek';

function getSliderGapCSSValue( blockGap ) {
	if ( blockGap === 0 || blockGap === '0' ) {
		return '0px';
	}

	return getGapCSSValue( blockGap );
}

function getSliderGapValue( blockGap ) {
	if ( typeof blockGap === 'string' || blockGap === 0 ) {
		return getSliderGapCSSValue( blockGap );
	}

	if ( ! blockGap ) {
		return null;
	}

	const horizontalGap = blockGap.left ?? blockGap.top;

	return horizontalGap || horizontalGap === 0
		? getSliderGapCSSValue( horizontalGap )
		: null;
}

export function getSliderStyle( {
	peekAmount = DEFAULT_PEEK_AMOUNT,
	peekUnit = DEFAULT_PEEK_UNIT,
	style,
} ) {
	const amount = Number.isFinite( peekAmount )
		? peekAmount
		: DEFAULT_PEEK_AMOUNT;
	const unit = peekUnit || DEFAULT_PEEK_UNIT;
	const sliderGap = getSliderGapValue( style?.spacing?.blockGap );
	const sliderStyle = {
		'--wp--style--slider-peek': `${ amount }${ unit }`,
	};

	if ( sliderGap ) {
		sliderStyle[ '--wp--style--slider-gap' ] = sliderGap;
	}

	return sliderStyle;
}

export function isZeroPeek( peekAmount = DEFAULT_PEEK_AMOUNT ) {
	return Number.isFinite( peekAmount ) && peekAmount === 0;
}
