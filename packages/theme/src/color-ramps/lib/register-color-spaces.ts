import { ColorSpace, OKLCH, sRGB } from 'colorjs.io/fn';

const REQUIRED_COLOR_SPACES = [ sRGB, OKLCH ];

/**
 * Ensures the color spaces required by this package are registered with
 * `colorjs.io`.
 *
 * The procedural `colorjs.io/fn` API does not ship with any color spaces
 * registered by default. Our code references color spaces by their imported
 * object (e.g. `to( color, OKLCH )`), which does not require registration.
 * Registration is only needed for:
 *
 * - Parsing color strings (e.g. `parse`, `to` with a string input). `sRGB`
 *   owns the hex and keyword parsers, which are the only string formats
 *   this package accepts as input.
 * - `toGamut(..., { method: 'css' })`, which internally resolves `OKLCH` via
 *   the registry regardless of the target gamut. This is a quirk of
 *   `colorjs.io` (the function uses `ColorSpace.get('oklch')` instead of
 *   referencing the imported `OKLCH` object) and is an upstream bug.
 *
 * @see https://github.com/color-js/color.js/pull/734
 */
export function ensureColorSpacesRegistered() {
	for ( const space of REQUIRED_COLOR_SPACES ) {
		if ( ! ColorSpace.registry[ space.id ] ) {
			ColorSpace.register( space );
		}
	}
}
