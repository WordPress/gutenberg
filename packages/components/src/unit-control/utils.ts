/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { Platform } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { Value, WPUnitControlUnit, WPUnitControlUnitList } from './types';

const isWeb = Platform.OS === 'web';

const allUnits: Record< string, WPUnitControlUnit > = {
	px: {
		value: 'px',
		label: isWeb ? 'px' : __( 'Pixels (px)' ),
		default: '',
		a11yLabel: __( 'Pixels (px)' ),
		step: 1,
	},
	'%': {
		value: '%',
		label: isWeb ? '%' : __( 'Percentage (%)' ),
		default: '',
		a11yLabel: __( 'Percent (%)' ),
		step: 0.1,
	},
	em: {
		value: 'em',
		label: isWeb ? 'em' : __( 'Relative to parent font size (em)' ),
		default: '',
		a11yLabel: _x( 'ems', 'Relative to parent font size (em)' ),
		step: 0.01,
	},
	rem: {
		value: 'rem',
		label: isWeb ? 'rem' : __( 'Relative to root font size (rem)' ),
		default: '',
		a11yLabel: _x( 'rems', 'Relative to root font size (rem)' ),
		step: 0.01,
	},
	vw: {
		value: 'vw',
		label: isWeb ? 'vw' : __( 'Viewport width (vw)' ),
		default: '',
		a11yLabel: __( 'Viewport width (vw)' ),
		step: 0.1,
	},
	vh: {
		value: 'vh',
		label: isWeb ? 'vh' : __( 'Viewport height (vh)' ),
		default: '',
		a11yLabel: __( 'Viewport height (vh)' ),
		step: 0.1,
	},
	vmin: {
		value: 'vmin',
		label: isWeb ? 'vmin' : __( 'Viewport smallest dimension (vmin)' ),
		default: '',
		a11yLabel: __( 'Viewport smallest dimension (vmin)' ),
		step: 0.1,
	},
	vmax: {
		value: 'vmax',
		label: isWeb ? 'vmax' : __( 'Viewport largest dimension (vmax)' ),
		default: '',
		a11yLabel: __( 'Viewport largest dimension (vmax)' ),
		step: 0.1,
	},
	ch: {
		value: 'ch',
		label: isWeb ? 'ch' : __( 'Width of the zero (0) character (ch)' ),
		default: '',
		a11yLabel: __( 'Width of the zero (0) character (ch)' ),
		step: 0.01,
	},
	ex: {
		value: 'ex',
		label: isWeb ? 'ex' : __( 'x-height of the font (ex)' ),
		default: '',
		a11yLabel: __( 'x-height of the font (ex)' ),
		step: 0.01,
	},
	cm: {
		value: 'cm',
		label: isWeb ? 'cm' : __( 'Centimeters (cm)' ),
		default: '',
		a11yLabel: __( 'Centimeters (cm)' ),
		step: 0.001,
	},
	mm: {
		value: 'mm',
		label: isWeb ? 'mm' : __( 'Millimeters (mm)' ),
		default: '',
		a11yLabel: __( 'Millimeters (mm)' ),
		step: 0.1,
	},
	in: {
		value: 'in',
		label: isWeb ? 'in' : __( 'Inches (in)' ),
		default: '',
		a11yLabel: __( 'Inches (in)' ),
		step: 0.001,
	},
	pc: {
		value: 'pc',
		label: isWeb ? 'pc' : __( 'Picas (pc)' ),
		default: '',
		a11yLabel: __( 'Picas (pc)' ),
		step: 1,
	},
	pt: {
		value: 'pt',
		label: isWeb ? 'pt' : __( 'Points (pt)' ),
		default: '',
		a11yLabel: __( 'Points (pt)' ),
		step: 1,
	},
	css: {
		value: 'css',
		label: isWeb ? 'css' : __( 'Custom css (css)' ),
		default: '',
		a11yLabel: __( 'Custom css (css)' ),
		step: 'any',
	},
};

/**
 * An array of all available CSS length units.
 */
export const ALL_CSS_UNITS = Object.values( allUnits );

/**
 * Units of measurements. `a11yLabel` is used by screenreaders.
 */
export const CSS_UNITS = [
	allUnits.px,
	allUnits[ '%' ],
	allUnits.em,
	allUnits.rem,
	allUnits.vw,
	allUnits.vh,
];

export const DEFAULT_UNIT = allUnits.px;

/**
 * A 'unit' used to indicate that the value should be treated as custom CSS.
 * Used to support complex values like `max(1.25rem, 5vh)`.
 */
