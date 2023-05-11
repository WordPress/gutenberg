/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	link,
	sidesAll,
	sidesAxial,
	sidesBottom,
	sidesHorizontal,
	sidesLeft,
	sidesRight,
	sidesTop,
	sidesVertical,
} from '@wordpress/icons';

export const ALL_SIDES = [ 'top', 'right', 'bottom', 'left' ];

export const DEFAULT_VALUES = {
	top: undefined,
	right: undefined,
	bottom: undefined,
	left: undefined,
};

export const ICONS = {
	custom: sidesAll,
	linked: link,
	axial: sidesAxial,
	horizontal: sidesHorizontal,
	vertical: sidesVertical,
	top: sidesTop,
	right: sidesRight,
	bottom: sidesBottom,
	left: sidesLeft,
};

export const LABELS = {
	linked: __( 'All sides' ),
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
	linked: 'linked',
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
	// Return value as-is if it is already a preset;
	if ( isValueSpacingPreset( value ) ) {
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
 * Gets the 'all' input value from values data.
 *
 * @param {Object} values Box spacing values
 *
 * @return {string} The most common value from all sides of box.
 */
export function getAllRawValue( values = {} ) {
	return mode( Object.values( values ) );
}

/**
 * Checks to determine if values are mixed.
 *
 * @param {Object} values Box values.
 * @param {Array}  sides  Sides that values relate to.
 *
 * @return {boolean} Whether values are mixed.
 */
export function isValuesMixed( values = {}, sides = ALL_SIDES ) {
	return (
		( Object.values( values ).length >= 1 &&
			Object.values( values ).length < sides.length ) ||
		new Set( Object.values( values ) ).size > 1
	);
}

/**
 * Checks to determine if values are defined.
 *
 * @param {Object} values Box values.
 *
 * @return {boolean} Whether values are defined.
 */
export function isValuesDefined( values ) {
	if ( values === undefined || values === null ) {
		return false;
	}
	return Object.values( values ).filter( ( value ) => !! value ).length > 0;
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
 * Determines which menu options should be included in then SidePicker.
 *
 * @param {Array} sides Supported sides.
 *
 * @return {Object} Menu options split into two groups.
 *                  - Primary for more specific side options
 *                  - Secondary for general options like custom or linked
 */
export function getSupportedMenuItems( sides ) {
	if ( ! sides || ! sides.length ) {
		return {};
	}

	const primaryItems = {};
	const secondaryItems = {};

	// Determine the primary "side" menu options.
	const hasHorizontalSupport = hasAxisSupport( sides, 'horizontal' );
	const hasVerticalSupport = hasAxisSupport( sides, 'vertical' );

	if ( hasHorizontalSupport && hasVerticalSupport ) {
		primaryItems.axial = { label: LABELS.axial, icon: ICONS.axial };
	} else if ( hasHorizontalSupport ) {
		primaryItems.axial = {
			label: LABELS.horizontal,
			icon: ICONS.horizontal,
		};
	} else if ( hasVerticalSupport ) {
		primaryItems.axial = { label: LABELS.vertical, icon: ICONS.vertical };
	}

	// Track whether we have any individual sides so we can omit the custom
	// option if required.
	let numberOfIndividualSides = 0;

	ALL_SIDES.forEach( ( side ) => {
		if ( sides.includes( side ) ) {
			numberOfIndividualSides += 1;
			primaryItems[ side ] = {
				label: LABELS[ side ],
				icon: ICONS[ side ],
			};
		}
	} );

	// Add secondary menu items.
	if ( numberOfIndividualSides > 1 ) {
		secondaryItems.custom = { label: LABELS.custom, icon: ICONS.custom };
	}

	secondaryItems.linked = { label: LABELS.linked, icon: ICONS.linked };

	return { primaryItems, secondaryItems };
}

/**
 * Determines which view the SpacingSizesControl should default to on its
 * first render.
 *
 * Linked: No defined values, only one side supported, or mixed values.
 * Axial: Horizontal or vertical axis support and only those axial values set.
 * Custom: Mixed values requiring all supported siddes to be displayed.
 * Single: Only an individual side has a value.
 *
 * @param {Object} values Current side values.
 * @param {Array}  sides  Supported sides.
 *
 * @return {string} View to display.
 */
export function getInitialView( values, sides ) {
	// Primary "linked" view, formerly the "all" values version of the control.
	if (
		sides?.length === 1 ||
		! isValuesDefined( values ) ||
		! isValuesMixed( values, sides )
	) {
		return VIEWS.linked;
	}
	const { top, right, bottom, left } = values;

	// Horizontal & vertical are supported and have matching values.
	if (
		hasAxisSupport( sides ) &&
		top === bottom &&
		left === right &&
		( !! top || !! left )
	) {
		return VIEWS.axial;
	}

	// Custom (separated sides) view check.
	const sideValues = [ top, right, bottom, left ].filter( Boolean );

	if ( sideValues.length > 1 ) {
		return VIEWS.custom;
	}

	// Single (all values set to undefined is covered by linked view check).
	// TODO: Do we need to ensure its the first key with a defined value?
	return Object.keys( values )[ 0 ];
}
