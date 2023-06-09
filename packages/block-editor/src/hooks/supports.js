/**
 * WordPress dependencies
 */
import { getBlockSupport, hasBlockSupport } from '@wordpress/blocks';
import { Platform } from '@wordpress/element';

const ALIGN_SUPPORT_KEY = 'align';
const ALIGN_WIDE_SUPPORT_KEY = 'alignWide';
const BORDER_SUPPORT_KEY = '__experimentalBorder';
const COLOR_SUPPORT_KEY = 'color';
const CUSTOM_CLASS_NAME_SUPPORT_KEY = 'customClassName';
const FONT_FAMILY_SUPPORT_KEY = 'typography.__experimentalFontFamily';
const FONT_SIZE_SUPPORT_KEY = 'typography.fontSize';
const LINE_HEIGHT_SUPPORT_KEY = 'typography.lineHeight';
/**
 * Key within block settings' support array indicating support for font style.
 */
const FONT_STYLE_SUPPORT_KEY = 'typography.__experimentalFontStyle';
/**
 * Key within block settings' support array indicating support for font weight.
 */
const FONT_WEIGHT_SUPPORT_KEY = 'typography.__experimentalFontWeight';
/**
 * Key within block settings' supports array indicating support for text
 * columns e.g. settings found in `block.json`.
 */
const TEXT_COLUMNS_SUPPORT_KEY = 'typography.textColumns';
/**
 * Key within block settings' supports array indicating support for text
 * decorations e.g. settings found in `block.json`.
 */
const TEXT_DECORATION_SUPPORT_KEY = 'typography.__experimentalTextDecoration';
/**
 * Key within block settings' supports array indicating support for text
 * transforms e.g. settings found in `block.json`.
 */
const TEXT_TRANSFORM_SUPPORT_KEY = 'typography.__experimentalTextTransform';
/**
 * Key within block settings' supports array indicating support for letter-spacing
 * e.g. settings found in `block.json`.
 */
const LETTER_SPACING_SUPPORT_KEY = 'typography.__experimentalLetterSpacing';
const LAYOUT_SUPPORT_KEY = '__experimentalLayout';
const TYPOGRAPHY_SUPPORT_KEYS = [
	LINE_HEIGHT_SUPPORT_KEY,
	FONT_SIZE_SUPPORT_KEY,
	FONT_STYLE_SUPPORT_KEY,
	FONT_WEIGHT_SUPPORT_KEY,
	FONT_FAMILY_SUPPORT_KEY,
	TEXT_COLUMNS_SUPPORT_KEY,
	TEXT_DECORATION_SUPPORT_KEY,
	TEXT_TRANSFORM_SUPPORT_KEY,
	LETTER_SPACING_SUPPORT_KEY,
];
const SPACING_SUPPORT_KEY = 'spacing';
const styleSupportKeys = [
	...TYPOGRAPHY_SUPPORT_KEYS,
	BORDER_SUPPORT_KEY,
	COLOR_SUPPORT_KEY,
	SPACING_SUPPORT_KEY,
];

/**
 * Returns true if the block defines support for align.
 *
 * @param {string|Object} nameOrType Block name or type object.
 * @return {boolean} Whether the block supports the feature.
 */
export const hasAlignSupport = ( nameOrType ) =>
	hasBlockSupport( nameOrType, ALIGN_SUPPORT_KEY );

/**
 * Returns the block support value for align, if defined.
 *
 * @param {string|Object} nameOrType Block name or type object.
 * @return {unknown} The block support value.
 */
export const getAlignSupport = ( nameOrType ) =>
	getBlockSupport( nameOrType, ALIGN_SUPPORT_KEY );

/**
 * Returns true if the block defines support for align wide.
 *
 * @param {string|Object} nameOrType Block name or type object.
 * @return {boolean} Whether the block supports the feature.
 */
export const hasAlignWideSupport = ( nameOrType ) =>
	hasBlockSupport( nameOrType, ALIGN_WIDE_SUPPORT_KEY );

/**
 * Returns the block support value for align wide, if defined.
 *
 * @param {string|Object} nameOrType Block name or type object.
 * @return {unknown} The block support value.
 */
export const getAlignWideSupport = ( nameOrType ) =>
	getBlockSupport( nameOrType, ALIGN_WIDE_SUPPORT_KEY );

/**
 * Determine whether there is block support for border properties.
 *
 * @param {string|Object} nameOrType Block name or type object.
 * @param {string}        feature    Border feature to check support for.
 *
 * @return {boolean} Whether there is support.
 */
export function hasBorderSupport( nameOrType, feature = 'any' ) {
	if ( Platform.OS !== 'web' ) {
		return false;
	}

	const support = getBlockSupport( nameOrType, BORDER_SUPPORT_KEY );

	if ( support === true ) {
		return true;
	}

	if ( feature === 'any' ) {
		return !! (
			support?.color ||
			support?.radius ||
			support?.width ||
			support?.style
		);
	}

	return !! support?.[ feature ];
}

/**
 * Get block support for border properties.
 *
 * @param {string|Object} nameOrType Block name or type object.
 * @param {string}        feature    Border feature to get.
 *
 * @return {unknown} The block support.
 */
export const getBorderSupport = ( nameOrType, feature ) =>
	getBlockSupport( nameOrType, [ BORDER_SUPPORT_KEY, feature ] );

/**
 * Returns true if the block defines support for color.
 *
 * @param {string|Object} nameOrType Block name or type object.
 * @return {boolean} Whether the block supports the feature.
 */
