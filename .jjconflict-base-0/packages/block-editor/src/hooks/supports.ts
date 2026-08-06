import { getBlockSupport, hasBlockSupport } from '@wordpress/blocks';
import type { BlockType } from '@wordpress/blocks';
import type { BorderSupport, ColorSupport } from './types';

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
 * align e.g. settings found in `block.json`.
 */
const TEXT_ALIGN_SUPPORT_KEY = 'typography.textAlign';
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
 * Key within block settings' supports array indicating support for writing mode
 * e.g. settings found in `block.json`.
 */
const WRITING_MODE_SUPPORT_KEY = 'typography.__experimentalWritingMode';
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
const LAYOUT_SUPPORT_KEY = 'layout';
const TYPOGRAPHY_SUPPORT_KEYS = [
	LINE_HEIGHT_SUPPORT_KEY,
	FONT_SIZE_SUPPORT_KEY,
	FONT_STYLE_SUPPORT_KEY,
	FONT_WEIGHT_SUPPORT_KEY,
	FONT_FAMILY_SUPPORT_KEY,
	TEXT_ALIGN_SUPPORT_KEY,
	TEXT_COLUMNS_SUPPORT_KEY,
	TEXT_DECORATION_SUPPORT_KEY,
	TEXT_TRANSFORM_SUPPORT_KEY,
	WRITING_MODE_SUPPORT_KEY,
	LETTER_SPACING_SUPPORT_KEY,
];
const EFFECTS_SUPPORT_KEYS = [ 'shadow' ];
const SPACING_SUPPORT_KEY = 'spacing';
const styleSupportKeys = [
	...EFFECTS_SUPPORT_KEYS,
	...TYPOGRAPHY_SUPPORT_KEYS,
	BORDER_SUPPORT_KEY,
	COLOR_SUPPORT_KEY,
	SPACING_SUPPORT_KEY,
];

/**
 * Returns true if the block defines support for align.
 *
 * @param nameOrType Block name or type object.
 * @return Whether the block supports the feature.
 */
export const hasAlignSupport = ( nameOrType: string | BlockType ): boolean =>
	hasBlockSupport( nameOrType, ALIGN_SUPPORT_KEY );

/**
 * Returns the block support value for align, if defined.
 *
 * @param nameOrType Block name or type object.
 * @return The block support value.
 */
export const getAlignSupport = ( nameOrType: string | BlockType ): unknown =>
	getBlockSupport( nameOrType, ALIGN_SUPPORT_KEY );

/**
 * Returns true if the block defines support for align wide.
 *
 * @param nameOrType Block name or type object.
 * @return Whether the block supports the feature.
 */
export const hasAlignWideSupport = (
	nameOrType: string | BlockType
): boolean => hasBlockSupport( nameOrType, ALIGN_WIDE_SUPPORT_KEY );

/**
 * Returns the block support value for align wide, if defined.
 *
 * @param nameOrType Block name or type object.
 * @return The block support value.
 */
export const getAlignWideSupport = (
	nameOrType: string | BlockType
): unknown => getBlockSupport( nameOrType, ALIGN_WIDE_SUPPORT_KEY );

/**
 * Determine whether there is block support for border properties.
 *
 * @param nameOrType Block name or type object.
 * @param feature    Border feature to check support for.
 *
 * @return Whether there is support.
 */
