/**
 * The fluid utilities must match the backend equivalent.
 * See: gutenberg_get_typography_font_size_value() in lib/block-supports/typography.php
 * ---------------------------------------------------------------
 */

// Defaults.
const DEFAULT_MAXIMUM_VIEWPORT_WIDTH = '1600px';
const DEFAULT_MINIMUM_VIEWPORT_WIDTH = '768px';
const DEFAULT_SCALE_FACTOR = 1;
const DEFAULT_MINIMUM_FONT_SIZE_FACTOR = 0.75;
const DEFAULT_MAXIMUM_FONT_SIZE_FACTOR = 1.5;
const DEFAULT_MINIMUM_FONT_SIZE_LIMIT = '14px';

/**
 * Computes a fluid font-size value that uses clamp(). A minimum and maxinmum
 * font size OR a single font size can be specified.
 *
 * If a single font size is specified, it is scaled up and down by
 * minimumFontSizeFactor and maximumFontSizeFactor to arrive at the minimum and
 * maximum sizes.
 *
 * @example
 * ```js
 * // Calculate fluid font-size value from a minimum and maximum value.
 * const fontSize = getComputedFluidTypographyValue( {
 *     minimumFontSize: '20px',
 *     maximumFontSize: '45px'
 * } );
 * // Calculate fluid font-size value from a single font size.
 * const fontSize = getComputedFluidTypographyValue( {
 *     fontSize: '30px',
 * } );
 * ```
 *
 * @param {Object}        args
 * @param {?string}       args.minimumViewPortWidth  Minimum viewport size from which type will have fluidity. Optional if fontSize is specified.
 * @param {?string}       args.maximumViewPortWidth  Maximum size up to which type will have fluidity. Optional if fontSize is specified.
 * @param {string|number} [args.fontSize]            Size to derive maximumFontSize and minimumFontSize from, if necessary. Optional if minimumFontSize and maximumFontSize are specified.
 * @param {?string}       args.maximumFontSize       Maximum font size for any clamp() calculation. Optional.
 * @param {?string}       args.minimumFontSize       Minimum font size for any clamp() calculation. Optional.
 * @param {?number}       args.scaleFactor           A scale factor to determine how fast a font scales within boundaries. Optional.
 * @param {?number}       args.minimumFontSizeFactor How much to scale defaultFontSize by to derive minimumFontSize. Optional.
 * @param {?number}       args.maximumFontSizeFactor How much to scale defaultFontSize by to derive maximumFontSize. Optional.
 *
 * @return {string|null} A font-size value using clamp().
 */
export function getComputedFluidTypographyValue( {
	minimumFontSize,
	maximumFontSize,
	fontSize,
	minimumViewPortWidth = DEFAULT_MINIMUM_VIEWPORT_WIDTH,
	maximumViewPortWidth = DEFAULT_MAXIMUM_VIEWPORT_WIDTH,
	scaleFactor = DEFAULT_SCALE_FACTOR,
	minimumFontSizeFactor = DEFAULT_MINIMUM_FONT_SIZE_FACTOR,
	maximumFontSizeFactor = DEFAULT_MAXIMUM_FONT_SIZE_FACTOR,
	minimumFontSizeLimit = DEFAULT_MINIMUM_FONT_SIZE_LIMIT,
} ) {
	/*
	 * Caches minimumFontSize in minimumFontSizeValue
	 * so we can check if minimumFontSize exists later.
	 */
	let minimumFontSizeValue = minimumFontSize;

	/*
	 * Calculates missing minimumFontSize and maximumFontSize from
	 * defaultFontSize if provided.
	 */
	if ( fontSize ) {
		// Parses default font size.
		const fontSizeParsed = getTypographyValueAndUnit( fontSize );

		// Protect against invalid units.
		if ( ! fontSizeParsed?.unit ) {
			return null;
		}

		// If no minimumFontSize is provided, derive using min scale factor.
		if ( ! minimumFontSizeValue ) {
			minimumFontSizeValue =
				roundToPrecision(
					fontSizeParsed.value * minimumFontSizeFactor,
					3
				) + fontSizeParsed.unit;
		}

		// Parses the minimum font size limit, so we can perform checks using it.
		const minimumFontSizeLimitParsed = getTypographyValueAndUnit(
			minimumFontSizeLimit,
			{
				coerceTo: fontSizeParsed.unit,
			}
		);

		if ( !! minimumFontSizeLimitParsed?.value ) {
			/*
			 * If a minimum size was not passed to this function
			 * and the user-defined font size is lower than `minimumFontSizeLimit`,
			 * then uses the user-defined font size as the minimum font-size.
			 */
			if (
				! minimumFontSize &&
				fontSizeParsed?.value < minimumFontSizeLimitParsed?.value
			) {
				minimumFontSizeValue = `${ fontSizeParsed.value }${ fontSizeParsed.unit }`;
			} else {
				const minimumFontSizeParsed = getTypographyValueAndUnit(
					minimumFontSizeValue,
					{
						coerceTo: fontSizeParsed.unit,
					}
				);

				/*
				 * Otherwise, if the passed or calculated minimum font size is lower than `minimumFontSizeLimit`
				 * use `minimumFontSizeLimit` instead.
				 */
				if (
					!! minimumFontSizeParsed?.value &&
					minimumFontSizeParsed.value <
						minimumFontSizeLimitParsed.value
				) {
					minimumFontSizeValue = `${ minimumFontSizeLimitParsed.value }${ minimumFontSizeLimitParsed.unit }`;
				}
			}
		}

		// If no maximumFontSize is provided, derive using max scale factor.
		if ( ! maximumFontSize ) {
			maximumFontSize =
				roundToPrecision(
					fontSizeParsed.value * maximumFontSizeFactor,
					3
				) + fontSizeParsed.unit;
		}
	}

	// Return early if one of the provided inputs is not provided.
	if ( ! minimumFontSizeValue || ! maximumFontSize ) {
		return null;
	}

	// Grab the minimum font size and normalize it in order to use the value for calculations.
	const minimumFontSizeParsed =
		getTypographyValueAndUnit( minimumFontSizeValue );

	// We get a 'preferred' unit to keep units consistent when calculating,
	// otherwise the result will not be accurate.
	const fontSizeUnit = minimumFontSizeParsed?.unit || 'rem';

	// Grabs the maximum font size and normalize it in order to use the value for calculations.
	const maximumFontSizeParsed = getTypographyValueAndUnit( maximumFontSize, {
		coerceTo: fontSizeUnit,
	} );

	// Checks for mandatory min and max sizes, and protects against unsupported units.
	if ( ! minimumFontSizeParsed || ! maximumFontSizeParsed ) {
		return null;
	}

	// Uses rem for accessible fluid target font scaling.
	const minimumFontSizeRem = getTypographyValueAndUnit(
		minimumFontSizeValue,
		{
			coerceTo: 'rem',
		}
	);

	// Viewport widths defined for fluid typography. Normalize units
	const maximumViewPortWidthParsed = getTypographyValueAndUnit(
		maximumViewPortWidth,
		{ coerceTo: fontSizeUnit }
	);
	const minumumViewPortWidthParsed = getTypographyValueAndUnit(
		minimumViewPortWidth,
		{ coerceTo: fontSizeUnit }
	);

	// Protect against unsupported units.
	if (
		! maximumViewPortWidthParsed ||
		! minumumViewPortWidthParsed ||
		! minimumFontSizeRem
	) {
		return null;
	}

	// Build CSS rule.
	// Borrowed from https://websemantics.uk/tools/responsive-font-calculator/.
	const minViewPortWidthOffsetValue = roundToPrecision(
		minumumViewPortWidthParsed.value / 100,
		3
	);

	const viewPortWidthOffset =
		roundToPrecision( minViewPortWidthOffsetValue, 3 ) + fontSizeUnit;
	const linearFactor =
		100 *
		( ( maximumFontSizeParsed.value - minimumFontSizeParsed.value ) /
			( maximumViewPortWidthParsed.value -
				minumumViewPortWidthParsed.value ) );
	const linearFactorScaled = roundToPrecision(
		( linearFactor || 1 ) * scaleFactor,
		3
	);
	const fluidTargetFontSize = `${ minimumFontSizeRem.value }${ minimumFontSizeRem.unit } + ((1vw - ${ viewPortWidthOffset }) * ${ linearFactorScaled })`;

	return `clamp(${ minimumFontSizeValue }, ${ fluidTargetFontSize }, ${ maximumFontSize })`;
}

