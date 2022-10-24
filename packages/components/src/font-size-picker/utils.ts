/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type {
	FontSize,
	FontSizeOption,
	FontSizeSelectOption,
	FontSizeToggleGroupOption,
	FontSizePickerProps,
} from './types';

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
 * Some themes use css vars for their font sizes, so until we
 * have the way of calculating them don't display them.
 *
 * @param  value The value that is checked.
 * @return Whether the value is a simple css value.
 */
export function isSimpleCssValue(
	value: NonNullable< FontSizePickerProps[ 'value' ] >
) {
	const sizeRegex = /^[\d\.]+(px|em|rem|vw|vh|%)?$/i;
	return sizeRegex.test( String( value ) );
}

/**
 * Return font size options in the proper format depending
 * on the currently used control (select, toggle group).
 *
 * @param  useSelectControl       Whether to use a select control.
 * @param  optionsArray           Array of available font sizes objects.
 * @param  disableCustomFontSizes Flag that indicates if custom font sizes are disabled.
 * @return Array of font sizes in proper format for the used control.
 */
export function getFontSizeOptions(
	useSelectControl: boolean,
	optionsArray: FontSize[],
	disableCustomFontSizes: boolean
): FontSizeSelectOption[] | FontSizeToggleGroupOption[] | null {
	if ( disableCustomFontSizes && ! optionsArray.length ) {
		return null;
	}
	return useSelectControl
		? getSelectOptions( optionsArray, disableCustomFontSizes )
		: getToggleGroupOptions( optionsArray );
}

function getSelectOptions(
	optionsArray: FontSize[],
	disableCustomFontSizes: boolean
): FontSizeSelectOption[] {
	const options: FontSizeOption[] = [
		DEFAULT_FONT_SIZE_OPTION,
		...optionsArray,
		...( disableCustomFontSizes ? [] : [ CUSTOM_FONT_SIZE_OPTION ] ),
	];
	return options.map( ( { slug, name, size } ) => ( {
		key: slug,
		name: name || slug,
		size,
		__experimentalHint:
			size && isSimpleCssValue( size ) && parseFloat( String( size ) ),
	} ) );
}

/**
 * Build options for the toggle group options.
 *
 * @param  optionsArray An array of font size options.
 * @param  labelAliases An array of alternative labels.
 * @return Remapped optionsArray.
 */
export function getToggleGroupOptions(
	optionsArray: FontSize[],
	labelAliases: string[] = FONT_SIZES_ALIASES
): FontSizeToggleGroupOption[] {
	return optionsArray.map( ( { slug, size, name }, index ) => {
		return {
			key: slug,
			value: size,
			label: labelAliases[ index ],
			name: name || labelAliases[ index ],
		};
	} );
}

export function getSelectedOption(
	fontSizes: FontSize[],
	value: FontSizePickerProps[ 'value' ]
): FontSizeOption {
	if ( ! value ) {
		return DEFAULT_FONT_SIZE_OPTION;
	}
	return (
		fontSizes.find( ( font ) => font.size === value ) ||
		CUSTOM_FONT_SIZE_OPTION
	);
}