export function hasBorderSupport(
	nameOrType: string | BlockType,
	feature: string = 'any'
): boolean {
	// Block supports are not validated against a schema.
	const support = getBlockSupport( nameOrType, BORDER_SUPPORT_KEY ) as
		BorderSupport | undefined;

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
 * @param nameOrType Block name or type object.
 * @param feature    Border feature to get.
 *
 * @return The block support.
 */
export const getBorderSupport = (
	nameOrType: string | BlockType,
	feature: string
): unknown => getBlockSupport( nameOrType, [ BORDER_SUPPORT_KEY, feature ] );

/**
 * Returns true if the block defines support for color.
 *
 * @param nameOrType Block name or type object.
 * @return Whether the block supports the feature.
 */
export const hasColorSupport = (
	nameOrType: string | BlockType
): boolean | undefined => {
	// Block supports are not validated against a schema.
	const colorSupport = getBlockSupport( nameOrType, COLOR_SUPPORT_KEY ) as
		ColorSupport | undefined;
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
 * @param nameOrType Block name or type object.
 * @return Whether the block supports the feature.
 */
export const hasLinkColorSupport = (
	nameOrType: string | BlockType
): boolean => {
	// Block supports are not validated against a schema.
	const colorSupport = getBlockSupport( nameOrType, COLOR_SUPPORT_KEY ) as
		ColorSupport | undefined;

	return (
		colorSupport !== null &&
		typeof colorSupport === 'object' &&
		!! colorSupport.link
	);
};

/**
 * Returns true if the block defines support for gradient color.
 *
 * @param nameOrType Block name or type object.
 * @return Whether the block supports the feature.
 */
export const hasGradientSupport = (
	nameOrType: string | BlockType
): boolean => {
	// Block supports are not validated against a schema.
	const colorSupport = getBlockSupport( nameOrType, COLOR_SUPPORT_KEY ) as
		ColorSupport | undefined;

	return (
		colorSupport !== null &&
		typeof colorSupport === 'object' &&
		!! colorSupport.gradients
	);
};

/**
 * Returns true if the block defines support for background color.
 *
 * @param nameOrType Block name or type object.
 * @return Whether the block supports the feature.
 */
export const hasBackgroundColorSupport = (
	nameOrType: string | BlockType
): boolean | undefined => {
	// Block supports are not validated against a schema.
	const colorSupport = getBlockSupport( nameOrType, COLOR_SUPPORT_KEY ) as
		ColorSupport | undefined;

	return colorSupport && colorSupport.background !== false;
};

/**
 * Returns true if the block defines support for text-align.
 *
 * @param nameOrType Block name or type object.
 * @return Whether the block supports the feature.
 */
export const hasTextAlignSupport = (
	nameOrType: string | BlockType
): boolean => hasBlockSupport( nameOrType, TEXT_ALIGN_SUPPORT_KEY );

/**
 * Returns the block support value for text-align, if defined.
 *
 * @param nameOrType Block name or type object.
 * @return The block support value.
 */
export const getTextAlignSupport = (
	nameOrType: string | BlockType
): unknown => getBlockSupport( nameOrType, TEXT_ALIGN_SUPPORT_KEY );

/**
 * Returns true if the block defines support for background color.
 *
 * @param nameOrType Block name or type object.
 * @return Whether the block supports the feature.
 */
export const hasTextColorSupport = (
	nameOrType: string | BlockType
): boolean | undefined => {
	// Block supports are not validated against a schema.
	const colorSupport = getBlockSupport( nameOrType, COLOR_SUPPORT_KEY ) as
		ColorSupport | undefined;

	return colorSupport && colorSupport.text !== false;
};

/**
 * Get block support for color properties.
 *
 * @param nameOrType Block name or type object.
 * @param feature    Color feature to get.
 *
 * @return The block support.
 */
export const getColorSupport = (
	nameOrType: string | BlockType,
	feature: string
): unknown => getBlockSupport( nameOrType, [ COLOR_SUPPORT_KEY, feature ] );

/**
 * Returns true if the block defines support for custom class name.
 *
 * @param nameOrType Block name or type object.
 * @return Whether the block supports the feature.
 */
export const hasCustomClassNameSupport = (
	nameOrType: string | BlockType
): boolean =>
	hasBlockSupport( nameOrType, CUSTOM_CLASS_NAME_SUPPORT_KEY, true );

/**
 * Returns the block support value for custom class name, if defined.
 *
 * @param nameOrType Block name or type object.
 * @return The block support value.
 */
export const getCustomClassNameSupport = (
	nameOrType: string | BlockType
): unknown =>
	getBlockSupport( nameOrType, CUSTOM_CLASS_NAME_SUPPORT_KEY, true );

/**
 * Returns true if the block defines support for font family.
 *
 * @param nameOrType Block name or type object.
 * @return Whether the block supports the feature.
 */
export const hasFontFamilySupport = (
	nameOrType: string | BlockType
): boolean => hasBlockSupport( nameOrType, FONT_FAMILY_SUPPORT_KEY );

/**
 * Returns the block support value for font family, if defined.
 *
 * @param nameOrType Block name or type object.
 * @return The block support value.
 */
export const getFontFamilySupport = (
	nameOrType: string | BlockType
): unknown => getBlockSupport( nameOrType, FONT_FAMILY_SUPPORT_KEY );

/**
 * Returns true if the block defines support for font size.
 *
 * @param nameOrType Block name or type object.
 * @return Whether the block supports the feature.
 */
export const hasFontSizeSupport = ( nameOrType: string | BlockType ): boolean =>
	hasBlockSupport( nameOrType, FONT_SIZE_SUPPORT_KEY );

/**
 * Returns the block support value for font size, if defined.
 *
 * @param nameOrType Block name or type object.
 * @return The block support value.
 */
export const getFontSizeSupport = ( nameOrType: string | BlockType ): unknown =>
	getBlockSupport( nameOrType, FONT_SIZE_SUPPORT_KEY );

/**
 * Returns true if the block defines support for layout.
 *
 * @param nameOrType Block name or type object.
 * @return Whether the block supports the feature.
 */
export const hasLayoutSupport = ( nameOrType: string | BlockType ): boolean =>
	hasBlockSupport( nameOrType, LAYOUT_SUPPORT_KEY );

/**
 * Returns the block support value for layout, if defined.
 *
 * @param nameOrType Block name or type object.
 * @return The block support value.
 */
export const getLayoutSupport = ( nameOrType: string | BlockType ): unknown =>
	getBlockSupport( nameOrType, LAYOUT_SUPPORT_KEY );

/**
 * Returns true if the block defines support for style.
 *
 * @param nameOrType Block name or type object.
 * @return Whether the block supports the feature.
 */
export const hasStyleSupport = ( nameOrType: string | BlockType ): boolean =>
	styleSupportKeys.some( ( key ) => hasBlockSupport( nameOrType, key ) );
