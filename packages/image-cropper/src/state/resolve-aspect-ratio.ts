import { ORIGINAL_ASPECT_RATIO, type CropGeometry } from '../core';

/**
 * Resolve an aspect-ratio preset value (the string a dropdown
 * round-trips) into a numeric width/height ratio for the cropper.
 *
 * - `'0'` → `undefined` (Free; no lock)
 * - `'-1'` (Original) → image's natural width / height, or `undefined`
 *   if no image is loaded.
 * - Any positive decimal → the parsed number.
 *
 * @param presetKey    Preset value from the dropdown.
 * @param cropperImage The cropper's loaded image, or `null`.
 * @return The resolved ratio, or `undefined` for Free / unresolvable.
 */
export function resolveAspectRatio(
	presetKey: string,
	cropperImage: CropGeometry[ 'image' ] | null
): number | undefined {
	const num = parseFloat( presetKey );
	if ( num === 0 || Number.isNaN( num ) ) {
		return undefined;
	}
	if ( num === ORIGINAL_ASPECT_RATIO ) {
		if (
			cropperImage &&
			cropperImage.naturalWidth > 0 &&
			cropperImage.naturalHeight > 0
		) {
			return cropperImage.naturalWidth / cropperImage.naturalHeight;
		}
		return undefined;
	}
	if ( num > 0 ) {
		return num;
	}
	return undefined;
}
