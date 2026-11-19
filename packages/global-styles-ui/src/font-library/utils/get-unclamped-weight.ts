/**
 * The `OS/2.usWeightClass` values a clamped face reports.
 *
 * Weights below 250 render poorly in some legacy Windows applications, so
 * static fonts may raise Thin to 250 and ExtraLight to 275 rather than use
 * their true 100 and 200. Google Fonts' QA tool accepts either value for
 * those two faces.
 *
 * @see https://github.com/fonttools/fontbakery/blob/main/Lib/fontbakery/checks/vendorspecific/googlefonts/weightclass.py
 */
const CLAMPED_WEIGHT_CLASSES = [ 250, 275 ];

/**
 * The faces that clamp, and the weight each one really is.
 *
 * Only Thin and ExtraLight are listed. Any other style name reporting a
 * clamped value is numbered by its author rather than clamped — Lato gives
 * Hairline 250 and Thin 275 — and must keep the weight it reports.
 */
const CLAMPED_WEIGHTS: Record< string, number > = {
	thin: 100,
	extralight: 200,
};

/**
 * Reads the true weight of a font face whose `usWeightClass` is clamped.
 *
 * A font face is identified by its family, style and weight, so two faces
 * reporting the same weight cannot be told apart and the second one fails to
 * install as a duplicate. Google Fonts' static Noto Serif reports 250 for both
 * its Thin and its ExtraLight face, which is what makes the two collide; their
 * style names still distinguish them.
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
	if (
		! styleName ||
		usWeightClass === undefined ||
		! CLAMPED_WEIGHT_CLASSES.includes( usWeightClass )
	) {
		return undefined;
	}

	// Drop the slant, so that "Thin Italic" is read as "Thin".
	const weightName = styleName
		.toLowerCase()
		.replace( /italic|oblique/g, '' )
		.replace( /\s+/g, '' );

	return CLAMPED_WEIGHTS[ weightName ];
}
