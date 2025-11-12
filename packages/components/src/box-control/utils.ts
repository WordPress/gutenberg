/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type {
	BoxControlInputControlProps,
	BoxControlProps,
	BoxControlValue,
	CustomValueUnits,
	Preset,
} from './types';
import deprecated from '@wordpress/deprecated';

export const CUSTOM_VALUE_SETTINGS: CustomValueUnits = {
	px: { max: 300, step: 1 },
	'%': { max: 100, step: 1 },
	vw: { max: 100, step: 1 },
	vh: { max: 100, step: 1 },
	em: { max: 10, step: 0.1 },
	rm: { max: 10, step: 0.1 },
	svw: { max: 100, step: 1 },
	lvw: { max: 100, step: 1 },
	dvw: { max: 100, step: 1 },
	svh: { max: 100, step: 1 },
	lvh: { max: 100, step: 1 },
	dvh: { max: 100, step: 1 },
	vi: { max: 100, step: 1 },
	svi: { max: 100, step: 1 },
	lvi: { max: 100, step: 1 },
	dvi: { max: 100, step: 1 },
	vb: { max: 100, step: 1 },
	svb: { max: 100, step: 1 },
	lvb: { max: 100, step: 1 },
	dvb: { max: 100, step: 1 },
	vmin: { max: 100, step: 1 },
	svmin: { max: 100, step: 1 },
	lvmin: { max: 100, step: 1 },
	dvmin: { max: 100, step: 1 },
	vmax: { max: 100, step: 1 },
	svmax: { max: 100, step: 1 },
	lvmax: { max: 100, step: 1 },
	dvmax: { max: 100, step: 1 },
};

export const LABELS = {
	all: __( 'All sides' ),
	top: __( 'Top side' ),
	bottom: __( 'Bottom side' ),
	left: __( 'Left side' ),
	right: __( 'Right side' ),
	vertical: __( 'Top and bottom sides' ),
	horizontal: __( 'Left and right sides' ),
};

export const DEFAULT_VALUES = {
	top: undefined,
	right: undefined,
	bottom: undefined,
	left: undefined,
};

export const ALL_SIDES = [ 'top', 'right', 'bottom', 'left' ] as const;

/**
 * Gets an items with the most occurrence within an array
 * https://stackoverflow.com/a/20762713
 *
 * @param arr Array of items to check.
 * @return The item with the most occurrences.
 */
function mode< T >( arr: T[] ) {
	return arr
		.sort(
			( a, b ) =>
				arr.filter( ( v ) => v === a ).length -
				arr.filter( ( v ) => v === b ).length
		)
		.pop();
}

/**
 * Gets the merged input value and unit from values data.
 *
 * @param values         Box values.
 * @param availableSides Available box sides to evaluate.
 *
 * @return A value + unit for the 'all' input.
 */
export function getMergedValue(
	values: BoxControlValue = {},
	availableSides: BoxControlProps[ 'sides' ] = ALL_SIDES
) {
	const sides = normalizeSides( availableSides );
	if (
		sides.every(
			( side: keyof BoxControlValue ) =>
				values[ side ] === values[ sides[ 0 ] ]
		)
	) {
		return values[ sides[ 0 ] ];
	}

	return undefined;
}

/**
 * Checks if the values are mixed.
 *
 * @param values         Box values.
 * @param availableSides Available box sides to evaluate.
 * @return Whether the values are mixed.
 */
export function isValueMixed(
	values: BoxControlValue = {},
	availableSides: BoxControlProps[ 'sides' ] = ALL_SIDES
) {
	const sides = normalizeSides( availableSides );
	return sides.some(
		( side: keyof BoxControlValue ) =>
			values[ side ] !== values[ sides[ 0 ] ]
	);
}

/**
 * Determine the most common unit selection to use as a fallback option.
 *
 * @param selectedUnits Current unit selections for individual sides.
 * @return  Most common unit selection.
 */
export function getAllUnitFallback( selectedUnits?: BoxControlValue ) {
	if ( ! selectedUnits || typeof selectedUnits !== 'object' ) {
		return undefined;
	}

	const filteredUnits = Object.values( selectedUnits ).filter( Boolean );

	return mode( filteredUnits );
}

/**
 * Checks to determine if values are defined.
 *
 * @param values Box values.
 *
 * @return  Whether values are mixed.
 */
export function isValuesDefined( values?: BoxControlValue ) {
	return (
		values &&
		Object.values( values ).filter(
			// Switching units when input is empty causes values only
			// containing units. This gives false positive on mixed values
			// unless filtered.
			( value ) => !! value && /\d/.test( value )
		).length > 0
	);
}

/**
 * Get initial selected side, factoring in whether the sides are linked,
 * and whether the vertical / horizontal directions are grouped via splitOnAxis.
 *
 * @param isLinked    Whether the box control's fields are linked.
 * @param splitOnAxis Whether splitting by horizontal or vertical axis.
 * @return The initial side.
 */
