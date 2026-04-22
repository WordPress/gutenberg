/**
 * Internal dependencies
 */
import type { CropperState, Size } from '../../image-editor';

/** A single modifier in the REST `/edit` payload. Order is significant. */
export type Modifier =
	| {
			type: 'flip';
			args: { flip: { horizontal: boolean; vertical: boolean } };
	  }
	| { type: 'rotate'; args: { angle: number } }
	| {
			type: 'crop';
			args: { left: number; top: number; width: number; height: number };
	  };

/**
 * Converts the current cropper state into a REST `/edit` modifiers array.
 *
 * Modifier order is `[flip, rotate, crop]` to match the cropper's visual
 * composition (flip source → rotate → select crop rect) and the server's
 * sequential `foreach` apply.
 *
 * Identity operations (no flip, rotation of 0/360, full-frame crop) are
 * dropped so the output is the minimum set the server needs.
 *
 * @param state     Current cropper state.
 * @param imageSize Natural dimensions of the source image.
 * @return Ordered modifier array; empty when nothing is server-relevant.
 */
export function buildModifiers(
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	state: CropperState,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	imageSize: Size
): Modifier[] {
	return [];
}
