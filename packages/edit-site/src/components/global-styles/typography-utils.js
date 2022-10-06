/**
 * The fluid utilities must match the backend equivalent.
 * See: gutenberg_get_typography_font_size_value() in lib/block-supports/typography.php
 * ---------------------------------------------------------------
 */

/**
 * Returns a font-size value based on a given font-size preset.
 * Takes into account fluid typography parameters and attempts to return a css formula depending on available, valid values.
 *
 * @param {Object}           preset
 * @param {string}           preset.size              A default font size.
 * @param {string}           preset.name              A font size name, displayed in the UI.
 * @param {string}           preset.slug              A font size slug.
 * @param {Object}           preset.fluid
 * @param {string|undefined} preset.fluid.max         A maximum font size value.
 * @param {string|undefined} preset.fluid.min         A minimum font size value.
 * @param {Object}           typographySettings
 * @param {boolean}          typographySettings.fluid Whether fluid typography is enabled.
 *
 * @return {string} An font-size value
 */
export function getTypographyFontSizeValue( preset, typographySettings ) {
	const { size: defaultSize } = preset;

	if ( true !== typographySettings?.fluid || ! defaultSize ) {
		return defaultSize;
	}

	// Defaults.
	const DEFAULT_MAXIMUM_VIEWPORT_WIDTH = '1600px';
	const DEFAULT_MINIMUM_VIEWPORT_WIDTH = '768px';
	const DEFAULT_MINIMUM_FONT_SIZE_FACTOR = 0.75;
	const DEFAULT_MAXIMUM_FONT_SIZE_FACTOR = 1.5;
	const DEFAULT_SCALE_FACTOR = 1;

	// Font sizes.
	// A font size has explicitly bypassed fluid calculations.
	if ( false === preset?.fluid ) {
		return defaultSize;
	}

	const fluidFontSizeSettings = preset?.fluid || {};

	// Try to grab explicit min and max fluid font sizes.
	let minimumFontSizeRaw = fluidFontSizeSettings?.min;
	let maximumFontSizeRaw = fluidFontSizeSettings?.max;
	const preferredSize = getTypographyValueAndUnit( defaultSize );

	// Protect against unsupported units.
	if ( ! preferredSize?.unit ) {
		return defaultSize;
	}

	// If no fluid min or max font sizes are available, create some using min/max font size factors.
	if ( ! minimumFontSizeRaw ) {
		minimumFontSizeRaw =
			preferredSize.value * DEFAULT_MINIMUM_FONT_SIZE_FACTOR +
			preferredSize.unit;
	}

	if ( ! maximumFontSizeRaw ) {
		maximumFontSizeRaw =
			preferredSize.value * DEFAULT_MAXIMUM_FONT_SIZE_FACTOR +
			preferredSize.unit;
	}

	const fluidFontSizeValue = getComputedFluidTypographyValue( {
		maximumViewPortWidth: DEFAULT_MAXIMUM_VIEWPORT_WIDTH,
		minimumViewPortWidth: DEFAULT_MINIMUM_VIEWPORT_WIDTH,
		maximumFontSize: maximumFontSizeRaw,
		minimumFontSize: minimumFontSizeRaw,
		scaleFactor: DEFAULT_SCALE_FACTOR,
	} );

	if ( !! fluidFontSizeValue ) {
		return fluidFontSizeValue;
	}

	return defaultSize;
}

/**
 * Internal implementation of clamp() based on available min/max viewport width, and min/max font sizes.
 *
 * @param {Object} args
 * @param {string} args.maximumViewPortWidth Maximum size up to which type will have fluidity.
 * @param {string} args.minimumViewPortWidth Minimum viewport size from which type will have fluidity.
 * @param {string} args.maximumFontSize      Maximum font size for any clamp() calculation.
 * @param {string} args.minimumFontSize      Minimum font size for any clamp() calculation.
 * @param {number} args.scaleFactor          A scale factor to determine how fast a font scales within boundaries.
 *
 * @return {string|null} A font-size value using clamp().
 */
export function getComputedFluidTypographyValue( {
	maximumViewPortWidth,
	minimumViewPortWidth,
	maximumFontSize,
	minimumFontSize,
	scaleFactor,
} ) {
	// Grab the minimum font size and normalize it in order to use the value for calculations.
	const minimumFontSizeParsed = getTypographyValueAndUnit( minimumFontSize );

	// We get a 'preferred' unit to keep units consistent when calculating,
	// otherwise the result will not be accurate.
	const fontSizeUnit = minimumFontSizeParsed?.unit || 'rem';

	// Grab the maximum font size and normalize it in order to use the value for calculations.
	const maximumFontSizeParsed = getTypographyValueAndUnit( maximumFontSize, {
		coerceTo: fontSizeUnit,
	} );

	// Protect against unsupported units.
	if ( ! minimumFontSizeParsed || ! maximumFontSizeParsed ) {
		return null;
	}

	// Use rem for accessible fluid target font scaling.
	const minimumFontSizeRem = getTypographyValueAndUnit( minimumFontSize, {
		coerceTo: 'rem',
	} );

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

	const viewPortWidthOffset = minViewPortWidthOffsetValue + fontSizeUnit;
	let linearFactor =
		100 *
		( ( maximumFontSizeParsed.value - minimumFontSizeParsed.value ) /
			( maximumViewPortWidthParsed.value -
				minumumViewPortWidthParsed.value ) );
	linearFactor = roundToPrecision( linearFactor, 3 ) || 1;
	const linearFactorScaled = linearFactor * scaleFactor;
	const fluidTargetFontSize = `${ minimumFontSizeRem.value }${ minimumFontSizeRem.unit } + ((1vw - ${ viewPortWidthOffset }) * ${ linearFactorScaled })`;

	return `clamp(${ minimumFontSize }, ${ fluidTargetFontSize }, ${ maximumFontSize })`;
}

/**
 *
 * @param {string}           rawValue Raw size value from theme.json.
 * @param {Object|undefined} options  Calculation options.
 *
 * @return {{ unit: string, value: number }|null} An object consisting of `'value'` and `'unit'` properties.
 */
export function getTypographyValueAndUnit( rawValue, options = {} ) {
	if ( ! rawValue ) {
		return null;
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

	return {
		value: returnValue,
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
	return Number.isFinite( value )
		? parseFloat( value.toFixed( digits ) )
		: undefined;
}
