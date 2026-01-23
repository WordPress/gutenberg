/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	sidesAll,
	sidesBottom,
	sidesHorizontal,
	sidesLeft,
	sidesRight,
	sidesTop,
	sidesVertical,
} from '@wordpress/icons';

export const RANGE_CONTROL_MAX_SIZE = 8;

export const ALL_SIDES = [ 'top', 'right', 'bottom', 'left' ];

export const DEFAULT_VALUES = {
	top: undefined,
	right: undefined,
	bottom: undefined,
	left: undefined,
};

export const ICONS = {
	custom: sidesAll,
	axial: sidesAll,
	horizontal: sidesHorizontal,
	vertical: sidesVertical,
	top: sidesTop,
	right: sidesRight,
	bottom: sidesBottom,
	left: sidesLeft,
};

export const LABELS = {
	default: __( 'Spacing control' ),
	top: __( 'Top' ),
	bottom: __( 'Bottom' ),
	left: __( 'Left' ),
	right: __( 'Right' ),
	mixed: __( 'Mixed' ),
	vertical: __( 'Vertical' ),
	horizontal: __( 'Horizontal' ),
	axial: __( 'Horizontal & vertical' ),
	custom: __( 'Custom' ),
};

export const VIEWS = {
	axial: 'axial',
	top: 'top',
	right: 'right',
	bottom: 'bottom',
	left: 'left',
	custom: 'custom',
};

/**
 * Checks is given value is a spacing preset.
 *
 * @param {string} value Value to check
 *
 * @return {boolean} Return true if value is string in format var:preset|spacing|.
 */
export function isValueSpacingPreset( value ) {
	if ( ! value?.includes ) {
		return false;
	}
	return value === '0' || value.includes( 'var:preset|spacing|' );
}

/**
 * Converts a spacing preset into a custom value.
 *
 * @param {string} value        Value to convert
 * @param {Array}  spacingSizes Array of the current spacing preset objects
 *
 * @return {string} Mapping of the spacing preset to its equivalent custom value.
 */
export function getCustomValueFromPreset( value, spacingSizes ) {
	if ( ! isValueSpacingPreset( value ) ) {
		return value;
	}

	const slug = getSpacingPresetSlug( value );
	const spacingSize = spacingSizes.find(
		( size ) => String( size.slug ) === slug
	);

	return spacingSize?.size;
}

/**
 * Converts a custom value to preset value if one can be found.
 *
 * Returns value as-is if no match is found.
 *
 * @param {string} value        Value to convert
 * @param {Array}  spacingSizes Array of the current spacing preset objects
 *
 * @return {string} The preset value if it can be found.
 */
export function getPresetValueFromCustomValue( value, spacingSizes ) {
	// Return value as-is if it is undefined or is already a preset, or '0';
	if ( ! value || isValueSpacingPreset( value ) || value === '0' ) {
		return value;
	}

	const spacingMatch = spacingSizes.find(
		( size ) => String( size.size ) === String( value )
	);

	if ( spacingMatch?.slug ) {
		return `var:preset|spacing|${ spacingMatch.slug }`;
	}

	return value;
}

/**
 * Converts a spacing preset into a custom value.
 *
 * @param {string} value Value to convert.
 *
 * @return {string | undefined} CSS var string for given spacing preset value.
 */
export function getSpacingPresetCssVar( value ) {
	if ( ! value ) {
		return;
	}

	const slug = value.match( /var:preset\|spacing\|(.+)/ );

	if ( ! slug ) {
		return value;
	}

	return `var(--wp--preset--spacing--${ slug[ 1 ] })`;
}

/**
 * Returns the slug section of the given spacing preset string.
 *
 * @param {string} value Value to extract slug from.
 *
 * @return {string|undefined} The int value of the slug from given spacing preset.
 */
export function getSpacingPresetSlug( value ) {
	if ( ! value ) {
		return;
	}

	if ( value === '0' || value === 'default' ) {
		return value;
	}

	const slug = value.match( /var:preset\|spacing\|(.+)/ );

	return slug ? slug[ 1 ] : undefined;
}

