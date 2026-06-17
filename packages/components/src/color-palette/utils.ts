/**
 * External dependencies
 */
import { colord, extend } from 'colord';
import namesPlugin from 'colord/plugins/names';
import a11yPlugin from 'colord/plugins/a11y';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type {
	ColorEditingProps,
	ColorObject,
	ColorPaletteProps,
	PaletteObject,
} from './types';
import { kebabCase } from '../utils/strings';

extend( [ namesPlugin, a11yPlugin ] );

/**
 * Checks if a color value is a simple CSS color.
 *
 * @param value The color value to check.
 * @return A boolean indicating whether the color value is a simple CSS color.
 */
export const isSimpleCSSColor = ( value: string ): boolean => {
	const valueIsCssVariable = /var\(/.test( value ?? '' );
	const valueIsColorMix = /color-mix\(/.test( value ?? '' );
	return ! valueIsCssVariable && ! valueIsColorMix;
};

/**
 * Case-insensitive, whitespace-insensitive equality for raw color strings.
 * Used to detect whether a color value actually changed (NOT for matching a
 * value against a palette — see `findSelectedColorEntry` for that).
 *
 * @param a First color string.
 * @param b Second color string.
 * @return Whether the two color strings are equal after normalization.
 */
export const colorsAreEqual = ( a?: string, b?: string ): boolean =>
	( a ?? '' ).trim().toLocaleLowerCase() ===
	( b ?? '' ).trim().toLocaleLowerCase();

/**
 * Whether `colorEditing` is active enough to show the editing UI.
 *
 * @param colorEditing
 * @param options
 * @param options.disableCustomColors
 * @param options.requireCallbacks
 * @return Whether editing UI should be shown.
 */
export function isColorEditingEnabled(
	colorEditing?: ColorEditingProps | null,
	options?: {
		disableCustomColors?: boolean;
		requireCallbacks?: boolean;
	}
): boolean {
	if ( ! colorEditing ) {
		return false;
	}
	if ( options?.disableCustomColors ) {
		return false;
	}
	if ( ! Object.keys( colorEditing.capabilities ?? {} ).length ) {
		return false;
	}
	if ( options?.requireCallbacks ) {
		return !! (
			colorEditing.onAdd ||
			colorEditing.onUpdate ||
			colorEditing.onDelete
		);
	}
	return true;
}

/**
 * Normalizes `colors` into an array of palette objects regardless of input
 * shape, so callers can traverse palettes without repeated type assertions.
 *
 * @param colors Palette input from `ColorPalette`.
 */
export function toPaletteObjects(
	colors: ColorPaletteProps[ 'colors' ] = []
): PaletteObject[] {
	return isMultiplePaletteArray( colors )
		? colors
		: [ { name: '', colors: colors as ColorObject[] } ];
}

/**
 * Returns the flat color list when `colors` is a single palette, or `[]` when
 * multiple palettes are in use.
 *
 * @param colors Palette input from `ColorPalette`.
 */
export function toColorObjects(
	colors: ColorPaletteProps[ 'colors' ] = []
): ColorObject[] {
	return isMultiplePaletteArray( colors ) ? [] : ( colors as ColorObject[] );
}

/**
 * Resolves the display name for the currently selected color value.
 *
 * @param currentValue          The selected color value.
 * @param colors                The palette(s) to look through.
 * @param _showMultiplePalettes Kept for backwards-compatible signature.
 * @param selectedSlug          Optional slug that takes priority over value matching.
 * @return The matched color name, `'Custom'` for unmatched values, or `''` when empty.
 */
export const extractColorNameFromCurrentValue = (
	currentValue?: ColorPaletteProps[ 'value' ],
	colors: ColorPaletteProps[ 'colors' ] = [],
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_showMultiplePalettes: boolean = false,
	selectedSlug?: ColorPaletteProps[ 'selectedSlug' ]
) => {
	if ( ! currentValue ) {
		return '';
	}
	const found = findSelectedColorEntry( currentValue, colors, selectedSlug );
	return found
		? found.color.name
		: // translators: shown when the user has picked a custom color (i.e not in the palette of colors).
		  __( 'Custom' );
};

// The PaletteObject type has a `colors` property (an array of ColorObject),
// while the ColorObject type has a `color` property (the CSS color value).
export const isMultiplePaletteObject = (
	obj: PaletteObject | ColorObject
): obj is PaletteObject =>
	Array.isArray( ( obj as PaletteObject ).colors ) && ! ( 'color' in obj );

export const isMultiplePaletteArray = (
	arr: ( PaletteObject | ColorObject )[]
): arr is PaletteObject[] => {
	return (
		arr.length > 0 &&
		arr.every( ( colorObj ) => isMultiplePaletteObject( colorObj ) )
	);
};

/**
 * Transform a CSS variable used as background color into the color value itself.
 *
 * @param value   The color value that may be a CSS variable.
 * @param element The element for which to get the computed style.
 * @return The background color value computed from a element.
 */
export const normalizeColorValue = (
	value: string | undefined,
	element: HTMLElement | null
) => {
	if ( ! value || ! element || isSimpleCSSColor( value ) ) {
		return value;
	}

	const { ownerDocument } = element;
	const { defaultView } = ownerDocument;
	const computedBackgroundColor =
		defaultView?.getComputedStyle( element ).backgroundColor;

	return computedBackgroundColor
		? colord( computedBackgroundColor ).toHex()
		: value;
};

// Slug prefix for user-managed custom colors (e.g. `custom-my-color`), matching core's `theme.json` convention and `--wp--preset--color--custom-*` CSS variables.
export const CUSTOM_COLOR_SLUG_PREFIX = 'custom-';

// Slug for the user-managed custom palette in `MultiplePalettes`.
export const CUSTOM_PALETTE_SLUG = 'custom';

/**
 * Generates the slug for a custom color from its display name.
 *
 * @param name The (potentially empty) display name.
 * @return The slug.
 */
export const slugifyCustomColorName = ( name: string ): string => {
	const base = kebabCase( name ?? '' );
	return `${ CUSTOM_COLOR_SLUG_PREFIX }${ base }`;
};

/**
 * Generates a unique custom color slug, following the same convention as
 * PaletteEdit: the first duplicate slug gets `-1`, then `-2`, and so on.
 *
 * @param name         The name to test.
 * @param customColors Existing custom colors.
 * @param ignoredSlug  Optional slug to ignore, used when editing a color.
 * @return The unique custom color slug.
 */
export const getUniqueCustomColorSlug = (
	name: string,
	customColors: ColorObject[] = [],
	ignoredSlug?: string
): string => {
	const baseSlug = slugifyCustomColorName( name );
	const usedSlugs = new Set(
		customColors
			.map( ( customColor ) => customColor.slug )
			.filter( ( slug ) => slug && slug !== ignoredSlug )
	);

	if ( ! usedSlugs.has( baseSlug ) ) {
		return baseSlug;
	}

	let suffix = 1;
	let nextSlug = `${ baseSlug }-${ suffix }`;
	while ( usedSlugs.has( nextSlug ) ) {
		suffix += 1;
		nextSlug = `${ baseSlug }-${ suffix }`;
	}
	return nextSlug;
};

/**
 * Finds the currently-selected color entry across one or more palettes.
 *
 * @param value        The currently selected color value, hex or CSS variable.
 * @param colors       The palette(s) to look through.
 * @param selectedSlug Optional slug that takes priority over value matching.
 * @return The matched palette entry and the slug of the palette it belongs
 *         to, or `undefined` when nothing matches.
 */
export const findSelectedColorEntry = (
	value: string | undefined,
	colors: ColorPaletteProps[ 'colors' ] = [],
	selectedSlug?: string
): { color: ColorObject; paletteSlug?: string } | undefined => {
	if ( ! value ) {
		return undefined;
	}

	const isSimple = isSimpleCSSColor( value );
	const normalizedValue = isSimple ? colord( value ).toHex() : value;

	for ( const palette of toPaletteObjects( colors ) ) {
		for ( const entry of palette.colors ) {
			if ( selectedSlug ) {
				if ( entry.slug === selectedSlug ) {
					return { color: entry, paletteSlug: palette.slug };
				}
				continue;
			}
			const normalizedEntry = isSimple
				? colord( entry.color ).toHex()
				: entry.color;
			if ( normalizedEntry === normalizedValue ) {
				return { color: entry, paletteSlug: palette.slug };
			}
		}
	}

	return undefined;
};
