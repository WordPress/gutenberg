/**
 * External dependencies
 */
import { ColorSpace, OKLCH, P3, sRGB, HSL } from 'colorjs.io/fn';

// Ensures that all color spaces used in color ramps are registered globally, a
// requirement for using colorjs.io's procedural API.
//
// See: https://colorjs.io/docs/procedural
ColorSpace.register( sRGB );
ColorSpace.register( OKLCH );
ColorSpace.register( P3 );
ColorSpace.register( HSL );
