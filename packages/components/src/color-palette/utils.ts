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
import type { ColorObject, ColorPaletteProps, PaletteObject } from './types';

extend( [ namesPlugin, a11yPlugin ] );

/**
 * Checks if a color value is a simple CSS color.
 *
 * @param value The color value to check.
 * @return A boolean indicating whether the color value is a simple CSS color.
 */
const isSimpleCSSColor = ( value: string ): boolean => {
	const valueIsCssVariable = /var\(/.test( value ?? '' );
	const valueIsColorMix = /color-mix\(/.test( value ?? '' );
	return ! valueIsCssVariable && ! valueIsColorMix;
};

export const extractColorNameFromCurrentValue = (
	currentValue?: ColorPaletteProps[ 'value' ],
	colors: ColorPaletteProps[ 'colors' ] = [],
	showMultiplePalettes: boolean = false
) => {
	if ( ! currentValue ) {
		return '';
	}
	const currentValueIsSimpleColor = currentValue
		? isSimpleCSSColor( currentValue )
		: false;
	const normalizedCurrentValue = currentValueIsSimpleColor
		? colord( currentValue ).toHex()
		: currentValue;

	// Normalize format of `colors` to simplify the following loop
	type normalizedPaletteObject = { colors: ColorObject[] };
	const colorPalettes: normalizedPaletteObject[] = showMultiplePalettes
		? ( colors as PaletteObject[] )
		: [ { colors: colors as ColorObject[] } ];
	for ( const { colors: paletteColors } of colorPalettes ) {
		for ( const { name: colorName, color: colorValue } of paletteColors ) {
			const normalizedColorValue = currentValueIsSimpleColor
				? colord( colorValue ).toHex()
				: colorValue;

			if ( normalizedCurrentValue === normalizedColorValue ) {
				return colorName;
			}
		}
	}

	// translators: shown when the user has picked a custom color (i.e not in the palette of colors).
	return __( 'Custom' );
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
