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
 * In case we have at most five font sizes, where at least one the them
 * contain a complex css value(clamp, var, etc..) show a incremental sequence
 * of numbers as a label of the font size. We do this because complex css values
 * cannot be caluclated properly and the incremental sequence of numbers as labels
 * can help the user better mentally map the different available font sizes.
 */
const FONT_SIZES_ALIASES = [ '1', '2', '3', '4', '5' ];

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
 * @param {boolean}  useSelectControl               Whether to use a select control.
 * @param {Object[]} optionsArray                   Array of available font sizes objects.
 * @param {*}        disableCustomFontSizes         Flag that indicates if custom font sizes are disabled.
 * @param {boolean}  optionsContainComplexCssValues Whether font sizes contain at least one complex css value(clamp, var, etc..).
 * @return {Object[]|null} Array of font sizes in proper format for the used control.
 */
export function getFontSizeOptions(
	useSelectControl,
	optionsArray,
	disableCustomFontSizes,
	optionsContainComplexCssValues
) {
	if ( disableCustomFontSizes && ! optionsArray.length ) {
		return null;
	}
	return useSelectControl
		? getSelectOptions( optionsArray, disableCustomFontSizes )
		: getToggleGroupOptions( optionsArray, optionsContainComplexCssValues );
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

function getToggleGroupOptions( optionsArray, optionsContainComplexCssValues ) {
	return optionsArray.map( ( { slug, size, name }, index ) => {
		let label = optionsContainComplexCssValues
			? FONT_SIZES_ALIASES[ index ]
			: size;
		if ( ! optionsContainComplexCssValues && typeof size === 'string' ) {
			const [ numericValue ] = splitValueAndUnitFromSize( size );
			label = numericValue;
		}
		return { key: slug, value: size, label, name };
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
