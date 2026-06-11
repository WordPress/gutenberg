/**
 * WordPress dependencies
 */
import { __experimentalGetGapCSSValue as getGapCSSValue } from '@wordpress/block-editor';

export const DEFAULT_PEEK_AMOUNT = 32;
export const DEFAULT_PEEK_UNIT = 'px';

function getSliderGapValue( blockGap ) {
	if ( ! blockGap ) {
		return null;
	}

	if ( typeof blockGap === 'string' ) {
		return getGapCSSValue( blockGap );
	}

	const horizontalGap = blockGap.left ?? blockGap.top;
	return horizontalGap ? getGapCSSValue( horizontalGap ) : null;
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
		'--wp--style--slider-peek-double': `${ amount * 2 }${ unit }`,
	};

	if ( sliderGap ) {
		sliderStyle[ '--wp--style--slider-gap' ] = sliderGap;
	}

	return sliderStyle;
}
