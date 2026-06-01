/**
 * Internal dependencies
 */
import type { NormalizedRect, Size } from './types';

/**
 * Largest rect of the given pixel aspect ratio that fits inside the
 * visual bounds, centered in [0,1] × [0,1] normalized space. Returns
 * a full-frame rect (1×1) if `aspectRatio` is unset or non-positive.
 *
 * The returned rect is the same in either freeform or fixed-crop
 * mode — it's the canonical "centered crop for this ratio at this
 * canvas size".
 *
 * @param aspectRatio Desired pixel width/height ratio. `undefined`
 *                    (or 0/negative) means no lock — returns full frame.
 * @param visualSize  Rendered image dimensions in pixels.
 */
export function computeInscribedRect(
	aspectRatio: number | undefined,
	visualSize: Size
): NormalizedRect {
	let w = 1;
	let h = 1;
	if ( aspectRatio && aspectRatio > 0 && visualSize.width > 0 ) {
		// normalizedRatio = w/h in normalized space that produces the
		// desired pixel aspect ratio.
		// pixelW = w * visualW, pixelH = h * visualH
		// pixelW / pixelH = aspectRatio
		// => w / h = aspectRatio * visualH / visualW
		const normalizedRatio =
			( aspectRatio * visualSize.height ) / visualSize.width;
		if ( normalizedRatio <= 1 ) {
			w = normalizedRatio;
		} else {
			h = 1 / normalizedRatio;
		}
	}
	return {
		x: ( 1 - w ) / 2,
		y: ( 1 - h ) / 2,
		width: w,
		height: h,
	};
}