export const hasColorSupport = ( nameOrType ) => {
	const colorSupport = getBlockSupport( nameOrType, COLOR_SUPPORT_KEY );
	return (
		colorSupport &&
		( colorSupport.link === true ||
			colorSupport.gradient === true ||
			colorSupport.background !== false ||
			colorSupport.text !== false )
	);
};

/**
 * Returns true if the block defines support for link color.
 *
 * @param {string|Object} nameOrType Block name or type object.
 * @return {boolean} Whether the block supports the feature.
 */
export const hasLinkColorSupport = ( nameOrType ) => {
	if ( Platform.OS !== 'web' ) {
		return false;
	}

	const colorSupport = getBlockSupport( nameOrType, COLOR_SUPPORT_KEY );

	return (
		colorSupport !== null &&
		typeof colorSupport === 'object' &&
		!! colorSupport.link
	);
};

/**
 * Returns true if the block defines support for gradient color.
 *
 * @param {string|Object} nameOrType Block name or type object.
 * @return {boolean} Whether the block supports the feature.
 */
export const hasGradientSupport = ( nameOrType ) => {
	const colorSupport = getBlockSupport( nameOrType, COLOR_SUPPORT_KEY );

	return (
		colorSupport !== null &&
		typeof colorSupport === 'object' &&
		!! colorSupport.gradients
	);
};

/**
 * Returns true if the block defines support for background color.
 *
 * @param {string|Object} nameOrType Block name or type object.
 * @return {boolean} Whether the block supports the feature.
 */
export const hasBackgroundColorSupport = ( nameOrType ) => {
	const colorSupport = getBlockSupport( nameOrType, COLOR_SUPPORT_KEY );

	return colorSupport && colorSupport.background !== false;
};

/**
 * Returns true if the block defines support for background color.
 *
 * @param {string|Object} nameOrType Block name or type object.
 * @return {boolean} Whether the block supports the feature.
 */
export const hasTextColorSupport = ( nameOrType ) => {
	const colorSupport = getBlockSupport( nameOrType, COLOR_SUPPORT_KEY );

	return colorSupport && colorSupport.text !== false;
};

/**
 * Get block support for color properties.
 *
 * @param {string|Object} nameOrType Block name or type object.
 * @param {string}        feature    Color feature to get.
 *
 * @return {unknown} The block support.
 */
export const getColorSupport = ( nameOrType, feature ) =>
	getBlockSupport( nameOrType, [ COLOR_SUPPORT_KEY, feature ] );

/**
 * Returns true if the block defines support for custom class name.
 *
 * @param {string|Object} nameOrType Block name or type object.
 * @return {boolean} Whether the block supports the feature.
 */
export const hasCustomClassNameSupport = ( nameOrType ) =>
	hasBlockSupport( nameOrType, CUSTOM_CLASS_NAME_SUPPORT_KEY, true );

/**
 * Returns the block support value for custom class name, if defined.
 *
 * @param {string|Object} nameOrType Block name or type object.
 * @return {unknown} The block support value.
 */
export const getCustomClassNameSupport = ( nameOrType ) =>
	getBlockSupport( nameOrType, CUSTOM_CLASS_NAME_SUPPORT_KEY, true );

/**
 * Returns true if the block defines support for font family.
 *
 * @param {string|Object} nameOrType Block name or type object.
 * @return {boolean} Whether the block supports the feature.
 */
export const hasFontFamilySupport = ( nameOrType ) =>
	hasBlockSupport( nameOrType, FONT_FAMILY_SUPPORT_KEY );

/**
 * Returns the block support value for font family, if defined.
 *
 * @param {string|Object} nameOrType Block name or type object.
 * @return {unknown} The block support value.
 */
export const getFontFamilySupport = ( nameOrType ) =>
	getBlockSupport( nameOrType, FONT_FAMILY_SUPPORT_KEY );

/**
 * Returns true if the block defines support for font size.
 *
 * @param {string|Object} nameOrType Block name or type object.
 * @return {boolean} Whether the block supports the feature.
 */
export const hasFontSizeSupport = ( nameOrType ) =>
	hasBlockSupport( nameOrType, FONT_SIZE_SUPPORT_KEY );

/**
 * Returns the block support value for font size, if defined.
 *
 * @param {string|Object} nameOrType Block name or type object.
 * @return {unknown} The block support value.
 */
export const getFontSizeSupport = ( nameOrType ) =>
	getBlockSupport( nameOrType, FONT_SIZE_SUPPORT_KEY );

/**
 * Returns true if the block defines support for layout.
 *
 * @param {string|Object} nameOrType Block name or type object.
 * @return {boolean} Whether the block supports the feature.
 */
export const hasLayoutSupport = ( nameOrType ) =>
	hasBlockSupport( nameOrType, LAYOUT_SUPPORT_KEY );

/**
 * Returns the block support value for layout, if defined.
 *
 * @param {string|Object} nameOrType Block name or type object.
 * @return {unknown} The block support value.
 */
export const getLayoutSupport = ( nameOrType ) =>
	getBlockSupport( nameOrType, LAYOUT_SUPPORT_KEY );

/**
 * Returns true if the block defines support for style.
 *
 * @param {string|Object} nameOrType Block name or type object.
 * @return {boolean} Whether the block supports the feature.
 */
export const hasStyleSupport = ( nameOrType ) =>
	styleSupportKeys.some( ( key ) => hasBlockSupport( nameOrType, key ) );
