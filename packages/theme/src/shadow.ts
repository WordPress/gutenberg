import { ColorSpace, getLuminance, sRGB, to } from 'colorjs.io/fn';

/**
 * Shadow opacity on a white background. It sets how visible every shadow
 * should be: on other backgrounds, the opacity is whatever darkens them by the
 * same perceived amount.
 */
const SHADOW_OPACITY_ON_WHITE = 0.05;

/**
 * Highest shadow opacity. Near black, a black shadow has little left to
 * darken, so no opacity reaches the target; past this cap the surface's
 * stroke does the work of separating it instead.
 */
const SHADOW_OPACITY_MAX = 0.25;

type ShadowLayer = { offsetY: number; blur: number };

/**
 * Each shadow level is two black shadows: a tight key shadow that defines
 * the edge, and a soft ambient shadow that conveys height. Both share the same
 * opacity. Keep in sync with `tokens/shadow.json`, which holds the default
 * values (tested in `test/shadow.test.ts`).
 */
export const SHADOW_LEVELS: Record<
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
 * Get the shadow opacity for a background color.
 *
 * The opacity is chosen so the shadow darkens the background by the same
 * perceived amount (CIELAB ΔL*) as a 5% shadow on white, so shadows look
 * equally strong on light, mid and dark backgrounds. It stays close to 5% on
 * light backgrounds, rises steeply on dark ones, and stops at 25%.
 *
 * @param background An sRGB-parseable background color.
 * @return Shadow opacity, rounded to three decimals.
 */
export function getShadowOpacity( background: string ): number {
	ColorSpace.register( sRGB );
	const coords = to( background, sRGB ).coords.map( ( channel ) =>
		Math.min( Math.max( channel ?? 0, 0 ), 1 )
	);
	const target = darkening( [ 1, 1, 1 ], SHADOW_OPACITY_ON_WHITE );

	if ( darkening( coords, SHADOW_OPACITY_MAX ) <= target ) {
		return SHADOW_OPACITY_MAX;
	}

	// Darkening grows with opacity, so a binary search finds the match.
	let low = 0;
	let high = SHADOW_OPACITY_MAX;
	for ( let i = 0; i < 20; i++ ) {
		const mid = ( low + high ) / 2;
		if ( darkening( coords, mid ) < target ) {
			low = mid;
		} else {
			high = mid;
		}
	}
	return Math.round( high * 1000 ) / 1000;
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
	const color = `#000000${ toHexAlpha( getShadowOpacity( background ) ) }`;

	return Object.entries( SHADOW_LEVELS ).map( ( [ level, layers ] ) => [
		`--wpds-shadow-${ level }`,
		layers
			.map(
				( { offsetY, blur } ) =>
					`0px ${ offsetY }px ${ blur }px ${ color }`
			)
			.join( ', ' ),
	] );
}
