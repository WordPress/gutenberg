/**
 * The faces that clamp: the weight each one really is, and the values it
 * reports in place of that weight.
 *
 * @see https://github.com/fonttools/fontbakery/blob/main/Lib/fontbakery/checks/vendorspecific/googlefonts/weightclass.py
 */
const CLAMPED_WEIGHTS: Record<
	string,
	{ weight: number; reportedAs: number[] }
> = {
	thin: { weight: 100, reportedAs: [ 250 ] },
	extralight: { weight: 200, reportedAs: [ 250, 275 ] },
};

/**
 * Reads the true weight of a font face whose `usWeightClass` is clamped.
 *
 * Weights below 250 render poorly in some legacy Windows applications, so a
 * static font may raise Thin to 250 and ExtraLight to 275 rather than report
 * their true 100 and 200.
 *
 * @param styleName     The font's style name, such as `Thin` or `Thin Italic`.
 * @param usWeightClass The weight the font reports in its `OS/2` table.
 * @return The true weight, or `undefined` when the face is not clamped, in
 *         which case `usWeightClass` is the weight to use.
 */
export default function getUnclampedWeight(
	styleName: string | undefined,
	usWeightClass: number | undefined
): number | undefined {
	if ( ! styleName || usWeightClass === undefined ) {
		return undefined;
	}

	// Drop the slant, so that "Thin Italic" is read as "Thin".
	const weightName = styleName
		.toLowerCase()
		.replace( /italic|oblique/g, '' )
		.replace( /\s+/g, '' );

	const clamped = CLAMPED_WEIGHTS[ weightName ];
	return clamped?.reportedAs.includes( usWeightClass )
		? clamped.weight
		: undefined;
}
