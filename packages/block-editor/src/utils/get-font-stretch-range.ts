import {
	coverageRange,
	resolveFontFaceCapabilities,
	type FontAxisCoverage,
} from './font-face-capabilities';
import type { FontFamilyFace } from './types';

/**
 * The widths a variable font can draw, as percentages.
 */
export type FontStretchRange = FontAxisCoverage;

/**
 * Returns the width range that a font family's variable faces declare.
 *
 * A face declares a variable `wdth` axis with a range in `fontStretch`, such as
 * `"25% 151%"`. Either end may be named rather than written as a percentage,
 * since the descriptor takes the same keywords the property does. When several
 * faces declare ranges, the result spans all of them. A family whose faces each
 * declare one width has no range: those are the widths it draws, with nothing
 * between them.
 *
 * @param fontFamilyFaces Font family faces from theme.json.
 * @return The range, or `undefined` when no face declares one.
 */
export function getFontStretchRange(
	fontFamilyFaces: FontFamilyFace[] | undefined
): FontStretchRange | undefined {
	return coverageRange(
		resolveFontFaceCapabilities( fontFamilyFaces ).stretch
	);
}
