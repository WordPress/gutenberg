/**
 * WordPress dependencies
 */
import { __experimentalParseQuantityAndUnitFromRawValue as parseQuantityAndUnitFromRawValue } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { isValuePreset, getPresetSlug } from '../preset-input-control/utils';

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
 * @param {Array<any>} inputArray Array of items to check.
 * @return {any}                  The item with the most occurrences.
 */
export function mode( inputArray ) {
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
 * Gets the 'all' input value and unit from values data.
 *
 * @param {Object|string} values Radius values.
 * @return {string}              A value + unit for the 'all' input.
 */
export function getAllValue( values = {} ) {
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
 * @param {Object} values Radius values.
 * @return {boolean}      Whether values are mixed.
 */
export function hasMixedValues( values = {} ) {
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
 * @param {Object} values Radius values.
 * @return {boolean}      Whether values are mixed.
 */
export function hasDefinedValues( values ) {
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
 * Converts all preset values in a values object to their custom equivalents.
 *
 * @param {Object} values  Values object to convert
 * @param {Array}  presets Array of current border radius preset objects
 *
 * @return {Object} Values with presets converted to custom values
 */
export function convertPresetsToCustomValues( values, presets ) {
	if ( ! values || typeof values !== 'object' ) {
		return values;
	}

	const converted = {};
	Object.keys( values ).forEach( ( key ) => {
		const value = values[ key ];
		if ( isValuePreset( value, 'border-radius' ) ) {
			const customValue = presets.find(
				( preset ) =>
					preset.slug === getPresetSlug( value, 'border-radius' )
			)?.size;
			converted[ key ] = customValue !== undefined ? customValue : value;
		} else {
			converted[ key ] = value;
		}
	} );

	return converted;
}
