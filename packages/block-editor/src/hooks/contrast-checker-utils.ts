import { colord, extend } from 'colord';
import a11yPlugin from 'colord/plugins/a11y';

extend( [ a11yPlugin ] );

// Computed styles serialize sRGB colors as `rgb()` or `rgba()`; anything else
// (`oklch()`, `color()`, `color-mix()`, `currentcolor`) is not compared.
const RGB_COLOR = /rgba?\([^)]*\)/g;
const OTHER_COLOR =
	/\b(?:oklch|oklab|lch|lab|hwb|color|color-mix|light-dark)\(|currentcolor/i;

/**
 * Returns the stop colors of a computed `background-image` made only of
 * gradients, or `null` when it holds an image or a color that can't be read.
 *
 * @param backgroundImage Computed `background-image` value.
 * @return The stop colors, or `null`.
 */
export function getGradientStopColors(
	backgroundImage: string
): string[] | null {
	if (
		! backgroundImage ||
		'none' === backgroundImage ||
		backgroundImage.includes( 'url(' ) ||
		! backgroundImage.includes( 'gradient(' ) ||
		OTHER_COLOR.test( backgroundImage )
	) {
		return null;
	}

	return backgroundImage.match( RGB_COLOR );
}

/**
 * Returns the opaque color with the lowest contrast against the backdrop.
 * Translucent colors are skipped, as what shows through them is unknown.
 *
 * @param colors   Candidate colors.
 * @param backdrop Backdrop color.
 * @return The lowest contrast color, if any is opaque.
 */
export function getLowestContrastColor(
	colors: string[],
	backdrop: string
): string | undefined {
	let lowest: string | undefined;
	let lowestContrast = Infinity;
	for ( const color of colors ) {
		const parsed = colord( color );
		if ( parsed.alpha() < 1 ) {
			continue;
		}
		const contrast = parsed.contrast( backdrop );
		if ( contrast < lowestContrast ) {
			lowest = color;
			lowestContrast = contrast;
		}
	}
	return lowest;
}
