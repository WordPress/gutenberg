import { ColorSpace, getLuminance, sRGB } from 'colorjs.io/fn';

/**
 * Shadow opacity range. The lightest background (white) gets `min`, the
 * darkest (black) gets `max`.
 */
const ELEVATION_OPACITY = { min: 0.05, max: 0.3 };

/**
 * Top-edge highlight opacity range. White gets `min` (no highlight), black
 * gets `max`.
 */
const HIGHLIGHT_OPACITY = { min: 0, max: 0.1 };

type ShadowLayer = { offsetY: number; blur: number };

/**
 * Each elevation level is two black shadows: a tight key shadow that defines
 * the edge, and a soft ambient shadow that conveys height. Both share the same
 * opacity. Every level also ends with the same 1px inset white highlight along
 * the top edge, which catches the light on darker backgrounds. Keep in sync with `tokens/elevation.json`, which holds the default
 * values (tested in `test/elevation.ts`).
 */
export const ELEVATION_LEVELS: Record<
	'xs' | 'sm' | 'md' | 'lg',
	[ key: ShadowLayer, ambient: ShadowLayer ]
> = {
	xs: [
		{ offsetY: 1, blur: 1 },
		{ offsetY: 1, blur: 3 },
	],
	sm: [
		{ offsetY: 1, blur: 2 },
		{ offsetY: 3, blur: 8 },
	],
	md: [
		{ offsetY: 2, blur: 4 },
		{ offsetY: 8, blur: 20 },
	],
	lg: [
		{ offsetY: 4, blur: 10 },
		{ offsetY: 20, blur: 48 },
	],
};

/**
 * Get the elevation shadow opacity for a background color.
 *
 * Opacity increases as the background gets darker, following the inverse
 * square root of its WCAG relative luminance (Y). √Y roughly tracks perceived
 * lightness, so opacity changes close to linearly with how light the
 * background looks.
 *
 * @param background An sRGB-parseable background color.
 * @return Shadow opacity, rounded to three decimals.
 */
export function getElevationOpacity( background: string ): number {
	return opacityForBackground( background, ELEVATION_OPACITY );
}

/**
 * Get the top-edge highlight opacity for a background color. It follows the
 * same curve as the shadows, so the highlight gets brighter as the background
 * gets darker, and is invisible on white.
 *
 * @param background An sRGB-parseable background color.
 * @return Highlight opacity, rounded to three decimals.
 */
export function getHighlightOpacity( background: string ): number {
	return opacityForBackground( background, HIGHLIGHT_OPACITY );
}

function opacityForBackground(
	background: string,
	{ min, max }: { min: number; max: number }
): number {
	ColorSpace.register( sRGB );
	const luminance = Math.min( Math.max( getLuminance( background ), 0 ), 1 );
	const opacity = max - ( max - min ) * Math.sqrt( luminance );
	return Math.round( opacity * 1000 ) / 1000;
}

const toHexAlpha = ( opacity: number ) =>
	Math.round( opacity * 255 )
		.toString( 16 )
		.padStart( 2, '0' );

/**
 * Get the `--wpds-elevation-*` custom properties for a background color, in
 * the same format as the static design tokens stylesheet.
 *
 * @param background An sRGB-parseable background color.
 * @return Custom property name and value pairs.
 */
export function elevationTokensCSS( background: string ): [ string, string ][] {
	const color = `#000000${ toHexAlpha( getElevationOpacity( background ) ) }`;
	// Always emitted, even when fully transparent, so every level has the same
	// number of layers and shadow transitions interpolate cleanly.
	const highlight = `inset 0px 1px #ffffff${ toHexAlpha(
		getHighlightOpacity( background )
	) }`;

	return Object.entries( ELEVATION_LEVELS ).map( ( [ level, layers ] ) => [
		`--wpds-elevation-${ level }`,
		[
			...layers.map(
				( { offsetY, blur } ) =>
					`0px ${ offsetY }px ${ blur }px ${ color }`
			),
			highlight,
		].join( ', ' ),
	] );
}
