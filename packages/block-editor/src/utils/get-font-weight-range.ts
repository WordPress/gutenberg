import {
	coverageRange,
	resolveFontFaceCapabilities,
	type FontAxisCoverage,
} from './font-face-capabilities';
import type { FontFamilyFace } from './types';

/**
 * The weights a variable font can draw.
 */
export type FontWeightRange = FontAxisCoverage;

/**
 * Returns the weight range that a font family's variable faces declare.
 *
 * A face declares a variable `wght` axis with a range in `fontWeight`, such as
 * `"100 900"`. Either end may be a keyword: `"normal 900"` is 400 to 900. When
 * several faces declare ranges, the result spans all of them. A family whose
 * faces each declare one weight has no range: those are the weights it draws.
 *
 * @param fontFamilyFaces Font family faces from theme.json.
 * @return The range, or `undefined` when no face declares one.
 */
export function getFontWeightRange(
	fontFamilyFaces: FontFamilyFace[] | undefined
): FontWeightRange | undefined {
	return coverageRange(
		resolveFontFaceCapabilities( fontFamilyFaces ).weight
	);
}
