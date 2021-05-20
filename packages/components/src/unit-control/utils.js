/**
 * External dependencies
 */
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { Platform } from '@wordpress/element';

const isWeb = Platform.OS === 'web';

/**
 * An array of all available CSS length units.
 */
export const ALL_CSS_UNITS = [
	{
		value: 'px',
		label: isWeb ? 'px' : __( 'Pixels (px)' ),
		default: '',
		a11yLabel: __( 'Pixels (px)' ),
	},
	{
		value: '%',
		label: isWeb ? '%' : __( 'Percentage (%)' ),
		default: '',
		a11yLabel: __( 'Percent (%)' ),
	},
	{
		value: 'em',
		label: isWeb ? 'em' : __( 'Relative to parent font size (em)' ),
		default: '',
		a11yLabel: __( 'Relative to parent font size (em)' ),
	},
	{
		value: 'rem',
		label: isWeb ? 'rem' : __( 'Relative to root font size (rem)' ),
		default: '',
		a11yLabel: __( 'Relative to root font size (rem)' ),
	},
	{
		value: 'vw',
		label: isWeb ? 'vw' : __( 'Viewport width (vw)' ),
		default: '',
		a11yLabel: __( 'Viewport width (vw)' ),
	},
	{
		value: 'vh',
		label: isWeb ? 'vh' : __( 'Viewport height (vh)' ),
		default: '',
		a11yLabel: __( 'Viewport height (vh)' ),
	},
	{
		value: 'vmin',
		label: isWeb ? 'vmin' : __( 'Viewport smallest dimension (vmin)' ),
		default: '',
		a11yLabel: __( 'Viewport smallest dimension (vmin)' ),
	},
	{
		value: 'vmax',
		label: isWeb ? 'vmax' : __( 'Viewport largest dimension (vmax)' ),
		default: '',
		a11yLabel: __( 'Viewport largest dimension (vmax)' ),
	},
	{
		value: 'ch',
		label: isWeb ? 'ch' : __( 'Width of the zero (0) character (ch)' ),
		default: '',
		a11yLabel: __( 'Width of the zero (0) character (ch)' ),
	},
	{
		value: 'ex',
		label: isWeb ? 'ex' : __( 'x-height of the font (ex)' ),
		default: '',
		a11yLabel: __( 'x-height of the font (ex)' ),
	},
	{
		value: 'cm',
		label: isWeb ? 'cm' : __( 'Centimeters (cm)' ),
		default: '',
		a11yLabel: __( 'Centimeters (cm)' ),
	},
	{
		value: 'mm',
		label: isWeb ? 'mm' : __( 'Millimeters (mm)' ),
		default: '',
		a11yLabel: __( 'Millimeters (mm)' ),
	},
	{
		value: 'in',
		label: isWeb ? 'in' : __( 'Inches (in)' ),
		default: '',
		a11yLabel: __( 'Inches (in)' ),
	},
	{
		value: 'pc',
		label: isWeb ? 'pc' : __( 'Picas (pc)' ),
		default: '',
		a11yLabel: __( 'Picas (pc)' ),
	},
	{
		value: 'pt',
		label: isWeb ? 'pt' : __( 'Points (pt)' ),
		default: '',
		a11yLabel: __( 'Points (pt)' ),
	},
];

/**
 * Units of measurements. `a11yLabel` is used by screenreaders.
 */
export const CSS_UNITS = [
	{ value: 'px', label: 'px', default: 0, a11yLabel: __( 'pixels' ) },
	{ value: '%', label: '%', default: 10, a11yLabel: __( 'percent' ) },
	{
		value: 'em',
		label: 'em',
		default: 0,
		a11yLabel: _x( 'ems', 'Relative to parent font size (em)' ),
	},
	{
		value: 'rem',
		label: 'rem',
		default: 0,
		a11yLabel: _x( 'rems', 'Relative to root font size (rem)' ),
	},
	{
		value: 'vw',
		label: 'vw',
		default: 10,
		a11yLabel: __( 'viewport widths' ),
	},
	{
		value: 'vh',
		label: 'vh',
		default: 10,
		a11yLabel: __( 'viewport heights' ),
	},
];

export const DEFAULT_UNIT = CSS_UNITS[ 0 ];

/**
 * Handles legacy value + unit handling.
 * This component use to manage both incoming value and units separately.
 *
 * Moving forward, ideally the value should be a string that contains both
 * the value and unit, example: '10px'
 *
 * @param {number|string} value Value
 * @param {string} unit Unit value
 * @param {Array<Object>} units Units to derive from.
 * @return {Array<number, string>} The extracted number and unit.
 */
