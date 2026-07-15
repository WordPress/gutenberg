/**
 * External dependencies
 */
import { capitalCase } from 'change-case';

// Em dash shown when a value isn't set.
export const EMPTY_VALUE_LABEL = '\u2014';

// Preset values come in two forms: the user form `var:preset|color|vivid-red`
// and the CSS custom property form `var(--wp--preset--color--vivid-red)`. In
// both the slug (e.g. `vivid-red`) is the last segment.
const PRESET_USER_PREFIX = 'var:preset|';
const PRESET_CSS_VAR_REGEX =
	/^var\(\s*--wp--preset--[a-z0-9-]+?\s*(?:,[^)]*)?\)$/i;

// Returns a preset's slug from either form, or `undefined` when the value isn't
// a preset.
function getPresetSlug( value ) {
	if ( value.startsWith( PRESET_USER_PREFIX ) ) {
		return value.split( '|' ).pop();
	}
	if ( PRESET_CSS_VAR_REGEX.test( value ) ) {
		return value
			.replace( /^var\(\s*/, '' )
			.replace( /\s*(?:,[^)]*)?\)$/, '' )
			.split( '--' )
			.pop();
	}
	return undefined;
}

// True when a value is actually set.
const isSet = ( value ) =>
	value !== undefined && value !== null && value !== '';

const BORDER_SIDES = [ 'top', 'right', 'bottom', 'left' ];

// Global Styles stores border style, width and color per side (e.g.
// `border.top.style`). Collapse a per-side border object to flat
// `{ width, style, color }`, keeping a value only when every set side agrees.
function flattenBorder( border ) {
	if (
		isSet( border.width ) ||
		isSet( border.style ) ||
		isSet( border.color )
	) {
		return border;
	}

	const setSides = BORDER_SIDES.filter( ( side ) => border[ side ] );
	if ( ! setSides.length ) {
		return border;
	}

	const collapse = ( property ) => {
		const values = setSides.map( ( side ) => border[ side ]?.[ property ] );
		return values.every( ( value ) => value === values[ 0 ] )
			? values[ 0 ]
			: undefined;
	};

	return {
		width: collapse( 'width' ),
		style: collapse( 'style' ),
		color: collapse( 'color' ),
	};
}

/**
 * Turns a raw style value into readable text for the modal.
 *
 * - Empty, `null` or `undefined`: an em dash.
 * - Preset values (`var:preset|type|slug` or `var(--wp--preset--type--slug)`):
 *   the readable slug.
 * - Strings and numbers: used as-is.
 * - Objects and arrays (like a border side): turned into text, or an em dash
 *   when there's nothing to show.
 *
 * @param {*} value The raw style value.
 *
 * @return {string} Readable text for the value.
 */
export function formatStyleValue( value ) {
	if ( ! isSet( value ) ) {
		return EMPTY_VALUE_LABEL;
	}

	if ( typeof value === 'string' ) {
		const presetSlug = getPresetSlug( value );
		if ( presetSlug ) {
			return capitalCase( presetSlug );
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
 * Turns a border object into a single CSS `border` value, e.g.
 * `2px dashed #000fff`.
 *
 * The parts follow the CSS order of `width style color`, anything that isn't
 * set is left out, and preset colors are shown by name. A per-side object (as
 * Global Styles stores borders) is collapsed to its shared values first.
 * Returns an em dash when the border has nothing set.
 *
 * @param {*} border A border object, e.g. `{ color, width, style }`, or a
 *                   per-side object, e.g. `{ top: { style } }`.
 *
 * @return {string} The combined border value, or an em dash.
 */
export function formatBorderShorthand( border ) {
	if ( ! border || typeof border !== 'object' ) {
		return formatStyleValue( border );
	}

	const { width, style, color } = flattenBorder( border );
	const parts = [ width, style, color ]
		.filter( isSet )
		.map( ( part ) => formatStyleValue( part ) );

	return parts.length ? parts.join( ' ' ) : EMPTY_VALUE_LABEL;
}

// Corner order used by the CSS `border-radius` shorthand.
const RADIUS_CORNERS = [ 'topLeft', 'topRight', 'bottomRight', 'bottomLeft' ];

/**
 * Turns a border radius into readable text.
 *
 * A plain string is used as-is. An object with a value per corner is joined in
 * CSS corner order, e.g. `1px 20px 1px 15px`. Returns an em dash when there's
 * nothing to show.
 *
 * @param {*} radius A radius string or an object with a value per corner.
 *
 * @return {string} The readable radius, or an em dash.
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
 * Turns a spacing value (padding or margin) into a single CSS value.
 *
 * A plain string is used as-is. An object with a value per side is shortened
 * to the smallest CSS form: one value when every side matches, a
 * `vertical horizontal` pair when top/bottom and left/right match, otherwise
 * all four sides in `top right bottom left` order.
 *
 * The optional `resolve` callback swaps a raw value for its real one first,
 * e.g. turning `var:preset|spacing|40` into its actual size, which reads
 * better than the preset name.
 *
 * @param {*}        spacing A spacing string or an object with a value per side.
 * @param {Function} resolve Optional callback to resolve each raw value.
 *
 * @return {string} The combined spacing, or an em dash.
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

	if ( isSet( top ) && isSet( right ) && isSet( bottom ) && isSet( left ) ) {
		if ( top === right && right === bottom && bottom === left ) {
			return format( top );
		}
		if ( top === bottom && left === right ) {
			return `${ format( top ) } ${ format( left ) }`;
		}
		return [ top, right, bottom, left ].map( format ).join( ' ' );
	}

	if (
		! isSet( top ) &&
		! isSet( right ) &&
		! isSet( bottom ) &&
		! isSet( left )
	) {
		return EMPTY_VALUE_LABEL;
	}

	// Keep all four slots so an unset side still shows its position.
	return [ top, right, bottom, left ]
		.map( ( value ) =>
			isSet( value ) ? format( value ) : EMPTY_VALUE_LABEL
		)
		.join( ' ' );
}

/**
 * Turns a block gap value into readable text.
 *
 * A plain string is used as-is. An axial object with a `top` (row) and `left`
 * (column) gap reads as one value when both match, or `row - column` when they
 * differ.
 *
 * The optional `resolve` callback swaps a raw value for its real one first,
 * e.g. turning `var:preset|spacing|40` into its actual size.
 *
 * @param {*}        gap     A gap string or an axial `{ top, left }` object.
 * @param {Function} resolve Optional callback to resolve each raw value.
 *
 * @return {string} The readable gap, or an em dash.
 */
export function formatBlockGap( gap, resolve = ( value ) => value ) {
	const format = ( value ) => formatStyleValue( resolve( value ) );

	if ( ! gap || typeof gap !== 'object' ) {
		return format( gap );
	}

	const { top: row, left: column } = gap;

	if ( ! isSet( row ) && ! isSet( column ) ) {
		return EMPTY_VALUE_LABEL;
	}

	if ( row === column ) {
		return format( row );
	}

	const rowLabel = isSet( row ) ? format( row ) : EMPTY_VALUE_LABEL;
	const columnLabel = isSet( column ) ? format( column ) : EMPTY_VALUE_LABEL;

	return `${ rowLabel } - ${ columnLabel }`;
}
