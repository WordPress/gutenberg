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
	ColorSpace.register( sRGB );
	return contrastWCAG21( colorA, colorB );
}

/**
 * Assert that a seed-color string is sRGB-parseable (hex, `rgb()`/`rgba()`, or
 * a CSS named color), throwing otherwise.
 *
 * Rejection is deterministic regardless of which `ColorSpace`s are globally
 * registered: `clampToGamut` registers `OKLCH`, which would otherwise make
 * `oklch()` strings parse, but their space id is `oklch` (not `srgb`) so they
 * are still rejected.
 *
 * @param seed The seed-color string to validate.
 * @throws If `seed` is not an sRGB-parseable string.
 */
export function assertValidSeedColor( seed: string ): void {
	ALLOWED_SEED_COLOR_SPACES.forEach( ( space ) =>
		ColorSpace.register( space )
	);

	let spaceId: string;
	try {
		( { spaceId } = parse( seed ) );
	} catch {
		throw new Error(
			`Unsupported seed color "${ seed }": expected a hex value, an \`rgb()\`/\`rgba()\` string, or a CSS named color.`
		);
	}

	if (
		! ALLOWED_SEED_COLOR_SPACES.some( ( space ) => space.id === spaceId )
	) {
		throw new Error(
			`Unsupported seed color "${ seed }": expected a hex value, an \`rgb()\`/\`rgba()\` string, or a CSS named color, but received a \`${ spaceId }\` color.`
		);
	}
}

/**
 * Make sure that a color is valid in the sRGB gamut and convert it to OKLCH.
 * @param c A `PlainColorObject`, or an sRGB-parseable string.
 */
export function clampToGamut( c: string | PlainColorObject ) {
	ColorSpace.register( sRGB );
	// Workaround for upstream toGamut(method:'css') bug.
	// https://github.com/color-js/color.js/pull/734
	ColorSpace.register( OKLCH );
	return to( toGamut( c, { space: sRGB, method: 'css' } ), OKLCH );
}