/**
 * Internal method that checks a string for a unit and value and returns an array consisting of `'value'` and `'unit'`, e.g., [ '42', 'rem' ].
 * A raw font size of `value + unit` is expected. If the value is an integer, it will convert to `value + 'px'`.
 *
 * @param {string|number}    rawValue Raw size value from theme.json.
 * @param {Object|undefined} options  Calculation options.
 *
 * @return {{ unit: string, value: number }|null} An object consisting of `'value'` and `'unit'` properties.
 */
export function getTypographyValueAndUnit( rawValue, options = {} ) {
	if ( typeof rawValue !== 'string' && typeof rawValue !== 'number' ) {
		return null;
	}

	// Converts numeric values to pixel values by default.
	if ( isFinite( rawValue ) ) {
		rawValue = `${ rawValue }px`;
	}

	const { coerceTo, rootSizeValue, acceptableUnits } = {
		coerceTo: '',
		// Default browser font size. Later we could inject some JS to compute this `getComputedStyle( document.querySelector( "html" ) ).fontSize`.
		rootSizeValue: 16,
		acceptableUnits: [ 'rem', 'px', 'em' ],
		...options,
	};

	const acceptableUnitsGroup = acceptableUnits?.join( '|' );
	const regexUnits = new RegExp(
		`^(\\d*\\.?\\d+)(${ acceptableUnitsGroup }){1,1}$`
	);

	const matches = rawValue.match( regexUnits );

	// We need a number value and a unit.
	if ( ! matches || matches.length < 3 ) {
		return null;
	}

	let [ , value, unit ] = matches;

	let returnValue = parseFloat( value );

	if ( 'px' === coerceTo && ( 'em' === unit || 'rem' === unit ) ) {
		returnValue = returnValue * rootSizeValue;
		unit = coerceTo;
	}

	if ( 'px' === unit && ( 'em' === coerceTo || 'rem' === coerceTo ) ) {
		returnValue = returnValue / rootSizeValue;
		unit = coerceTo;
	}

	/*
	 * No calculation is required if swapping between em and rem yet,
	 * since we assume a root size value. Later we might like to differentiate between
	 * :root font size (rem) and parent element font size (em) relativity.
	 */
	if (
		( 'em' === coerceTo || 'rem' === coerceTo ) &&
		( 'em' === unit || 'rem' === unit )
	) {
		unit = coerceTo;
	}

	return {
		value: roundToPrecision( returnValue, 3 ),
		unit,
	};
}

/**
 * Returns a value rounded to defined precision.
 * Returns `undefined` if the value is not a valid finite number.
 *
 * @param {number} value  Raw value.
 * @param {number} digits The number of digits to appear after the decimal point
 *
 * @return {number|undefined} Value rounded to standard precision.
 */
export function roundToPrecision( value, digits = 3 ) {
	const base = Math.pow( 10, digits );
	return Number.isFinite( value )
		? parseFloat( Math.round( value * base ) / base )
		: undefined;
}
