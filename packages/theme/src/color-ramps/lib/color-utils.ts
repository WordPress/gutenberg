import {
	ColorSpace,
	parse,
	to,
	toGamut,
	serialize,
	getLuminance,
	sRGB,
	OKLCH,
	type PlainColorObject,
} from 'colorjs.io/fn';

const ALLOWED_SEED_COLOR_SPACES = [ sRGB ];
const MAX_CACHED_LUMINANCES = 2_048;
const luminanceCache = new Map< string, number >();
const objectLuminanceCache = new WeakMap< PlainColorObject, number >();

ColorSpace.register( sRGB );

/**
 * Serialize a color as rounded sRGB hex.
 *
 * @param color A `PlainColorObject`, or an sRGB-parseable string (typically a
 *              hex value, e.g. `#3858e9`).
 */
export function getColorString( color: string | PlainColorObject ): string {
	const rgbRounded = serialize( to( color, sRGB ) );
	return serialize( rgbRounded, { format: 'hex' } );
}

/**
 * Get contrast value between two colors.
 * @param colorA First color: a `PlainColorObject`, or an sRGB-parseable string.
 * @param colorB Second color: a `PlainColorObject`, or an sRGB-parseable string.
 * @return WCAG 2.1 contrast ratio
 */
export function getContrast(
	colorA: string | PlainColorObject,
	colorB: string | PlainColorObject
): number {
	return getContrastFromLuminances(
		getRelativeLuminance( colorA ),
		getRelativeLuminance( colorB )
	);
}

/**
 * Return a color's non-negative relative luminance. Serialized colors use a
 * bounded cache because accent ramps share surface references. Color objects
 * use a weak cache and must not be mutated after measurement.
 *
 * @param color Color to measure.
 */
export function getRelativeLuminance(
	color: string | PlainColorObject
): number {
	if ( typeof color !== 'string' ) {
		const cachedLuminance = objectLuminanceCache.get( color );
		if ( cachedLuminance !== undefined ) {
			return cachedLuminance;
		}
		const luminance = Math.max( getLuminance( color ), 0 );
		objectLuminanceCache.set( color, luminance );
		return luminance;
	}

	const cachedLuminance = luminanceCache.get( color );
	if ( cachedLuminance !== undefined ) {
		return cachedLuminance;
	}

	const luminance = Math.max( getLuminance( color ), 0 );
	if ( luminanceCache.size >= MAX_CACHED_LUMINANCES ) {
		const oldestKey = luminanceCache.keys().next().value;
		if ( oldestKey !== undefined ) {
			luminanceCache.delete( oldestKey );
		}
	}
	luminanceCache.set( color, luminance );
	return luminance;
}

/**
 * Calculate a WCAG 2.1 contrast ratio from precomputed relative luminances.
 *
 * @param first  First relative luminance.
 * @param second Second relative luminance.
 */
export function getContrastFromLuminances(
	first: number,
	second: number
): number {
	return first > second
		? ( first + 0.05 ) / ( second + 0.05 )
		: ( second + 0.05 ) / ( first + 0.05 );
}

/**
 * Assert that a seed-color string is sRGB-parseable and fully opaque (hex,
 * `rgb()`/`rgba()`, or a CSS named color), throwing otherwise.
 *
 * Rejection is deterministic regardless of which `ColorSpace`s are globally
 * registered.
 *
 * @param seed The seed-color string to validate.
 * @throws If `seed` is not an sRGB-parseable, fully opaque string.
 */
export function assertValidSeedColor( seed: string ): void {
	let parsedColor: ReturnType< typeof parse >;
	try {
		parsedColor = parse( seed );
	} catch {
		throw new Error(
			`Unsupported seed color "${ seed }": expected a fully opaque hex value, an \`rgb()\`/\`rgba()\` string, or a CSS named color.`
		);
	}

	const { alpha = 1, spaceId } = parsedColor;

	if (
		! ALLOWED_SEED_COLOR_SPACES.some( ( space ) => space.id === spaceId )
	) {
		throw new Error(
			`Unsupported seed color "${ seed }": expected a fully opaque hex value, an \`rgb()\`/\`rgba()\` string, or a CSS named color, but received a \`${ spaceId }\` color.`
		);
	}

	if ( alpha !== 1 ) {
		throw new Error(
			`Unsupported seed color "${ seed }": expected a fully opaque color.`
		);
	}
}

/**
 * Map a color into sRGB gamut, then return its OKLCH representation.
 *
 * @param c A `PlainColorObject`, or an sRGB-parseable string.
 */
export function clampToGamut( c: string | PlainColorObject ) {
	return to( toGamut( c, { space: sRGB, method: 'css' } ), OKLCH );
}
