/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

const DEFAULT_FONT_SIZE = 'default';
const DEFAULT_FONT_SIZE_OPTION = {
	slug: DEFAULT_FONT_SIZE,
	name: __( 'Default' ),
};
export const CUSTOM_FONT_SIZE = 'custom';
const CUSTOM_FONT_SIZE_OPTION = {
	slug: CUSTOM_FONT_SIZE,
	name: __( 'Custom' ),
};

/**
 * In case we have at most five font sizes, show a `T-shirt size`
 * alias as a label of the font size. The label assumes that the font sizes
 * are ordered accordingly - from smallest to largest.
 */
const FONT_SIZES_ALIASES = [
	/* translators: S stands for 'small' and is a size label. */
	__( 'S' ),
	/* translators: M stands for 'medium' and is a size label. */
	__( 'M' ),
	/* translators: L stands for 'large' and is a size label. */
	__( 'L' ),
	/* translators: XL stands for 'extra large' and is a size label. */
	__( 'XL' ),
	/* translators: XXL stands for 'extra extra large' and is a size label. */
	__( 'XXL' ),
];

/**
 * Helper util to split a font size to its numeric value
 * and its `unit`, if exists.
 *
 * @param {string|number} size Font size.
 * @return {[number, string]} An array with the numeric value and the unit if exists.
 */
export function splitValueAndUnitFromSize( size ) {
	const [ numericValue, unit ] = `${ size }`.match( /[\d\.]+|\D+/g );

	if ( ! isNaN( parseFloat( numericValue ) ) && isFinite( numericValue ) ) {
		return [ numericValue, unit ];
	}

	return [];
}

/**
 * Some themes use css vars for their font sizes, so until we
 * have the way of calculating them don't display them.
 *
 * @param {string|number} value The value that is checked.
 * @return {boolean} Whether the value is a simple css value.
 */
export function isSimpleCssValue( value ) {
	const sizeRegex = /^[\d\.]+(px|em|rem|vw|vh|%)?$/i;
	return sizeRegex.test( value );
}

/**
 * Return font size options in the proper format depending
 * on the currently used control (select, toggle group).
 *
 * @param {boolean}  useSelectControl       Whether to use a select control.
 * @param {Object[]} optionsArray           Array of available font sizes objects.
 * @param {boolean}  disableCustomFontSizes Flag that indicates if custom font sizes are disabled.
 * @return {Object[]|null}                  Array of font sizes in proper format for the used control.
 */
export function getFontSizeOptions(
	useSelectControl,
	optionsArray,
	disableCustomFontSizes
) {
	if ( disableCustomFontSizes && ! optionsArray.length ) {
		return null;
	}
	return useSelectControl
		? getSelectOptions( optionsArray, disableCustomFontSizes )
		: getToggleGroupOptions( optionsArray );
}

function getSelectOptions( optionsArray, disableCustomFontSizes ) {
	const options = [
		DEFAULT_FONT_SIZE_OPTION,
		...optionsArray,
		...( disableCustomFontSizes ? [] : [ CUSTOM_FONT_SIZE_OPTION ] ),
	];
	return options.map( ( { slug, name, size } ) => ( {
		key: slug,
		name,
		size,
		__experimentalHint:
			size && isSimpleCssValue( size ) && parseFloat( size ),
	} ) );
}

/**
 * Build options for the toggle group options.
 *
 * @param {Array}    optionsArray An array of font size options.
 * @param {string[]} labelAliases An array of alternative labels.
 * @return {Array}   Remapped optionsArray.
 */
export function getToggleGroupOptions(
	optionsArray,
	labelAliases = FONT_SIZES_ALIASES
) {
	return optionsArray.map( ( { slug, size, name }, index ) => {
		return {
			key: slug,
			value: size,
			label: labelAliases[ index ],
			name,
		};
	} );
}

export function getSelectedOption( fontSizes, value ) {
	if ( ! value ) {
		return DEFAULT_FONT_SIZE_OPTION;
	}
	return (
		fontSizes.find( ( font ) => font.size === value ) ||
		CUSTOM_FONT_SIZE_OPTION
	);
}
