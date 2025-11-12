/**
 * WordPress dependencies
 */
import { _x, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { formatFontStyle } from './format-font-style';
import { formatFontWeight } from './format-font-weight';

const FONT_STYLES = [
	{
		name: _x( 'Regular', 'font style' ),
		value: 'normal',
	},
	{
		name: _x( 'Italic', 'font style' ),
		value: 'italic',
	},
];

const FONT_WEIGHTS = [
	{
		name: _x( 'Thin', 'font weight' ),
		value: '100',
	},
	{
		name: _x( 'Extra Light', 'font weight' ),
		value: '200',
	},
	{
		name: _x( 'Light', 'font weight' ),
		value: '300',
	},
	{
		name: _x( 'Regular', 'font weight' ),
		value: '400',
	},
	{
		name: _x( 'Medium', 'font weight' ),
		value: '500',
	},
	{
		name: _x( 'Semi Bold', 'font weight' ),
		value: '600',
	},
	{
		name: _x( 'Bold', 'font weight' ),
		value: '700',
	},
	{
		name: _x( 'Extra Bold', 'font weight' ),
		value: '800',
	},
	{
		name: _x( 'Black', 'font weight' ),
		value: '900',
	},
	{
		name: _x( 'Extra Black', 'font weight' ),
		value: '1000',
	},
];

/**
 * Builds a list of font style and weight options based on font family faces.
 * Defaults to the standard font styles and weights if no font family faces are provided.
 *
 * @param {Array} fontFamilyFaces font family faces array
 * @return {Object} new object with combined and separated font style and weight properties
 */
export function getFontStylesAndWeights( fontFamilyFaces ) {
	let fontStyles = [];
	let fontWeights = [];
	const combinedStyleAndWeightOptions = [];
	const isSystemFont = ! fontFamilyFaces || fontFamilyFaces?.length === 0;
	let isVariableFont = false;

	fontFamilyFaces?.forEach( ( face ) => {
		// Check for variable font by looking for a space in the font weight value. e.g. "100 900"
		if (
			'string' === typeof face.fontWeight &&
			/\s/.test( face.fontWeight.trim() )
		) {
			isVariableFont = true;

			// Find font weight start and end values.
			let [ startValue, endValue ] = face.fontWeight.split( ' ' );
			startValue = parseInt( startValue.slice( 0, 1 ) );
			if ( endValue === '1000' ) {
				endValue = 10;
			} else {
				endValue = parseInt( endValue.slice( 0, 1 ) );
			}

			// Create font weight options for available variable weights.
			for ( let i = startValue; i <= endValue; i++ ) {
				const fontWeightValue = `${ i.toString() }00`;
				if (
					! fontWeights.some(
						( weight ) => weight.value === fontWeightValue
					)
				) {
					fontWeights.push( formatFontWeight( fontWeightValue ) );
				}
			}
		}

		// Format font style and weight values.
		const fontWeight = formatFontWeight(
			'number' === typeof face.fontWeight
				? face.fontWeight.toString()
				: face.fontWeight
		);
		const fontStyle = formatFontStyle( face.fontStyle );

		// Create font style and font weight lists without duplicates.
		if ( fontStyle && Object.keys( fontStyle ).length ) {
			if (
				! fontStyles.some(
					( style ) => style.value === fontStyle.value
				)
			) {
				fontStyles.push( fontStyle );
			}
		}

		if ( fontWeight && Object.keys( fontWeight ).length ) {
			if (
				! fontWeights.some(
					( weight ) => weight.value === fontWeight.value
				)
			) {
				if ( ! isVariableFont ) {
					fontWeights.push( fontWeight );
				}
			}
		}
	} );

	// If there is no font weight of 600 or above, then include faux bold as an option.
	if ( ! fontWeights.some( ( weight ) => weight.value >= '600' ) ) {
		fontWeights.push( {
			name: _x( 'Bold', 'font weight' ),
			value: '700',
		} );
	}

	// If there is no italic font style, then include faux italic as an option.
	if ( ! fontStyles.some( ( style ) => style.value === 'italic' ) ) {
		fontStyles.push( {
			name: _x( 'Italic', 'font style' ),
			value: 'italic',
		} );
	}

	// Use default font styles and weights for system fonts.
	if ( isSystemFont ) {
		fontStyles = FONT_STYLES;
		fontWeights = FONT_WEIGHTS;
	}

	// Use default styles and weights if there are no available styles or weights from the provided font faces.
	fontStyles = fontStyles.length === 0 ? FONT_STYLES : fontStyles;
	fontWeights = fontWeights.length === 0 ? FONT_WEIGHTS : fontWeights;

	// Generate combined font style and weight options for available fonts.
	fontStyles.forEach( ( { name: styleName, value: styleValue } ) => {
		fontWeights.forEach( ( { name: weightName, value: weightValue } ) => {
			const optionName =
				styleValue === 'normal'
					? weightName
					: sprintf(
							/* translators: 1: Font weight name. 2: Font style name. */
							_x( '%1$s %2$s', 'font' ),
							weightName,
							styleName
					  );

			combinedStyleAndWeightOptions.push( {
				key: `${ styleValue }-${ weightValue }`,
				name: optionName,
				style: {
					fontStyle: styleValue,
					fontWeight: weightValue,
				},
			} );
		} );
	} );

	return {
		fontStyles,
		fontWeights,
		combinedStyleAndWeightOptions,
		isSystemFont,
		isVariableFont,
	};
}
