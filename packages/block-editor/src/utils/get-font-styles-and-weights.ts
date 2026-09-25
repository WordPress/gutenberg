import { _x, sprintf } from '@wordpress/i18n';
import { formatFontStyle } from './format-font-style';
import { formatFontWeight } from './format-font-weight';
import type {
	FontFamilyFace,
	FormattedFont,
	CombinedStyleAndWeightOption,
} from './types';

/*
 * The absolute keywords a `@font-face` weight may use. `lighter` and `bolder` are
 * relative to the parent and are not allowed there, so they are not listed.
 */
const FONT_WEIGHT_KEYWORDS: Record< string, number | undefined > = {
	normal: 400,
	bold: 700,
};

function isValidWeight( weight: number | undefined ): weight is number {
	return (
		weight !== undefined &&
		Number.isFinite( weight ) &&
		weight >= 1 &&
		weight <= 1000
	);
}

/*
 * Read one end of a `@font-face` weight range as a number, or undefined when it is
 * neither a number nor a keyword the property accepts.
 */
function parseWeightValue( value: string ): number | undefined {
	const token = value.trim().toLowerCase();
	const weight = FONT_WEIGHT_KEYWORDS[ token ] ?? Number( token );
	return isValidWeight( weight ) ? weight : undefined;
}

/*
 * Read a `@font-face` style descriptor as a value the `font-style` property accepts.
 * The two-angle oblique form is allowed in the descriptor only: it says which slant
 * requests the face can match, not a style an element may ask for, and the property
 * discards it. It resolves to the end of the range nearest upright, which is the slant
 * the face gives a `normal` request, leaving any control over the rest of the range to
 * a font axis UI rather than an appearance list.
 */
function parseFontStyleValue( value: string ): string | undefined {
	const style = value.trim().toLowerCase().replace( /\s+/g, ' ' );

	if ( style === 'normal' || style === 'italic' || style === 'oblique' ) {
		return style;
	}

	const angles = style.match(
		/^oblique (-?\d*\.?\d+)deg(?: (-?\d*\.?\d+)deg)?$/
	);

	if ( ! angles ) {
		return undefined;
	}

	// A single angle is already a style an element can use.
	if ( angles[ 2 ] === undefined ) {
		return style;
	}

	const start = Number( angles[ 1 ] );
	const end = Number( angles[ 2 ] );
	const nearest =
		Math.min( start, end ) <= 0 && Math.max( start, end ) >= 0
			? 0
			: [ start, end ].sort(
					( a, b ) => Math.abs( a ) - Math.abs( b )
				)[ 0 ];

	return nearest === 0 ? 'normal' : `oblique ${ nearest }deg`;
}

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
 * @param fontFamilyFaces font family faces array
 * @return new object with combined and separated font style and weight properties
 */
export function getFontStylesAndWeights(
	fontFamilyFaces: FontFamilyFace[] | undefined
) {
	let fontStyles: FormattedFont[] = [];
	let fontWeights: FormattedFont[] = [];
	const combinedStyleAndWeightOptions: CombinedStyleAndWeightOption[] = [];
	const isSystemFont = ! fontFamilyFaces || fontFamilyFaces?.length === 0;
	let isVariableFont = false;

	fontFamilyFaces?.forEach( ( face ) => {
		// Check for variable font by looking for a space in the font weight value. e.g. "100 900"
		if (
			'string' === typeof face.fontWeight &&
			/\s/.test( face.fontWeight.trim() )
		) {
			// Read both ends, which may be keywords: "normal 900" is 400 to 900.
			const [ startStr, endStr ] = face.fontWeight.trim().split( /\s+/ );
			const start = parseWeightValue( startStr );
			const end = parseWeightValue( endStr );

			// A range this property cannot express is left to the face's own
			// formatting below rather than offering weights nobody declared.
			if ( start !== undefined && end !== undefined ) {
				isVariableFont = true;

				// Find the hundreds inside the range, e.g. 300 to 700 for "250 750".
				const startValue = Math.ceil( start / 100 );
				const endValue = Math.floor( end / 100 );

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
		}

		// Format font style and weight values.
		const fontWeight = formatFontWeight(
			'number' === typeof face.fontWeight
				? face.fontWeight.toString()
				: face.fontWeight
		);
		const fontStyle = formatFontStyle(
			face.fontStyle === undefined
				? face.fontStyle
				: parseFontStyleValue( face.fontStyle )
		);

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
	if ( ! fontWeights.some( ( weight ) => ( weight.value ?? '' ) >= '600' ) ) {
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
							weightName ?? '',
							styleName ?? ''
						);

			combinedStyleAndWeightOptions.push( {
				key: `${ styleValue }-${ weightValue }`,
				name: optionName ?? '',
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
