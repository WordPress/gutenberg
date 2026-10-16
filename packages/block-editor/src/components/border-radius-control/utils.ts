import { __experimentalParseQuantityAndUnitFromRawValue as parseQuantityAndUnitFromRawValue } from '@wordpress/components';
import {
	getCustomValueFromPreset,
	isValuePreset,
} from '../preset-input-control/utils';
import type { Preset } from '../preset-input-control/types';
import type {
	BorderRadiusCorner,
	BorderRadiusConvertedValues,
	BorderRadiusUnits,
	BorderRadiusValues,
} from './types';

const BORDER_RADIUS_PRESET_TYPE = 'border-radius';

/**
 * Gets the (non-undefined) item with the highest occurrence within an array
 * Based in part on: https://stackoverflow.com/a/20762713
 *
 * Undefined values are always sorted to the end by `sort`, so this function
 * returns the first element, to always prioritize real values over undefined
 * values.
 *
 * See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort#description
 *
 * @param inputArray Array of items to check.
 * @return The item with the most occurrences.
 */
export function mode< T >( inputArray: T[] ): T | undefined {
	const arr = [ ...inputArray ];
	return arr
		.sort(
			( a, b ) =>
				inputArray.filter( ( v ) => v === b ).length -
				inputArray.filter( ( v ) => v === a ).length
		)
		.shift();
}

/**
 * Returns the most common CSS unit from the current CSS unit selections.
 *
 * - If a single flat border radius is set, its unit will be used
 * - If individual corner selections, the most common of those will be used
 * - Failing any unit selections a default of 'px' is returned.
 *
 * @param selectedUnits Unit selections for flat radius & each corner.
 * @return Most common CSS unit from current selections. Default: `px`.
 */
export function getAllUnit( selectedUnits: BorderRadiusUnits = {} ): string {
	const { flat, ...cornerUnits } = selectedUnits;
	return (
		flat || mode( Object.values( cornerUnits ).filter( Boolean ) ) || 'px'
	);
}

/**
 * Gets the 'all' input value and unit from values data.
 *
 * @param values Radius values.
 * @return A value + unit for the 'all' input.
 */
export function getAllValue(
	values: BorderRadiusValues = {}
): string | undefined {
	/**
	 * Border radius support was originally a single pixel value.
	 *
	 * To maintain backwards compatibility treat this case as the all value.
	 */
	if ( typeof values === 'string' ) {
		return values;
	}

	const parsedQuantitiesAndUnits = Object.values( values ).map( ( value ) => {
		const newValue = parseQuantityAndUnitFromRawValue( value );
		if ( typeof value === 'string' && newValue[ 0 ] === undefined ) {
			return [ value, '' ];
		}
		return newValue;
	} );

	const allValues = parsedQuantitiesAndUnits.map(
		( value ) => value[ 0 ] ?? ''
	);
	const allUnits = parsedQuantitiesAndUnits.map( ( value ) => value[ 1 ] );

	const value = allValues.every( ( v ) => v === allValues[ 0 ] )
		? allValues[ 0 ]
		: '';
	const unit = mode( allUnits );

	const allValue =
		value === 0 || value ? `${ value }${ unit || '' }` : undefined;

	return allValue;
}

/**
 * Checks to determine if values are mixed.
 *
 * @param values Radius values.
 * @return Whether values are mixed.
 */
export function hasMixedValues( values: BorderRadiusValues = {} ): boolean {
	if ( typeof values === 'string' ) {
		return false;
	}

	if ( ! values || typeof values !== 'object' ) {
		return false;
	}

	const cornerValues = Object.values( values );

	if ( cornerValues.length === 0 ) {
		return false;
	}

	const firstValue = cornerValues[ 0 ];

	// Check if all values are exactly the same (including undefined)
	const allSame = cornerValues.every( ( value ) => value === firstValue );

	return ! allSame;
}

/**
 * Checks to determine if values are defined.
 *
 * @param values Radius values.
 * @return Whether values are mixed.
 */
export function hasDefinedValues( values?: BorderRadiusValues ): boolean {
	if ( ! values ) {
		return false;
	}

	// A string value represents a shorthand value.
	if ( typeof values === 'string' ) {
		return true;
	}

	// An object represents longhand border radius values, if any are set
	// flag values as being defined.
	const filteredValues = Object.values( values ).filter( ( value ) => {
		return !! value || value === 0;
	} );

	return !! filteredValues.length;
}

/**
 * Converts a control value into a preset value.
 *
 * @param controlValue to convert to preset value.
 * @param controlType  Type of control
 * @param presets      Array of current radius preset value objects.
 *
 * @return The custom value for use in Range control.
 */
export function getPresetValueFromControlValue(
	controlValue: number,
	controlType: string,
	presets: Preset[]
): string | undefined {
	// `parseInt` reads a number as its string form.
	const size = parseInt( controlValue as unknown as string, 10 );
	if ( controlType === 'selectList' ) {
		if ( size === 0 ) {
			return undefined;
		}
	} else if ( size === 0 ) {
		return '0';
	}

	return `var:preset|border-radius|${ presets[ controlValue ]?.slug }`;
}

/**
 * Converts all preset values in a values object to their custom equivalents.
 *
 * @param values  Values object to convert
 * @param presets Array of current border radius preset objects
 *
 * @return Values with presets converted to custom values
 */
export function convertPresetsToCustomValues(
	values: BorderRadiusValues | undefined,
	presets: Preset[]
): BorderRadiusValues | BorderRadiusConvertedValues | undefined {
	if ( ! values || typeof values !== 'object' ) {
		return values;
	}

	const converted: BorderRadiusConvertedValues = {};
	// The keys of corner values are corners.
	( Object.keys( values ) as BorderRadiusCorner[] ).forEach( ( key ) => {
		const value = values[ key ];
		if (
			// `isValuePreset` reads a stored number as no preset.
			isValuePreset(
				value as string | undefined,
				BORDER_RADIUS_PRESET_TYPE
			)
		) {
			const customValue = getCustomValueFromPreset(
				// A preset value is a string.
				value as string,
				presets,
				BORDER_RADIUS_PRESET_TYPE
			);
			converted[ key ] = customValue !== undefined ? customValue : value;
		} else {
			converted[ key ] = value;
		}
	} );

	return converted;
}
