/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { parseQuantityAndUnitFromRawValue } from '../unit-control/utils';
import type { BoxControlProps, BoxControlValue } from './types';

export const LABELS = {
	all: __( 'All' ),
	top: __( 'Top' ),
	bottom: __( 'Bottom' ),
	left: __( 'Left' ),
	right: __( 'Right' ),
	mixed: __( 'Mixed' ),
	vertical: __( 'Vertical' ),
	horizontal: __( 'Horizontal' ),
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
 * Gets the 'all' input value and unit from values data.
 *
 * @param values         Box values.
 * @param selectedUnits  Box units.
 * @param availableSides Available box sides to evaluate.
 *
 * @return A value + unit for the 'all' input.
 */
export function getAllValue(
	values: BoxControlValue = {},
	selectedUnits?: BoxControlValue,
	availableSides: BoxControlProps[ 'sides' ] = ALL_SIDES
) {
	const sides = normalizeSides( availableSides );
	const parsedQuantitiesAndUnits = sides.map( ( side ) =>
		parseQuantityAndUnitFromRawValue( values[ side ] )
	);
	const allParsedQuantities = parsedQuantitiesAndUnits.map(
		( value ) => value[ 0 ] ?? ''
	);
	const allParsedUnits = parsedQuantitiesAndUnits.map(
		( value ) => value[ 1 ]
	);

	const commonQuantity = allParsedQuantities.every(
		( v ) => v === allParsedQuantities[ 0 ]
	)
		? allParsedQuantities[ 0 ]
		: '';

	/**
	 * The typeof === 'number' check is important. On reset actions, the incoming value
	 * may be null or an empty string.
	 *
	 * Also, the value may also be zero (0), which is considered a valid unit value.
	 *
	 * typeof === 'number' is more specific for these cases, rather than relying on a
	 * simple truthy check.
	 */
	let commonUnit;
	if ( typeof commonQuantity === 'number' ) {
		commonUnit = mode( allParsedUnits );
	} else {
		// Set meaningful unit selection if no commonQuantity and user has previously
		// selected units without assigning values while controls were unlinked.
		commonUnit =
			getAllUnitFallback( selectedUnits ) ?? mode( allParsedUnits );
	}

	return [ commonQuantity, commonUnit ].join( '' );
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
 * Checks to determine if values are mixed.
 *
 * @param values        Box values.
 * @param selectedUnits Box units.
 * @param sides         Available box sides to evaluate.
 *
 * @return Whether values are mixed.
 */
export function isValuesMixed(
	values: BoxControlValue = {},
	selectedUnits?: BoxControlValue,
	sides: BoxControlProps[ 'sides' ] = ALL_SIDES
) {
	const allValue = getAllValue( values, selectedUnits, sides );
	const isMixed = isNaN( parseFloat( allValue ) );

	return isMixed;
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
		values !== undefined &&
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
