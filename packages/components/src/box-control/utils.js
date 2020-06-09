/**
 * External dependencies
 */
import { isEmpty, isNumber } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { parseUnit } from '../unit-control/utils';

export const LABELS = {
	all: __( 'All' ),
	top: __( 'Top' ),
	bottom: __( 'Bottom' ),
	left: __( 'Left' ),
	right: __( 'Right' ),
	mixed: __( 'Mixed' ),
};

export const DEFAULT_VALUES = {
	top: null,
	right: null,
	bottom: null,
	left: null,
};

export const DEFAULT_VISUALIZER_VALUES = {
	top: false,
	right: false,
	bottom: false,
	left: false,
};

/**
 * Gets an items with the most occurance within an array
 * https://stackoverflow.com/a/20762713
 *
 * @param {Array<any>} arr Array of items to check.
 * @return {any} The item with the most occurances.
 */
function mode( arr ) {
	return arr
		.sort(
			( a, b ) =>
				arr.filter( ( v ) => v === a ).length -
				arr.filter( ( v ) => v === b ).length
		)
		.pop();
}

/**
 * Gets the 'all' input value and unit from values data.
 *
 * @param {Object} values Box values.
 * @return {string} A value + unit for the 'all' input.
 */
export function getAllValue( values = {} ) {
	const parsedValues = Object.values( values ).map( parseUnit );

	const allValues = parsedValues.map( ( value ) => value[ 0 ] );
	const allUnits = parsedValues.map( ( value ) => value[ 1 ] );

	const value = allValues.every( ( v ) => v === allValues[ 0 ] )
		? allValues[ 0 ]
		: '';
	const unit = mode( allUnits );

	const allValue = isNumber( value ) ? `${ value }${ unit }` : null;

	return allValue;
}

/**
 * Checks to determine if values are mixed.
 *
 * @param {Object} values Box values.
 * @return {boolean} Whether values are mixed.
 */
export function isValuesMixed( values = {} ) {
	const allValue = getAllValue( values );
	const isMixed = isNaN( parseFloat( allValue ) );

	return isMixed;
}

export function isValuesDefined( values = {} ) {
	return (
		values !== undefined &&
		! isEmpty( Object.values( values ).filter( Boolean ) )
	);
}
