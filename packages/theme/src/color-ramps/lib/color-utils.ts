import {
	ColorSpace,
	parse,
	to,
	toGamut,
	serialize,
	contrastWCAG21,
	sRGB,
	OKLCH,
	type PlainColorObject,
} from 'colorjs.io/fn';

const ALLOWED_SEED_COLOR_SPACES = [ sRGB ];

/**
 * Serialize a color as rounded sRGB hex.
 *
 * @param color A `PlainColorObject`, or an sRGB-parseable string (typically a
 *              hex value, e.g. `#3858e9`).
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
	ColorSpace.register( sRGB );
	return contrastWCAG21( colorA, colorB );
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
	ColorSpace.register( sRGB );
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
	if ( typeof c === 'string' ) {
		ColorSpace.register( sRGB );
	}
	return to( toGamut( c, { space: sRGB, method: 'css' } ), OKLCH );
}
