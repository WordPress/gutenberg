import { ColorSpace, getLuminance, sRGB, to } from 'colorjs.io/fn';

/**
 * Reference shadow opacity on white. On other backgrounds, the scale is the
 * opacity that darkens them by the same perceived amount, divided by this.
 */
const REFERENCE_OPACITY = 0.05;

/**
 * Highest scale. Near black, a black shadow has little left to darken, so no
 * opacity reaches the target; past this cap the surface's stroke does the
 * work of separating it instead.
 */
const SCALE_MAX = 5;

/**
 * Highest opacity for any single layer once scaled, so the heaviest layers
 * don't turn into a solid dark band on dark backgrounds.
 */
const LAYER_OPACITY_MAX = 0.25;

type ShadowLayer = { offsetY: number; blur: number; opacity: number };

/**
 * Each shadow level is four black layers, with their opacity on a white
 * background. Keep in sync with `tokens/shadow.json`, which holds the default
 * values (tested in `test/shadow.test.ts`).
 */
export const SHADOW_LEVELS: Record< 'xs' | 'sm' | 'md' | 'lg', ShadowLayer[] > =
	{
		xs: [
			{ offsetY: 1, blur: 1, opacity: 0.03 },
			{ offsetY: 1, blur: 2, opacity: 0.02 },
			{ offsetY: 3, blur: 3, opacity: 0.02 },
			{ offsetY: 4, blur: 4, opacity: 0.01 },
		],
		sm: [
			{ offsetY: 1, blur: 2, opacity: 0.05 },
			{ offsetY: 2, blur: 3, opacity: 0.04 },
			{ offsetY: 6, blur: 6, opacity: 0.03 },
			{ offsetY: 8, blur: 8, opacity: 0.02 },
		],
		md: [
			{ offsetY: 2, blur: 3, opacity: 0.05 },
			{ offsetY: 4, blur: 5, opacity: 0.04 },
			{ offsetY: 12, blur: 12, opacity: 0.03 },
			{ offsetY: 16, blur: 16, opacity: 0.02 },
		],
		lg: [
			{ offsetY: 5, blur: 15, opacity: 0.08 },
			{ offsetY: 15, blur: 27, opacity: 0.07 },
			{ offsetY: 30, blur: 36, opacity: 0.04 },
			{ offsetY: 50, blur: 43, opacity: 0.02 },
		],
	};

/**
 * CIELAB lightness (L*) of a color, from its sRGB channels.
 *
 * @param coords sRGB channels, 0 to 1.
 */
function lightness( coords: number[] ): number {
	const y = getLuminance( {
		space: sRGB,
		coords: coords as [ number, number, number ],
		alpha: 1,
	} );
	const f =
		y > 216 / 24389 ? Math.cbrt( y ) : ( ( 24389 / 27 ) * y + 16 ) / 116;
	return 116 * f - 16;
}

/**
 * How much a black shadow at `opacity` darkens the background, in L*.
 * Browsers composite in gamma-encoded sRGB, so each channel scales by
 * `1 − opacity`.
 *
 * @param coords  Background sRGB channels, 0 to 1.
 * @param opacity Shadow opacity.
 */
function darkening( coords: number[], opacity: number ): number {
	return (
		lightness( coords ) -
		lightness( coords.map( ( channel ) => channel * ( 1 - opacity ) ) )
	);
}

/**
 * Get how much to strengthen the shadows for a background color.
 *
 * Black shadows show less on darker backgrounds. The scale is chosen so a
 * shadow darkens the background by the same perceived amount (CIELAB ΔL*) as
 * it does on white: 1 on white, rising on darker backgrounds, and capped at 5.
 *
 * @param background An sRGB-parseable background color.
 * @return Multiplier for every layer's opacity, rounded to one decimal.
 */
export function getShadowScale( background: string ): number {
	ColorSpace.register( sRGB );
	const coords = to( background, sRGB ).coords.map( ( channel ) =>
		Math.min( Math.max( channel ?? 0, 0 ), 1 )
	);
	const target = darkening( [ 1, 1, 1 ], REFERENCE_OPACITY );
	const max = REFERENCE_OPACITY * SCALE_MAX;

	if ( darkening( coords, max ) <= target ) {
		return SCALE_MAX;
	}

	// Darkening grows with opacity, so a binary search finds the match.
	let low = 0;
	let high = max;
	for ( let i = 0; i < 20; i++ ) {
		const mid = ( low + high ) / 2;
		if ( darkening( coords, mid ) < target ) {
			low = mid;
		} else {
			high = mid;
		}
	}
	return Math.round( ( high / REFERENCE_OPACITY ) * 10 ) / 10;
}

const toHexAlpha = ( opacity: number ) =>
	Math.round( opacity * 255 )
		.toString( 16 )
		.padStart( 2, '0' );

/**
 * Get the `--wpds-shadow-*` custom properties for a background color, in
 * the same format as the static design tokens stylesheet.
 *
 * @param background An sRGB-parseable background color.
 * @return Custom property name and value pairs.
 */
export function shadowTokensCSS( background: string ): [ string, string ][] {
	const scale = getShadowScale( background );

	return Object.entries( SHADOW_LEVELS ).map( ( [ level, layers ] ) => [
		`--wpds-shadow-${ level }`,
		layers
			.map(
				( { offsetY, blur, opacity } ) =>
					`0px ${ offsetY }px ${ blur }px #000000${ toHexAlpha(
						Math.min( opacity * scale, LAYER_OPACITY_MAX )
					) }`
			)
			.join( ', ' ),
	] );
}
