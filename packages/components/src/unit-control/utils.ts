/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { Platform } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { WPUnitControlUnit } from './types';

const isWeb = Platform.OS === 'web';

const allUnits: Record< string, WPUnitControlUnit > = {
	px: {
		value: 'px',
		label: isWeb ? 'px' : __( 'Pixels (px)' ),
		default: undefined,
		a11yLabel: __( 'Pixels (px)' ),
		step: 1,
	},
	'%': {
		value: '%',
		label: isWeb ? '%' : __( 'Percentage (%)' ),
		default: undefined,
		a11yLabel: __( 'Percent (%)' ),
		step: 0.1,
	},
	em: {
		value: 'em',
		label: isWeb ? 'em' : __( 'Relative to parent font size (em)' ),
		default: undefined,
		a11yLabel: _x( 'ems', 'Relative to parent font size (em)' ),
		step: 0.01,
	},
	rem: {
		value: 'rem',
		label: isWeb ? 'rem' : __( 'Relative to root font size (rem)' ),
		default: undefined,
		a11yLabel: _x( 'rems', 'Relative to root font size (rem)' ),
		step: 0.01,
	},
	vw: {
		value: 'vw',
		label: isWeb ? 'vw' : __( 'Viewport width (vw)' ),
		default: undefined,
		a11yLabel: __( 'Viewport width (vw)' ),
		step: 0.1,
	},
	vh: {
		value: 'vh',
		label: isWeb ? 'vh' : __( 'Viewport height (vh)' ),
		default: undefined,
		a11yLabel: __( 'Viewport height (vh)' ),
		step: 0.1,
	},
	vmin: {
		value: 'vmin',
		label: isWeb ? 'vmin' : __( 'Viewport smallest dimension (vmin)' ),
		default: undefined,
		a11yLabel: __( 'Viewport smallest dimension (vmin)' ),
		step: 0.1,
	},
	vmax: {
		value: 'vmax',
		label: isWeb ? 'vmax' : __( 'Viewport largest dimension (vmax)' ),
		default: undefined,
		a11yLabel: __( 'Viewport largest dimension (vmax)' ),
		step: 0.1,
	},
	ch: {
		value: 'ch',
		label: isWeb ? 'ch' : __( 'Width of the zero (0) character (ch)' ),
		default: undefined,
		a11yLabel: __( 'Width of the zero (0) character (ch)' ),
		step: 0.01,
	},
	ex: {
		value: 'ex',
		label: isWeb ? 'ex' : __( 'x-height of the font (ex)' ),
		default: undefined,
		a11yLabel: __( 'x-height of the font (ex)' ),
		step: 0.01,
	},
	cm: {
		value: 'cm',
		label: isWeb ? 'cm' : __( 'Centimeters (cm)' ),
		default: undefined,
		a11yLabel: __( 'Centimeters (cm)' ),
		step: 0.001,
	},
	mm: {
		value: 'mm',
		label: isWeb ? 'mm' : __( 'Millimeters (mm)' ),
		default: undefined,
		a11yLabel: __( 'Millimeters (mm)' ),
		step: 0.1,
	},
	in: {
		value: 'in',
		label: isWeb ? 'in' : __( 'Inches (in)' ),
		default: undefined,
		a11yLabel: __( 'Inches (in)' ),
		step: 0.001,
	},
	pc: {
		value: 'pc',
		label: isWeb ? 'pc' : __( 'Picas (pc)' ),
		default: undefined,
		a11yLabel: __( 'Picas (pc)' ),
		step: 1,
	},
	pt: {
		value: 'pt',
		label: isWeb ? 'pt' : __( 'Points (pt)' ),
		default: undefined,
		a11yLabel: __( 'Points (pt)' ),
		step: 1,
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
 * Handles legacy value + unit handling.
 * This component use to manage both incoming value and units separately.
 *
 * Moving forward, ideally the value should be a string that contains both
 * the value and unit, example: '10px'
 *
 * @param  rawValue     The raw value as a string (may or may not contain the unit)
 * @param  fallbackUnit The unit used as a fallback, if not unit is detected in the `value`
 * @param  allowedUnits Units to derive from.
 * @return The extracted quantity and unit. The quantity can be `undefined` in case the raw value could not be parsed to a number correctly. The unit can be `undefined` in case the unit parsed from the raw value could not be matched against the list of allowed units.
 */
export function getParsedQuantityAndUnit(
	rawValue: string | number,
	fallbackUnit?: string,
	allowedUnits?: WPUnitControlUnit[]
): [ number | undefined, string | undefined ] {
	const initialValue = fallbackUnit
		? `${ rawValue }${ fallbackUnit }`
		: rawValue;

	return parseQuantityAndUnitFromRawValue( initialValue, allowedUnits );
}

/**
 * Checks if units are defined.
 *
 * @param  units List of units.
 * @return Whether the list actually contains any units.
 */
export function hasUnits( units?: WPUnitControlUnit[] ): boolean {
	return !! units?.length;
}

/**
 * Parses a quantity and unit from a raw string value, given a list of allowed
 * units and otherwise falling back to the default unit.
 *
 * @param  rawValue     The raw value as a string (may or may not contain the unit)
 * @param  allowedUnits Units to derive from.
 * @return The extracted quantity and unit. The quantity can be `undefined` in case the raw value could not be parsed to a number correctly. The unit can be `undefined` in case the unit parsed from the raw value could not be matched against the list of allowed units.
 */
export function parseQuantityAndUnitFromRawValue(
	rawValue?: string | number,
	allowedUnits: WPUnitControlUnit[] = ALL_CSS_UNITS
): [ number | undefined, string | undefined ] {
	let trimmedValue;
	let valueToReturn;

	if ( typeof rawValue !== 'undefined' ) {
		trimmedValue = `${ rawValue }`.trim();
		const parsedQuantity = parseFloat( trimmedValue );
		valueToReturn =
			isNaN( parsedQuantity ) || ! isFinite( parsedQuantity )
				? undefined
				: parsedQuantity;
	}

	const unitMatch = trimmedValue?.match( /[\d.\-\+]*\s*(.*)/ );
	const matchedUnit =
		typeof unitMatch?.[ 1 ] !== 'undefined'
			? unitMatch[ 1 ].toLowerCase()
			: undefined;
	let unitToReturn: string | undefined;
	if ( hasUnits( allowedUnits ) ) {
		const match = allowedUnits.find(
			( item ) => item.value === matchedUnit
		);
		unitToReturn = match?.value;
	} else {
		unitToReturn = DEFAULT_UNIT.value;
	}

	return [ valueToReturn, unitToReturn ];
}

/**
 * Parses quantity and unit from a raw value. Validates parsed value, using fallback
 * value if invalid.
 *
 * @param  rawValue         The next value.
 * @param  allowedUnits     Units to derive from.
 * @param  fallbackQuantity The fallback quantity, used in case it's not possible to parse a valid quantity from the raw value.
 * @param  fallbackUnit     The fallback unit, used in case it's not possible to parse a valid unit from the raw value.
 * @return The extracted quantity and unit. The quantity can be `undefined` in case the raw value could not be parsed to a number correctly, and the `fallbackQuantity` was also `undefined`. The unit can be `undefined` only if the unit parsed from the raw value could not be matched against the list of allowed units, the `fallbackQuantity` is also `undefined` and the list of `allowedUnits` is passed empty.
 */
export function getValidParsedQuantityAndUnit(
	rawValue: string | number,
	allowedUnits: WPUnitControlUnit[],
	fallbackQuantity?: number,
	fallbackUnit?: string
): [ number | undefined, string | undefined ] {
	const [ parsedQuantity, parsedUnit ] = parseQuantityAndUnitFromRawValue(
		rawValue,
		allowedUnits
	);

	// The parsed value from `parseQuantityAndUnitFromRawValue` should now be
	// either a real number or undefined. If not, use the fallback value.
	const quantityToReturn = parsedQuantity ?? fallbackQuantity;

	// If no unit is parsed from the raw value, or if the fallback unit is not
	// defined, use the first value from the list of allowed units as fallback.
	let unitToReturn = parsedUnit || fallbackUnit;

	if ( ! unitToReturn && hasUnits( allowedUnits ) ) {
		unitToReturn = allowedUnits[ 0 ].value;
	}

	return [ quantityToReturn, unitToReturn ];
}

/**
 * Takes a unit value and finds the matching accessibility label for the
 * unit abbreviation.
 *
 * @param  unit Unit value (example: `px`)
 * @return a11y label for the unit abbreviation
 */
export function getAccessibleLabelForUnit( unit: string ): string | undefined {
	const match = ALL_CSS_UNITS.find( ( item ) => item.value === unit );
	return match?.a11yLabel ? match?.a11yLabel : match?.value;
}

/**
 * Filters available units based on values defined a list of allowed unit values.
 *
 * @param  allowedUnitValues Collection of allowed unit value strings.
 * @param  availableUnits    Collection of available unit objects.
 * @return Filtered units.
 */
export function filterUnitsWithSettings(
	allowedUnitValues: string[] = [],
	availableUnits: WPUnitControlUnit[]
): WPUnitControlUnit[] {
	return availableUnits.filter( ( unit ) =>
		allowedUnitValues.includes( unit.value )
	);
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
 * @return Filtered units of units, with their default values updated following the `defaultValues` argument's property.
 */
export const useCustomUnits = ( {
	units = ALL_CSS_UNITS,
	availableUnits = [],
	defaultValues,
}: {
	units?: WPUnitControlUnit[];
	availableUnits?: string[];
	defaultValues: Record< string, number >;
} ): WPUnitControlUnit[] => {
	const customUnitsToReturn = filterUnitsWithSettings(
		availableUnits,
		units
	);

	if ( defaultValues ) {
		customUnitsToReturn.forEach( ( unit, i ) => {
			if ( defaultValues[ unit.value ] ) {
				customUnitsToReturn[ i ].default = defaultValues[ unit.value ];
			}
		} );
	}

	return customUnitsToReturn;
};

/**
 * Get available units with the unit for the currently selected value
 * prepended if it is not available in the list of units.
 *
 * This is useful to ensure that the current value's unit is always
 * accurately displayed in the UI, even if the intention is to hide
 * the availability of that unit.
 *
 * @param  rawValue   Selected value to parse.
 * @param  legacyUnit Legacy unit value, if rawValue needs it appended.
 * @param  units      List of available units.
 *
 * @return A collection of units containing the unit for the current value.
 */
export function getUnitsWithCurrentUnit(
	rawValue: string | number,
	legacyUnit?: string,
	units: WPUnitControlUnit[] = ALL_CSS_UNITS
): WPUnitControlUnit[] {
	const unitsToReturn = [ ...units ];
	const [ , currentUnit ] = getParsedQuantityAndUnit(
		rawValue,
		legacyUnit,
		ALL_CSS_UNITS
	);

	if (
		currentUnit &&
		! unitsToReturn.some( ( unit ) => unit.value === currentUnit )
	) {
		if ( allUnits[ currentUnit ] ) {
			unitsToReturn.unshift( allUnits[ currentUnit ] );
		}
	}

	return unitsToReturn;
}
