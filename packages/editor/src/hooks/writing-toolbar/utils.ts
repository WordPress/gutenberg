import { getStyle } from '@wordpress/global-styles-engine';
import type {
	FontFamilyPreset,
	GlobalStylesConfig,
} from '@wordpress/global-styles-engine';
import type { WritingBlock, WritingStyle, WritingStyleGroup } from './types';

export const MIN_CUSTOM_FONT_SIZE = 8;
export const MAX_CUSTOM_FONT_SIZE = 160;

// Enough to compare two sizes against each other and against the theme's.
const ROOT_FONT_SIZE = 16;
const RELATIVE_UNITS = [ 'em', 'rem' ];
const SIZE_PATTERN = /^(-?[\d.]+)(px|rem|em)?$/;

const TYPOGRAPHY_PROPERTIES = [ 'fontFamily', 'fontSize' ] as const;
const HEADING_ELEMENT_PATTERN = /^h[1-6]$/;

type Typography = {
	fontFamily?: string;
	fontSize?: string;
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
 * Reads the typography a writing style renders with from the merged global
 * styles, taking the most specific value there is for each property: the
 * element's, then the block's, then the root's.
 *
 * @param globalStyles The merged global styles.
 * @param blockName    The block the style belongs to.
 * @param element      The theme.json element it renders as.
 *
 * @return The resolved typography.
 */
export function resolveStyleTypography(
	globalStyles: GlobalStylesConfig | undefined,
	blockName: string,
	element?: string
): Typography {
	return Object.fromEntries(
		TYPOGRAPHY_PROPERTIES.map( ( property ) => [
			property,
			( element &&
				getStyle< string >(
					globalStyles,
					`elements.${ element }.typography.${ property }`
				) ) ||
				getStyle< string >(
					globalStyles,
					`typography.${ property }`,
					blockName
				) ||
				getStyle< string >( globalStyles, `typography.${ property }` ),
		] )
	);
}

/**
 * The theme.json element a writing style renders as, where that is more
 * specific than the block it belongs to. Only the heading levels are: a level
 * 2 heading takes its font from `styles.elements.h2`.
 *
 * @param blockName The block name.
 * @param variation The block variation name.
 *
 * @return The element name.
 */
function getStyleElement(
	blockName: string,
	variation?: string
): string | undefined {
	return blockName === 'core/heading' &&
		HEADING_ELEMENT_PATTERN.test( variation ?? '' )
		? variation
		: undefined;
}

/**
 * Builds the list of text styles the writing toolbar offers: one per writing
 * block, or one per transform variation for a block that has them, so the
 * heading block contributes a style per level. Each carries the font and size
 * it renders at, for the menu to show it in.
 *
 * @param options               Options.
 * @param options.writingBlocks The writing blocks, each with its transform
 *                              variations.
 * @param options.globalStyles  The merged global styles.
 * @param options.fontFamilies  The theme's font family presets.
 *
 * @return The text styles, in the order the blocks were given.
 */
export function getWritingStyles( {
	writingBlocks,
	globalStyles,
	fontFamilies,
}: {
	writingBlocks: WritingBlock[];
	globalStyles: GlobalStylesConfig | undefined;
	fontFamilies: FontFamilyPreset[] | undefined;
} ): WritingStyle[] {
	const named = ( fontFamily?: string ) =>
		fontFamilies?.find( ( preset ) => preset.fontFamily === fontFamily )
			?.name;

	const toStyle = ( {
		key,
		label,
		blockName,
		icon,
		variation,
		attributes,
	}: Pick<
		WritingStyle,
		'key' | 'label' | 'blockName' | 'icon' | 'variation' | 'attributes'
	> ): WritingStyle => {
		const typography = resolveStyleTypography(
			globalStyles,
			blockName,
			getStyleElement( blockName, variation )
		);

		return {
			key,
			label,
			blockName,
			icon,
			variation,
			attributes,
			fontFamily: typography.fontFamily,
			fontFamilyName: named( typography.fontFamily ),
			fontSize: typography.fontSize,
		};
	};

	return writingBlocks.flatMap( ( blockType ) => {
		if ( ! blockType.variations?.length ) {
			return [
				toStyle( {
					key: blockType.name,
					label: blockType.title,
					blockName: blockType.name,
					icon: blockType.icon,
				} ),
			];
		}

		return blockType.variations.map( ( variation ) =>
			toStyle( {
				key: `${ blockType.name }:${ variation.name }`,
				label: variation.title ?? variation.name,
				blockName: blockType.name,
				// A heading level has its own icon; other variations fall
				// back to the block's, as the block switcher does.
				icon: variation.icon ?? blockType.icon,
				variation: variation.name,
				attributes: variation.attributes,
			} )
		);
	} );
}

/**
 * Gathers the text styles under the font each renders in, the way the Escher
 * experiment's Style menu does, keeping the order the fonts first appear in.
 *
 * @param styles The text styles.
 *
 * @return One group per font.
 */
export function groupWritingStylesByFont(
	styles: WritingStyle[]
): WritingStyleGroup[] {
	const groups: WritingStyleGroup[] = [];

	for ( const style of styles ) {
		const group = groups.find(
			( candidate ) => candidate.fontFamily === style.fontFamily
		);

		if ( group ) {
			group.styles.push( style );
		} else {
			groups.push( {
				name: style.fontFamilyName,
				fontFamily: style.fontFamily,
				styles: [ style ],
			} );
		}
	}

	return groups;
}

/**
 * Finds the text style a block is currently in.
 *
 * @param styles     The text styles.
 * @param blockName  The block's name.
 * @param attributes The block's attributes.
 *
 * @return The style, if the block is in one.
 */
export function findActiveWritingStyle(
	styles: WritingStyle[],
	blockName: string,
	attributes: Record< string, unknown > | undefined
): WritingStyle | undefined {
	const candidates = styles.filter(
		( style ) => style.blockName === blockName
	);

	return (
		candidates.find(
			( style ) =>
				!! style.attributes &&
				Object.entries( style.attributes ).every(
					( [ name, value ] ) => attributes?.[ name ] === value
				)
		) ?? candidates.find( ( style ) => ! style.attributes )
	);
}
