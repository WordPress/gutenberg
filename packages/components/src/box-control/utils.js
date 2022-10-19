/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { parseQuantityAndUnitFromRawValue } from '../unit-control/utils';

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

export const ALL_SIDES = [ 'top', 'right', 'bottom', 'left' ];

/**
 * Gets an items with the most occurrence within an array
 * https://stackoverflow.com/a/20762713
 *
 * @param {Array<any>} arr Array of items to check.
 * @return {any} The item with the most occurrences.
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
 * @param {Object} values         Box values.
 * @param {Object} selectedUnits  Box units.
 * @param {Array}  availableSides Available box sides to evaluate.
 *
 * @return {string} A value + unit for the 'all' input.
 */
export function getAllValue(
	values = {},
	selectedUnits,
	availableSides = ALL_SIDES
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
 * @param {Object} selectedUnits Current unit selections for individual sides.
 * @return {string} Most common unit selection.
 */
export function getAllUnitFallback( selectedUnits ) {
	if ( ! selectedUnits || typeof selectedUnits !== 'object' ) {
		return undefined;
	}

	const filteredUnits = Object.values( selectedUnits ).filter( Boolean );

	return mode( filteredUnits );
}

/**
 * Checks to determine if values are mixed.
 *
 * @param {Object} values        Box values.
 * @param {Object} selectedUnits Box units.
 * @param {Array}  sides         Available box sides to evaluate.
 *
 * @return {boolean} Whether values are mixed.
 */
export function isValuesMixed( values = {}, selectedUnits, sides = ALL_SIDES ) {
	const allValue = getAllValue( values, selectedUnits, sides );
	const isMixed = isNaN( parseFloat( allValue ) );

	return isMixed;
}

/**
 * Checks to determine if values are defined.
 *
 * @param {Object} values Box values.
 *
 * @return {boolean} Whether values are mixed.
 */
export function isValuesDefined( values ) {
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
 * @param {boolean} isLinked    Whether the box control's fields are linked.
 * @param {boolean} splitOnAxis Whether splitting by horizontal or vertical axis.
 * @return {string} The initial side.
 */
export function getInitialSide( isLinked, splitOnAxis ) {
	let initialSide = 'all';

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
 * @param {Array} sides Available sides for box control.
 * @return {Array} Normalized sides configuration.
 */
export function normalizeSides( sides ) {
	const filteredSides = [];

	if ( ! sides?.length ) {
		return ALL_SIDES;
	}

	if ( sides.includes( 'vertical' ) ) {
		filteredSides.push( ...[ 'top', 'bottom' ] );
	} else if ( sides.includes( 'horizontal' ) ) {
		filteredSides.push( ...[ 'left', 'right' ] );
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
 * @param {Object}        currentValues The current values for each side.
 * @param {string|number} newValue      The value to apply to the sides object.
 * @param {string[]}      sides         Array defining valid sides.
 *
 * @return {Object} Object containing the updated values for each side.
 */
export function applyValueToSides( currentValues, newValue, sides ) {
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
