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
 * @param {string} type Proptype.
 * @return {Array<string>} The extracted number and unit.
 */
export function getParsedValue( value, unit, units, type ) {
	const initialValue = unit ? `${ value }${ unit }` : value;

	if ( value && type && getCSSValues( value, type ) ) {
		return getCSSValues( value, type );
	}

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
 * @param {string?} type The styleType.
 * @return {Array<string>} The extracted number and unit.
 */
export function getValidParsedUnit(
	next,
	units,
	fallbackValue,
	fallbackUnit,
	type
) {
	if ( ! parseUnit( next, units )[ 0 ] ) {
		return (
			( next && type && getCSSValues( next, type ) ) || [
				fallbackValue,
				fallbackUnit,
			]
		);
	}

	const [ parsedValue, parsedUnit ] = parseUnit( next, units );

	return ! parsedUnit
		? [ parsedValue, fallbackUnit ]
		: [ parsedValue, parsedUnit ];
}

function getCSSValues( value, styleKey ) {
	const element = document.createElement( 'div' ).style;

	element[ styleKey ] = value;

	if ( value && isExpression( value ) && isUsingTheSameUnits( value ) ) {
		const units = getUnits( value )[ 0 ];
		const expression = getArithmeticExpression( value );

		// eslint-disable-next-line no-eval
		const result = `${ eval( expression ) }${ units }`;

		element[ styleKey ] = result;

		return (
			element[ styleKey ].includes( result ) && [
				// eslint-disable-next-line no-eval
				eval( expression ),
				units,
			]
		);
	}

	if ( parseUnit( value )[ 1 ] ) {
		return parseUnit( value );
	}

	return element[ styleKey ].includes( value ) && [ value ];
}

function isExpression( value ) {
	return value.match( /^calc\(/g )?.length;
}

function isUsingTheSameUnits( value ) {
	return Array.from( new Set( getUnits( value ) ) ).length === 1;
}

function getUnits( value ) {
	return value.match( /[px|r?em]{2,3}/g );
}

/**
 * Leaves only arithmetic symbols from a string.
 *
 * @param {string} value
 * @return {string} expression
 */
function getArithmeticExpression( value ) {
	return value.replace( /[^-()\d/*+.]/g, '' );
}