export function getInitialSide( isLinked: boolean, splitOnAxis: boolean ) {
	let initialSide: keyof typeof LABELS = 'all';

	if ( ! isLinked ) {
		initialSide = splitOnAxis ? 'vertical' : 'top';
	}

	return initialSide;
}

/**
 * Normalizes provided sides configuration to an array containing only top,
 * right, bottom and left. This essentially just maps `horizontal` or `vertical`
 * to their appropriate sides to facilitate correctly determining value for
 * all input control.
 *
 * @param sides Available sides for box control.
 * @return Normalized sides configuration.
 */
export function normalizeSides( sides: BoxControlProps[ 'sides' ] ) {
	const filteredSides: ( keyof BoxControlValue )[] = [];

	if ( ! sides?.length ) {
		return ALL_SIDES;
	}

	if ( sides.includes( 'vertical' ) ) {
		filteredSides.push( ...( [ 'top', 'bottom' ] as const ) );
	} else if ( sides.includes( 'horizontal' ) ) {
		filteredSides.push( ...( [ 'left', 'right' ] as const ) );
	} else {
		const newSides = ALL_SIDES.filter( ( side ) => sides.includes( side ) );
		filteredSides.push( ...newSides );
	}

	return filteredSides;
}

/**
 * Applies a value to an object representing top, right, bottom and left sides
 * while taking into account any custom side configuration.
 *
 * @deprecated
 *
 * @param currentValues The current values for each side.
 * @param newValue      The value to apply to the sides object.
 * @param sides         Array defining valid sides.
 *
 * @return Object containing the updated values for each side.
 */
export function applyValueToSides(
	currentValues: BoxControlValue,
	newValue?: string,
	sides?: BoxControlProps[ 'sides' ]
): BoxControlValue {
	deprecated( 'applyValueToSides', {
		since: '6.8',
		version: '7.0',
	} );
	const newValues = { ...currentValues };

	if ( sides?.length ) {
		sides.forEach( ( side ) => {
			if ( side === 'vertical' ) {
				newValues.top = newValue;
				newValues.bottom = newValue;
			} else if ( side === 'horizontal' ) {
				newValues.left = newValue;
				newValues.right = newValue;
			} else {
				newValues[ side ] = newValue;
			}
		} );
	} else {
		ALL_SIDES.forEach( ( side ) => ( newValues[ side ] = newValue ) );
	}

	return newValues;
}

/**
 * Return the allowed sides based on the sides configuration.
 *
 * @param sides Sides configuration.
 * @return Allowed sides.
 */
export function getAllowedSides(
	sides: BoxControlInputControlProps[ 'sides' ]
) {
	const allowedSides: Set< keyof BoxControlValue > = new Set(
		! sides ? ALL_SIDES : []
	);
	sides?.forEach( ( allowedSide ) => {
		if ( allowedSide === 'vertical' ) {
			allowedSides.add( 'top' );
			allowedSides.add( 'bottom' );
		} else if ( allowedSide === 'horizontal' ) {
			allowedSides.add( 'right' );
			allowedSides.add( 'left' );
		} else {
			allowedSides.add( allowedSide );
		}
	} );
	return allowedSides;
}

/**
 * Checks if a value is a preset value.
 *
 * @param value     The value to check.
 * @param presetKey The preset key to check against.
 * @return Whether the value is a preset value.
 */
export function isValuePreset( value: string, presetKey: string ) {
	return value.startsWith( `var:preset|${ presetKey }|` );
}

/**
 * Returns the index of the preset value in the presets array.
 *
 * @param value     The value to check.
 * @param presetKey The preset key to check against.
 * @param presets   The array of presets to search.
 * @return The index of the preset value in the presets array.
 */
export function getPresetIndexFromValue(
	value: string,
	presetKey: string,
	presets: Preset[]
) {
	if ( ! isValuePreset( value, presetKey ) ) {
		return undefined;
	}

	const match = value.match(
		new RegExp( `^var:preset\\|${ presetKey }\\|(.+)$` )
	);
	if ( ! match ) {
		return undefined;
	}
	const slug = match[ 1 ];
	const index = presets.findIndex( ( preset ) => {
		return preset.slug === slug;
	} );

	return index !== -1 ? index : undefined;
}

/**
 * Returns the preset value from the index.
 *
 * @param index     The index of the preset value in the presets array.
 * @param presetKey The preset key to check against.
 * @param presets   The array of presets to search.
 * @return The preset value from the index.
 */
export function getPresetValueFromIndex(
	index: number,
	presetKey: string,
	presets: Preset[]
) {
	const preset = presets[ index ];
	return `var:preset|${ presetKey }|${ preset.slug }`;
}
