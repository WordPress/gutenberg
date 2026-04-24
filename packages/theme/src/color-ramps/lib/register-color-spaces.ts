import { ColorSpace } from 'colorjs.io/fn';

/**
 * Ensures that the given color spaces are registered with `colorjs.io`.
 *
 * The procedural `colorjs.io/fn` API does not ship with any color spaces
 * registered by default and relies on `ColorSpace.registry` for parsing color
 * strings (e.g. `parse`, `to` with a string input) and for some internal
 * conversion lookups (e.g. `toGamut` with `method: 'css'`). Each call site
 * should pass the color spaces it explicitly references.
 *
 * Two non-obvious cases worth knowing when registering color spaces for use
 * with procedural API conversions:
 * - `parse` (and therefore `to(string, ...)`) requires `sRGB` to be registered
 * - `toGamut(..., { method: 'css' })` requires `OKLCH` to be registered
 *    regardless of the target gamut.
 *
 * @param spaces The color spaces to ensure are registered.
 */
export function ensureColorSpacesRegistered( ...spaces: ColorSpace[] ) {
	for ( const space of spaces ) {
		if ( ! ColorSpace.registry[ space.id ] ) {
			ColorSpace.register( space );
		}
	}
}
