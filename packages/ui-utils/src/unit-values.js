/**
 * Internal dependencies
 */
import { is } from './is';

let __styleTestNode = null;

const getComputedStyledMap = () => {
	if ( ! __styleTestNode ) {
		__styleTestNode = document.createElement( 'div' );
	}

	return __styleTestNode.style;
};

/**
 * @param {string} initialValue
 * @return {number | string | undefined}
 */
export const getCSSValue = ( initialValue ) => {
	const [ value, unit ] = parseUnitValue( initialValue );
	const next = ! unit ? value : `${ value }${ unit }`;

	return next;
};

/**
 *
 * @param {string} prop
 * @param {string} value
 * @return {boolean} Whether the value is a valid CSS value.
 */
export const isValidCSSValueForProp = ( prop, value ) => {
	if ( ! is.string( prop ) ) return true;

	const computedStyleMap = getComputedStyledMap();

	if ( is.undefined( computedStyleMap[ prop ] ) ) return true;

	// 1. Reset current style value.
	computedStyleMap[ prop ] = '';
	// 2. Cache current style value for validation (may not be an empty string).
	const current = computedStyleMap[ prop ];
	// 3. Apply next value.
	const next = getCSSValue( value );
	computedStyleMap[ prop ] = next;
	// 4. Check to see if next value was correctly applied.
	return current !== computedStyleMap[ prop ];
};

/**
 * @param {string} value
 * @return {boolean}
 */
export const isValidNumericUnitValue = ( value ) => {
	// Disallow values that contains spaces
	if ( / /g.test( value ) ) {
		return false;
	}

	// Disallow values that start with 0 that isn't a decimal.
	if ( /^0[0-9]/g.test( value ) ) {
		return false;
	}

	// Disallow values where the last character is a symbol
	if ( /[-!$^&*()_+|~=`{}[\]:";'<>?,./]$/g.test( value ) ) {
		return false;
	}

	// Allow numerics.
	if ( is.numeric( value ) ) return true;

	// Disallow values that do not start with alphanumeric characters.
	if ( /^\W/g.test( value ) ) {
		// Allow for negative numbers, e.g. -1
		if ( ! /^-\w/g.test( value ) ) {
			return false;
		}
	}

	// Disallow values where a dot follows a character, e.g. 1.p
	if ( /\.[a-zA-Z]/g.test( value ) ) {
		return false;
	}

	// Disable values where there are multiple . chracters.
	if ( /\d+\.\d+\.\d+/g.test( value ) ) {
		return false;
	}

	return true;
};

/**
 * Handles legacy value + unit handling.
 * This component use to manage both incoming value and units separately.
 *
 * Moving forward, ideally the value should be a string that contains both
 * the value and unit, example: '10px'
 *
 * @param {number|string} value Value
 * @param {string} unit Unit value
 * @return {ReturnType<parseUnitValue>} The extracted number and unit.
 */
export function getParsedValue( value, unit ) {
	const initialValue = unit ? `${ value }${ unit }` : value;

	return parseUnitValue( initialValue );
}

/**
 * Checks if units are defined.
 *
 * @param {any} units Units to check.
 * @return {boolean} Whether units are defined.
 */
export function hasUnits( units ) {
	return ! is.empty( units ) && units.length > 1 && units !== false;
}

/**
 * Parses a number and unit from a value.
 *
 * @param {string | number} initialValue Value to parse
 * @return {[number | string | undefined, string | undefined]} The extracted number and unit.
 */
export function parseUnitValue( initialValue ) {
	if ( ! is.defined( initialValue ) ) {
		return [ undefined, undefined ];
	}

	const value = String( initialValue ).trim();

	/** @type {string | number} */
	let num = parseFloat( value );
	num = is.nan( num ) ? '' : num;

	const matched = value.match( /[\d.\-+]*\s*(.*)/ );
	if ( ! matched ) {
		return [ undefined, undefined ];
	}
	const [ , unitMatch ] = matched;

	let unit = is.defined( unitMatch ) ? unitMatch : '';
	unit = unit.toLowerCase();

	return [ num, unit ];
}

/**
 *
 * @param {string | number} value
 * @param {string} [unit]
 * @return {string}
 */
export function createUnitValue( value, unit ) {
	if ( ! unit || ! is.string( unit ) || ! is.numeric( value ) ) {
		return value.toString();
	}

	return `${ value }${ unit }`;
}