export const CUSTOM_CSS_UNIT = allUnits.css;

/**
 * Handles legacy value + unit handling.
 * This component use to manage both incoming value and units separately.
 *
 * Moving forward, ideally the value should be a string that contains both
 * the value and unit, example: '10px'
 *
 * @param  value Value
 * @param  unit  Unit value
 * @param  units Units to derive from.
 * @return The extracted number and unit.
 */
export function getParsedValue(
	value: Value,
	unit?: string,
	units?: WPUnitControlUnitList
): [ Value, string | undefined ] {
	if ( unit === CUSTOM_CSS_UNIT.value ) {
		// If this is custom CSS, we do not need to parse anything
		// out of the value.
		return [ value, unit ];
	}

	const initialValue = unit ? `${ value }${ unit }` : value;
	return parseUnit( initialValue, units );
}

/**
 * Checks if units are defined.
 *
 * @param  units Units to check.
 * @return Whether units are defined.
 */
export function hasUnits( units: WPUnitControlUnitList ): boolean {
	return Array.isArray( units ) && !! units.length;
}

/**
 * Determines whether custom CSS is supported
 * by checking for the presence of the CSS_CUSTOM_UNIT.
 *
 * @param units Units to check.
 * @return Whether custom CSS is supported.
 */
export function supportsCustomCSS( units: WPUnitControlUnitList ): boolean {
	return (
		units &&
		!! units.find( ( item ) => item.value === CUSTOM_CSS_UNIT.value )
	);
}

/**
 * Parses a number and unit from a value.
 *
 * @param  initialValue Value to parse
 * @param  units        Units to derive from.
 * @return The extracted number and unit.
 */
export function parseUnit(
	initialValue: Value | undefined,
	units: WPUnitControlUnitList = ALL_CSS_UNITS
): [ Value, string | undefined ] {
	const unit = matchUnit( initialValue, units );

	const value = String( initialValue ).trim();
	let num: Value = parseFloat( value );
	if ( isNaN( num ) ) {
		// A value may be non-numeric if the value is empty,
		// or if it contains a unit but no number. Otherwise,
		// arbitrary strings should be considered custom CSS if
		// the CSS_CUSTOM_UNIT is supported, or cleared if not.
		if ( !! initialValue && value !== unit && supportsCustomCSS( units ) ) {
			return [ value, CUSTOM_CSS_UNIT.value ];
		}
		num = '';
	}

	return [ num, unit ];
}

/**
 * Parses a unit from a value.
 *
 * @param initialValue Value to parse
 * @param units        Units to derive from.
 * @return The extracted unit.
 */
function matchUnit(
	initialValue: Value | undefined,
	units: WPUnitControlUnitList = ALL_CSS_UNITS
): string | undefined {
	const value = String( initialValue ).trim();
	const unitMatch = value.match( /[\d.\-\+]*\s*(.*)/ );

	let unit: string | undefined =
		unitMatch?.[ 1 ] !== undefined ? unitMatch[ 1 ] : '';
	unit = unit.toLowerCase();

	if ( hasUnits( units ) && units !== false ) {
		const match = units.find( ( item ) => item.value === unit );
		return match?.value;
	}

	return DEFAULT_UNIT.value;
}

/**
 * Parses a number and unit from a value. Validates parsed value, using fallback
 * value if invalid.
 *
 * @param  next          The next value.
 * @param  units         Units to derive from.
 * @param  fallbackValue The fallback value.
 * @param  fallbackUnit  The fallback value.
 * @return The extracted value and unit.
 */
export function getValidParsedUnit(
	next: Value | undefined,
	units: WPUnitControlUnitList,
	fallbackValue: Value,
	fallbackUnit: string | undefined
): [ Value, string | undefined ] {
	const [ parsedValue, parsedUnit ] = parseUnit( next, units );
	let baseValue = parsedValue;
	let baseUnit: string | undefined;

	if ( parsedUnit === CUSTOM_CSS_UNIT.value ) {
		return [ parsedValue, parsedUnit ];
	}

	// The parsed value from `parseUnit` should now be either a
	// real number or an empty string. If not, use the fallback value.
	if ( ! Number.isFinite( parsedValue ) || parsedValue === '' ) {
		baseValue = fallbackValue;
	}

	baseUnit = parsedUnit || fallbackUnit;

	/**
	 * If no unit is found, attempt to use the first value from the collection
	 * of units as a default fallback.
	 */
	if ( Array.isArray( units ) && hasUnits( units ) && ! baseUnit ) {
		baseUnit = units[ 0 ]?.value;
	}

	return [ baseValue, baseUnit ];
}

