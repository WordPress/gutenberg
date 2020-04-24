/**
 * External dependencies
 */
import { isEmpty } from 'lodash';

export const CSS_UNITS = [
	{ value: 'px', label: 'px', default: 0 },
	{ value: '%', label: '%', default: 10 },
	{ value: 'em', label: 'em', default: 0 },
	{ value: 'rem', label: 'rem', default: 0 },
	{ value: 'vw', label: 'vw', default: 10 },
	{ value: 'vh', label: 'vh', default: 10 },
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
export function parseUnit( initialValue, units = CSS_UNITS ) {
	const output = [ 0, '' ];
	const value = String( initialValue ).trim();

	const num = parseFloat( value, 10 );
	const unitMatch = value.match( /[\d.\-\+]*\s*(.*)/ )[ 1 ];

	let unit = unitMatch !== 'undefined' ? unitMatch : '';
	unit = unit.toLowerCase();

	if ( hasUnits( units ) ) {
		const match = units.find( ( item ) => item.value === unit );
		unit = match?.value;
	}

	output[ 0 ] = isNaN( num ) ? '' : num;
	output[ 1 ] = unit;

	return output;
}