export function getParsedValue( value, unit, units ) {
	const initialValue = unit ? `${ value }${ unit }` : value;

	return parseUnit( initialValue, units );
}

/**
 * Checks if units are defined.
 *
 * @param {any} units Units to check.
 * @return {boolean} Whether units are defined.
 */
export function hasUnits( units ) {
	return ! isEmpty( units ) && units.length > 1 && units !== false;
}

/**
 * Parses a number and unit from a value.
 *
 * @param {string} initialValue Value to parse
 * @param {Array<Object>} units Units to derive from.
 * @return {Array<number, string>} The extracted number and unit.
 */
export function parseUnit( initialValue, units = ALL_CSS_UNITS ) {
	const value = String( initialValue ).trim();

	let num = parseFloat( value, 10 );
	num = isNaN( num ) ? '' : num;

	const unitMatch = value.match( /[\d.\-\+]*\s*(.*)/ )[ 1 ];

	let unit = unitMatch !== undefined ? unitMatch : '';
	unit = unit.toLowerCase();

	if ( hasUnits( units ) ) {
		const match = units.find( ( item ) => item.value === unit );
		unit = match?.value;
	} else {
		unit = DEFAULT_UNIT.value;
	}

	return [ num, unit ];
}

/**
 * Parses a number and unit from a value. Validates parsed value, using fallback
 * value if invalid.
 *
 * @param {number|string} next The next value.
 * @param {Array<Object>} units Units to derive from.
 * @param {number|string} fallbackValue The fallback value.
 * @param {string} fallbackUnit The fallback value.
 * @return {Array<number, string>} The extracted number and unit.
 */
export function getValidParsedUnit( next, units, fallbackValue, fallbackUnit ) {
	const [ parsedValue, parsedUnit ] = parseUnit( next, units );
	let baseValue = parsedValue;
	let baseUnit;

	if ( isNaN( parsedValue ) || parsedValue === '' ) {
		baseValue = fallbackValue;
	}

	baseUnit = parsedUnit || fallbackUnit;

	/**
	 * If no unit is found, attempt to use the first value from the collection
	 * of units as a default fallback.
	 */
	if ( hasUnits( units ) && ! baseUnit ) {
		baseUnit = units[ 0 ]?.value;
	}

	return [ baseValue, baseUnit ];
}

/**
 * Takes a unit value and finds the matching accessibility label for the
 * unit abbreviation.
 *
 * @param {string} unit Unit value (example: px)
 * @return {string} a11y label for the unit abbreviation
 */
export function parseA11yLabelForUnit( unit ) {
	const match = ALL_CSS_UNITS.find( ( item ) => item.value === unit );
	return match?.a11yLabel ? match?.a11yLabel : match?.value;
}

/**
 * Filters available units based on values defined by settings.
 *
 * @param {Array} settings Collection of preferred units.
 * @param {Array} units Collection of available units.
 *
 * @return {Array} Filtered units based on settings.
 */
function filterUnitsWithSettings( settings = [], units = [] ) {
	return units.filter( ( unit ) => {
		return settings.includes( unit.value );
	} );
}

/**
 * Custom hook to retrieve and consolidate units setting from add_theme_support().
 * TODO: ideally this hook shouldn't be needed
 * https://github.com/WordPress/gutenberg/pull/31822#discussion_r633280823
 *
 * @param {Object} args                An object containing units, settingPath & defaultUnits.
 * @param {Object} args.units          Collection of available units.
 * @param {string} args.availableUnits The setting path. Defaults to 'spacing.units'.
 * @param {Object} args.defaultValues  Collection of default values for defined units. Example: { px: '350', em: '15' }.
 *
 * @return {Array} Filtered units based on settings.
 */
export const useCustomUnits = ( { units, availableUnits, defaultValues } ) => {
	units = units || ALL_CSS_UNITS;
	const usedUnits = filterUnitsWithSettings(
		! availableUnits ? [] : availableUnits,
		units
	);

	if ( defaultValues ) {
		usedUnits.forEach( ( unit, i ) => {
			if ( defaultValues[ unit.value ] ) {
				usedUnits[ i ].default = defaultValues[ unit.value ];
			}
		} );
	}

	return usedUnits.length === 0 ? false : usedUnits;
};
