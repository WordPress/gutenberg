/**
 * External dependencies
 */
import { capitalCase } from 'change-case';

// Em dash used to represent an unset / default value.
export const EMPTY_VALUE_LABEL = '\u2014';

// Matches a preset variable token, e.g. `var:preset|color|vivid-red`.
const PRESET_TOKEN_REGEX = /^var:preset\|([^|]+)\|(.+)$/;

// True when a style value is present (not unset or empty).
const isSet = ( value ) =>
	value !== undefined && value !== null && value !== '';

/**
 * Formats a raw style value into a human-friendly string for display.
 *
 * Handles:
 * - `undefined`/`null`/empty: an em-dash placeholder.
 * - Preset tokens (`var:preset|type|slug`): the humanized slug.
 * - Plain strings/numbers: passed through as-is.
 * - Objects/arrays (e.g. border side objects): safely stringified, or the
 *   em-dash placeholder when they cannot be represented.
 *
 * @param {*} value The raw style value.
 *
 * @return {string} A human-friendly representation of the value.
 */
export function formatStyleValue( value ) {
	if ( ! isSet( value ) ) {
		return EMPTY_VALUE_LABEL;
	}

	if ( typeof value === 'string' ) {
		const presetMatch = value.match( PRESET_TOKEN_REGEX );
		if ( presetMatch ) {
			return capitalCase( presetMatch[ 2 ] );
		}
		return value;
	}

	if ( typeof value === 'number' ) {
		return String( value );
	}

	if ( typeof value === 'object' ) {
		try {
			const stringified = JSON.stringify( value );
			return stringified && stringified !== '{}' && stringified !== '[]'
				? stringified
				: EMPTY_VALUE_LABEL;
		} catch {
			return EMPTY_VALUE_LABEL;
		}
	}

	return String( value );
}

/**
 * Formats a border scope object into a CSS `border` shorthand for display,
 * e.g. `2px dashed #000fff`.
 *
 * The parts are ordered `width style color` to match the CSS shorthand, unset
 * parts are omitted, and preset color tokens are humanized (via
 * `formatStyleValue`). Returns the empty-value placeholder when the scope
 * carries no values.
 *
 * @param {*} border A border scope, e.g. `{ color, width, style }`.
 *
 * @return {string} The shorthand representation, or the empty-value placeholder.
 */
export function formatBorderShorthand( border ) {
	if ( ! border || typeof border !== 'object' ) {
		return formatStyleValue( border );
	}

	const { width, style, color } = border;
	const parts = [ width, style, color ]
		.filter( isSet )
		.map( ( part ) => formatStyleValue( part ) );

	return parts.length ? parts.join( ' ' ) : EMPTY_VALUE_LABEL;
}

// CSS `border-radius` shorthand corner order.
const RADIUS_CORNERS = [ 'topLeft', 'topRight', 'bottomRight', 'bottomLeft' ];

/**
 * Formats a border radius value for display.
 *
 * A string radius is passed through; a per-corner object is joined into a
 * shorthand in CSS corner order, e.g. `1px 20px 1px 15px`. Returns the
 * empty-value placeholder when there is nothing to show.
 *
 * @param {*} radius A radius string or a per-corner object.
 *
 * @return {string} The formatted radius, or the empty-value placeholder.
 */
export function formatBorderRadius( radius ) {
	if ( radius && typeof radius === 'object' ) {
		const parts = RADIUS_CORNERS.map(
			( corner ) => radius[ corner ]
		).filter( isSet );
		return parts.length ? parts.join( ' ' ) : EMPTY_VALUE_LABEL;
	}

	return formatStyleValue( radius );
}

/**
 * Formats a spacing value (padding or margin) as a CSS shorthand for display.
 *
 * A string value is passed through. A per-side object is collapsed to the
 * shortest CSS shorthand that represents it: a single value when all sides
 * match, a `vertical horizontal` pair for axial values, and otherwise the
 * defined sides in CSS `top right bottom left` order.
 *
 * An optional `resolve` callback maps a raw value to its resolved form before
 * display, e.g. turning a `var:preset|spacing|40` token into its actual size,
 * which is more meaningful than the preset slug.
 *
 * @param {*}        spacing A spacing string or a per-side object.
 * @param {Function} resolve Optional resolver applied to each raw value.
 *
 * @return {string} The formatted spacing, or the empty-value placeholder.
 */
export function formatSpacingShorthand(
	spacing,
	resolve = ( value ) => value
) {
	const format = ( value ) => formatStyleValue( resolve( value ) );

	if ( ! spacing || typeof spacing !== 'object' ) {
		return format( spacing );
	}

	const { top, right, bottom, left } = spacing;

	// Collapse a full axial/uniform object to the shortest CSS shorthand.
	if ( isSet( top ) && isSet( right ) && isSet( bottom ) && isSet( left ) ) {
		if ( top === right && right === bottom && bottom === left ) {
			return format( top );
		}
		if ( top === bottom && left === right ) {
			return `${ format( top ) } ${ format( left ) }`;
		}
		return [ top, right, bottom, left ].map( format ).join( ' ' );
	}

	// Partial object: show the defined sides in CSS order.
	const parts = [ top, right, bottom, left ].filter( isSet ).map( format );

	return parts.length ? parts.join( ' ' ) : EMPTY_VALUE_LABEL;
}
