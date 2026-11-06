import { getStyle } from '@wordpress/global-styles-engine';
import type {
	FontFamilyPreset,
	GlobalStylesConfig,
} from '@wordpress/global-styles-engine';

export const MIN_CUSTOM_FONT_SIZE = 8;
export const MAX_CUSTOM_FONT_SIZE = 160;

// Enough to compare two sizes against each other and against the theme's.
const ROOT_FONT_SIZE = 16;
const RELATIVE_UNITS = [ 'em', 'rem' ];
const SIZE_PATTERN = /^(-?[\d.]+)(px|rem|em)?$/;

// The style path behind each value the toolbar shows.
const RESOLVED_STYLES = {
	fontFamily: 'typography.fontFamily',
	fontSize: 'typography.fontSize',
	textColor: 'color.text',
} as const;

type Typography = {
	fontFamily?: string;
	fontSize?: string;
	textColor?: string;
};

/**
 * Reads a font size as a number of pixels, so two sizes can be compared.
 * Fluid sizes and other units cannot be measured without a layout, and come
 * back undefined.
 *
 * @param value A CSS font size.
 *
 * @return The size in pixels.
 */
export function parseFontSizeToPx(
	value: string | number | null | undefined
): number | undefined {
	if ( typeof value === 'number' ) {
		return Number.isFinite( value ) ? value : undefined;
	}

	if ( typeof value !== 'string' ) {
		return undefined;
	}

	const match = value.trim().match( SIZE_PATTERN );

	if ( ! match ) {
		return undefined;
	}

	const size = parseFloat( match[ 1 ] );

	if ( ! Number.isFinite( size ) ) {
		return undefined;
	}

	return RELATIVE_UNITS.includes( match[ 2 ] ) ? size * ROOT_FONT_SIZE : size;
}

/**
 * Reads a size typed into the toolbar, keeping it within the range the
 * toolbar offers.
 *
 * @param value The size that was typed.
 *
 * @return A whole number of pixels, or undefined if the value is not a size.
 */
export function clampCustomFontSize(
	value: string | number | null | undefined
): number | undefined {
	const size = parseFontSizeToPx( value );

	if ( size === undefined ) {
		return undefined;
	}

	return Math.min(
		MAX_CUSTOM_FONT_SIZE,
		Math.max( MIN_CUSTOM_FONT_SIZE, Math.round( size ) )
	);
}

/**
 * Names the font a block renders in. A theme's preset has a name of its own;
 * anything else is named by the first family in its stack, which is the one
 * that will actually be used.
 *
 * @param fontFamily   A CSS font family.
 * @param fontFamilies The theme's font family presets.
 *
 * @return What to call the font.
 */
export function getFontDisplayName(
	fontFamily: string | undefined,
	fontFamilies: FontFamilyPreset[] | undefined
): string | undefined {
	if ( ! fontFamily ) {
		return undefined;
	}

	const preset = fontFamilies?.find(
		( candidate ) => candidate.fontFamily === fontFamily
	);

	if ( preset ) {
		return preset.name;
	}

	const first = fontFamily
		.split( ',' )[ 0 ]
		.trim()
		.replace( /^["']|["']$/g, '' );

	return first || undefined;
}

/**
 * The theme.json element a block renders as, where that is more specific than
 * the block itself. Only the heading levels are: a level 2 heading takes its
 * font from `styles.elements.h2` rather than from the heading block.
 *
 * @param blockName        The block's name.
 * @param attributes       The block's attributes.
 * @param attributes.level The heading level, where the block has one.
 *
 * @return The element name.
 */
function getStyleElement(
	blockName: string,
	attributes: { level?: unknown } | undefined
): string | undefined {
	const level = attributes?.level;
	return blockName === 'core/heading' &&
		typeof level === 'number' &&
		level >= 1 &&
		level <= 6
		? `h${ level }`
		: undefined;
}

/**
 * Reads the typography and colour a block renders with when it sets none of
 * its own, taking the most specific value there is for each: the element's,
 * then the block's, then the root's.
 *
 * @param globalStyles     The merged global styles.
 * @param blockName        The block's name.
 * @param attributes       The block's attributes.
 * @param attributes.level The heading level, where the block has one.
 *
 * @return The resolved typography.
 */
export function resolveBlockTypography(
	globalStyles: GlobalStylesConfig | undefined,
	blockName: string,
	attributes?: { level?: unknown }
): Typography {
	const element = getStyleElement( blockName, attributes );

	return Object.fromEntries(
		Object.entries( RESOLVED_STYLES ).map( ( [ property, path ] ) => [
			property,
			( element &&
				getStyle< string >(
					globalStyles,
					`elements.${ element }.${ path }`
				) ) ||
				getStyle< string >( globalStyles, path, blockName ) ||
				getStyle< string >( globalStyles, path ),
		] )
	);
}