/**
 * Converts spacing preset value into a Range component value .
 *
 * @param {string} presetValue  Value to convert to Range value.
 * @param {Array}  spacingSizes Array of current spacing preset value objects.
 *
 * @return {number} The int value for use in Range control.
 */
export function getSliderValueFromPreset( presetValue, spacingSizes ) {
	if ( presetValue === undefined ) {
		return 0;
	}
	const slug =
		parseFloat( presetValue, 10 ) === 0
			? '0'
			: getSpacingPresetSlug( presetValue );
	const sliderValue = spacingSizes.findIndex( ( spacingSize ) => {
		return String( spacingSize.slug ) === slug;
	} );

	// Returning NaN rather than undefined as undefined makes range control thumb sit in center
	return sliderValue !== -1 ? sliderValue : NaN;
}

/**
 * Determines whether a particular axis has support. If no axis is
 * specified, this function checks if either axis is supported.
 *
 * @param {Array}  sides Supported sides.
 * @param {string} axis  Which axis to check.
 *
 * @return {boolean} Whether there is support for the specified axis or both axes.
 */
export function hasAxisSupport( sides, axis ) {
	if ( ! sides || ! sides.length ) {
		return false;
	}

	const hasHorizontalSupport =
		sides.includes( 'horizontal' ) ||
		( sides.includes( 'left' ) && sides.includes( 'right' ) );

	const hasVerticalSupport =
		sides.includes( 'vertical' ) ||
		( sides.includes( 'top' ) && sides.includes( 'bottom' ) );

	if ( axis === 'horizontal' ) {
		return hasHorizontalSupport;
	}

	if ( axis === 'vertical' ) {
		return hasVerticalSupport;
	}

	return hasHorizontalSupport || hasVerticalSupport;
}

/**
 * Checks if the supported sides are balanced for each axis.
 * - Horizontal - both left and right sides are supported.
 * - Vertical - both top and bottom are supported.
 *
 * @param {Array} sides The supported sides which may be axes as well.
 *
 * @return {boolean} Whether or not the supported sides are balanced.
 */
export function hasBalancedSidesSupport( sides = [] ) {
	const counts = { top: 0, right: 0, bottom: 0, left: 0 };
	sides.forEach( ( side ) => ( counts[ side ] += 1 ) );

	return (
		( counts.top + counts.bottom ) % 2 === 0 &&
		( counts.left + counts.right ) % 2 === 0
	);
}

/**
 * Determines which view the SpacingSizesControl should default to on its
 * first render; Axial, Custom, or Single side.
 *
 * @param {Object} values Current side values.
 * @param {Array}  sides  Supported sides.
 *
 * @return {string} View to display.
 */
export function getInitialView( values = {}, sides ) {
	const { top, right, bottom, left } = values;
	const sideValues = [ top, right, bottom, left ].filter( Boolean );

	// Axial ( Horizontal & vertical ).
	// - Has axial side support
	// - Has axial side values which match
	// - Has no values and the supported sides are balanced
	const hasMatchingAxialValues =
		top === bottom && left === right && ( !! top || !! left );
	const hasNoValuesAndBalancedSides =
		! sideValues.length && hasBalancedSidesSupport( sides );
	const hasOnlyAxialSides =
		sides?.includes( 'horizontal' ) &&
		sides?.includes( 'vertical' ) &&
		sides?.length === 2;

	if (
		hasAxisSupport( sides ) &&
		( hasMatchingAxialValues || hasNoValuesAndBalancedSides )
	) {
		return VIEWS.axial;
	}

	// Only axial sides are supported and single value defined.
	// - Ensure the side returned is the first side that has a value.
	if ( hasOnlyAxialSides && sideValues.length === 1 ) {
		let side;

		Object.entries( values ).some( ( [ key, value ] ) => {
			side = key;
			return value !== undefined;
		} );

		return side;
	}

	// Only single side supported and no value defined.
	if ( sides?.length === 1 && ! sideValues.length ) {
		return sides[ 0 ];
	}

	// Default to the Custom (separated sides) view.
	return VIEWS.custom;
}
