import {
	ColorSpace,
	parse,
	to,
	toGamut,
	serialize,
	clone,
	equals,
	getLuminance,
	sRGB,
	OKLCH,
	type PlainColorObject,
} from 'colorjs.io/fn';

const ALLOWED_SEED_COLOR_SPACES = [ sRGB ];
const objectLuminanceCache = new WeakMap<
	PlainColorObject,
	{
		color: PlainColorObject;
		luminance: number;
	}
>();

/**
 * Get string representation of a color.
 * @param color A `PlainColorObject`, or an sRGB-parseable string (typically a
 *              hex value, e.g. `#3858e9`).
 * @return String representation
 */
export function getColorString( color: string | PlainColorObject ): string {
	ColorSpace.register( sRGB );
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
 * Return a color's non-negative relative luminance. Color objects use a weak
 * cache with snapshots to detect mutations.
 *
 * @param color Color to measure.
 */
function getRelativeLuminance( color: string | PlainColorObject ): number {
	if ( typeof color === 'string' ) {
		ColorSpace.register( sRGB );
		return Math.max( getLuminance( color ), 0 );
	}

	const cachedLuminance = objectLuminanceCache.get( color );
	if ( cachedLuminance && equals( cachedLuminance.color, color ) ) {
		return cachedLuminance.luminance;
	}

	const luminance = Math.max( getLuminance( color ), 0 );
	objectLuminanceCache.set( color, {
		color: clone( color ),
		luminance,
	} );
	return luminance;
}

/**
 * Calculate a WCAG 2.1 contrast ratio from precomputed relative luminances.
 *
 * @param first  First relative luminance.
 * @param second Second relative luminance.
 */
function getContrastFromLuminances( first: number, second: number ): number {
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
	ALLOWED_SEED_COLOR_SPACES.forEach( ( space ) =>
		ColorSpace.register( space )
	);

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
 * Make sure that a color is valid in the sRGB gamut and convert it to OKLCH.
 * @param c A `PlainColorObject`, or an sRGB-parseable string.
 */
export function clampToGamut( c: string | PlainColorObject ) {
	ColorSpace.register( sRGB );
	return to( toGamut( c, { space: sRGB, method: 'css' } ), OKLCH );
}
