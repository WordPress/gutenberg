/**
 * External dependencies
 */
// Disable reason: ESLint resolver can't handle `exports`. Import resolver
// checking is redundant in TypeScript files.
// eslint-disable-next-line import/no-unresolved
import { ColorSpace, OKLCH, P3, sRGB, HSL } from 'colorjs.io/fn';

// Ensures that all color spaces used in color ramps are registered globally, a
// requirement for using colorjs.io's procedural API.
//
// See: https://colorjs.io/docs/procedural
ColorSpace.register( sRGB );
ColorSpace.register( OKLCH );
ColorSpace.register( P3 );
ColorSpace.register( HSL );