/**
 * Takes a value and unit and produces a valid combined value+unit string.
 * Validation ensures that the special CUSTOM_CSS unit is not appended, and
 * that non-numeric values are not combined with a non-custom unit.
 *
 * @param  initialValue The value.
 * @param  unit         The unit to append.
 * @return A string describing both value and unit.
 */
export function getValidValueWithUnit(
	initialValue: Value | undefined,
	unit: string | undefined
): string {
	// The CSS_CUSTOM_UNIT should not be appended to the end of custom CSS.
	if ( unit === CUSTOM_CSS_UNIT.value ) {
		return String( initialValue );
	}

	const value = String( initialValue ).trim();
	if ( isNaN( parseFloat( value ) ) ) {
		return '';
	}
	return `${ value }${ unit }`;
}

/**
 * Takes a unit value and finds the matching accessibility label for the
 * unit abbreviation.
 *
 * @param  unit Unit value (example: px)
 * @return a11y label for the unit abbreviation
 */
export function parseA11yLabelForUnit( unit: string ): string | undefined {
	const match = ALL_CSS_UNITS.find( ( item ) => item.value === unit );
	return match?.a11yLabel ? match?.a11yLabel : match?.value;
}

/**
 * Filters available units based on values defined by the unit setting/property.
 *
 * @param  unitSetting Collection of preferred unit value strings.
 * @param  units       Collection of available unit objects.
 *
 * @return Filtered units based on settings.
 */
export function filterUnitsWithSettings(
	unitSetting: Array< string > = [],
	units: WPUnitControlUnitList
): Array< WPUnitControlUnit > {
	return Array.isArray( units )
		? units.filter( ( unit ) => {
				return unitSetting.includes( unit.value );
		  } )
		: [];
}

/**
 * Custom hook to retrieve and consolidate units setting from add_theme_support().
 * TODO: ideally this hook shouldn't be needed
 * https://github.com/WordPress/gutenberg/pull/31822#discussion_r633280823
 *
 * @param  args                An object containing units, settingPath & defaultUnits.
 * @param  args.units          Collection of all potentially available units.
 * @param  args.availableUnits Collection of unit value strings for filtering available units.
 * @param  args.defaultValues  Collection of default values for defined units. Example: { px: '350', em: '15' }.
 *
 * @return Filtered units based on settings.
 */
export const useCustomUnits = ( {
	units,
	availableUnits,
	defaultValues,
}: {
	units?: WPUnitControlUnitList;
	availableUnits?: Array< string >;
	defaultValues: Record< string, Value >;
} ): WPUnitControlUnitList => {
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

/**
 * Get available units with the unit for the currently selected value
 * prepended if it is not available in the list of units.
 *
 * This is useful to ensure that the current value's unit is always
 * accurately displayed in the UI, even if the intention is to hide
 * the availability of that unit.
 *
 * @param  currentValue Selected value to parse.
 * @param  legacyUnit   Legacy unit value, if currentValue needs it appended.
 * @param  units        List of available units.
 *
 * @return A collection of units containing the unit for the current value.
 */
export function getUnitsWithCurrentUnit(
	currentValue: Value,
	legacyUnit: string | undefined,
	units: WPUnitControlUnitList = ALL_CSS_UNITS
): WPUnitControlUnitList {
	if ( ! Array.isArray( units ) ) {
		return units;
	}

	const unitsWithCurrentUnit = [ ...units ];

	// The Custom CSS unit is not supported when using legacy units. This
	// is to prevent attempting to save string CSS values into number type
	// value attributes.
	const customUnit = unitsWithCurrentUnit.findIndex(
		( unit ) => unit.value === CUSTOM_CSS_UNIT.value
	);
	if ( !! legacyUnit && customUnit ) {
		unitsWithCurrentUnit.splice( customUnit );
	}

	const currentUnit = matchUnit(
		legacyUnit ? `${ currentValue }${ legacyUnit }` : currentValue,
		ALL_CSS_UNITS
	);

	if (
		currentUnit &&
		! unitsWithCurrentUnit.some( ( unit ) => unit.value === currentUnit )
	) {
		if ( allUnits[ currentUnit ] ) {
			unitsWithCurrentUnit.unshift( allUnits[ currentUnit ] );
		}
	}

	return unitsWithCurrentUnit;
}
