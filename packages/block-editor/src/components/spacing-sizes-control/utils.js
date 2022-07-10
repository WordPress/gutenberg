/**
 * External dependencies
 */
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

export function getSpacingPresetSlug( value ) {
	if ( ! value ) {
		return;
	}
	const slug = /var:preset\|spacing\|(.+)/.exec( value );

	return slug ? parseInt( slug[ 1 ], 10 ) : undefined;
}

export function getSliderValueFromSlug( slug, spacingSizes ) {
	return spacingSizes.findIndex( ( spacingSize ) => {
		return spacingSize.slug === slug;
	} );
}

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
 * @param {Array}  availableSides Available box sides to evaluate.
 *
 * @return {string} A value + unit for the 'all' input.
 */
export function getAllValue(
	values = {},
	availableSides = ALL_SIDES,
	spacingSizes
) {
	const sides = normalizeSides( availableSides );
	const parsedSlugs = sides.map( ( side ) =>
		getSpacingPresetSlug( values[ side ] )
	);

	return getSliderValueFromSlug( mode( parsedSlugs ), spacingSizes );
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
		! isEmpty(
			Object.values( values ).filter(
				// Switching units when input is empty causes values only
				// containing units. This gives false positive on mixed values
				// unless filtered.
				( value ) => !! value && /\d/.test( value )
			)
		)
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
