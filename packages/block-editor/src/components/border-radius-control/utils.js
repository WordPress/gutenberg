/**
 * WordPress dependencies
 */
import { __experimentalParseQuantityAndUnitFromRawValue as parseQuantityAndUnitFromRawValue } from '@wordpress/components';

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
 * Returns the most common CSS unit from the current CSS unit selections.
 *
 * - If a single flat border radius is set, its unit will be used
 * - If individual corner selections, the most common of those will be used
 * - Failing any unit selections a default of 'px' is returned.
 *
 * @param {Object} selectedUnits Unit selections for flat radius & each corner.
 * @return {string} Most common CSS unit from current selections. Default: `px`.
 */
export function getAllUnit( selectedUnits = {} ) {
	const { flat, ...cornerUnits } = selectedUnits;
	return (
		flat || mode( Object.values( cornerUnits ).filter( Boolean ) ) || 'px'
	);
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
 * Checks is given value is a radius preset.
 *
 * @param {string} value Value to check
 *
 * @return {boolean} Return true if value is string in format var:preset|border-radius|.
 */
export function isValuePreset( value ) {
	if ( ! value?.includes ) {
		return false;
	}
	return value === '0' || value.includes( 'var:preset|border-radius|' );
}

/**
 * Returns the slug section of the given preset string.
 *
 * @param {string} value Value to extract slug from.
 *
 * @return {string|undefined} The int value of the slug from given preset.
 */
export function getPresetSlug( value ) {
	if ( ! value ) {
		return;
	}

	if ( value === '0' || value === 'default' ) {
		return value;
	}

	const slug = value.match( /var:preset\|border-radius\|(.+)/ );

	return slug ? slug[ 1 ] : undefined;
}

/**
 * Converts radius preset value into a Range component value .
 *
 * @param {string} presetValue Value to convert to Range value.
 * @param {Array}  presets     Array of current radius preset value objects.
 *
 * @return {number} The int value for use in Range control.
 */
export function getSliderValueFromPreset( presetValue, presets ) {
	if ( presetValue === undefined ) {
		return 0;
	}
	const slug =
		parseFloat( presetValue, 10 ) === 0
			? '0'
			: getPresetSlug( presetValue );
	const sliderValue = presets.findIndex( ( size ) => {
		return String( size.slug ) === slug;
	} );

	// Returning NaN rather than undefined as undefined makes range control thumb sit in center
	return sliderValue !== -1 ? sliderValue : NaN;
}

/**
 * Converts a preset into a custom value.
 *
 * @param {string} value   Value to convert
 * @param {Array}  presets Array of the current radius preset objects
 *
 * @return {string} Mapping of the radius preset to its equivalent custom value.
 */
export function getCustomValueFromPreset( value, presets ) {
	if ( ! isValuePreset( value ) ) {
		return value;
	}

	const slug = parseFloat( value, 10 ) === 0 ? '0' : getPresetSlug( value );
	const radiusSize = presets.find( ( size ) => String( size.slug ) === slug );

	return radiusSize?.size;
}

/**
 * Converts a control value into a preset value.
 *
 * @param {number} controlValue to convert to preset value.
 * @param {string} controlType  Type of control
 * @param {Array}  presets      Array of current radius preset value objects.
 *
 * @return {string} The custom value for use in Range control.
 */
export function getPresetValueFromControlValue(
	controlValue,
	controlType,
	presets
) {
	const size = parseInt( controlValue, 10 );
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
 * Converts a custom value to preset value if one can be found.
 *
 * Returns value as-is if no match is found.
 *
 * @param {string} value   Value to convert
 * @param {Array}  presets Array of the current border radius preset objects
 *
 * @return {string} The preset value if it can be found.
 */
export function getPresetValueFromCustomValue( value, presets ) {
	// Return value as-is if it is undefined or is already a preset, or '0';
	if ( ! value || isValuePreset( value ) || value === '0' ) {
		return value;
	}

	const spacingMatch = presets.find(
		( size ) => String( size.size ) === String( value )
	);

	if ( spacingMatch?.slug ) {
		return `var:preset|border-radius|${ spacingMatch.slug }`;
	}

	return value;
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
		if ( isValuePreset( value ) ) {
			const customValue = getCustomValueFromPreset( value, presets );
			converted[ key ] = customValue !== undefined ? customValue : value;
		} else {
			converted[ key ] = value;
		}
	} );

	return converted;
}
