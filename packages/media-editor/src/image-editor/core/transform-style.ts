/**
 * Internal dependencies
 */
import type { CropperState, Size } from './types';
import { degreesToRadians } from './math/rotation';
import { sanitizeCropperState } from './math/sanitize';

/**
 * Computes a CSS matrix() transform string from the cropper state.
 *
 * The combined transform is: translate(tx, ty) * scale(sx, sy) * rotate(r) * scale(z)
 * expressed as a 2D CSS matrix(a, b, c, d, tx, ty).
 *
 * Flip is composed outside rotation so it is viewport-relative — horizontal
 * flip mirrors across the viewport's vertical axis regardless of rotation.
 * Must match the matrix order in `createCamera` / `getImageCropBounds`.
 *
 * This is a pure function with no framework dependencies. The React hook
 * `useTransformStyle` wraps this in `useMemo` for memoization.
 *
 * @param state     The current cropper state.
 * @param imageSize The rendered image dimensions in pixels.
 * @return A CSS transform string.
 */
export function computeTransformStyle(
	state: CropperState,
	imageSize: Size
): string {
	// Sanitize so hostile state can't produce `matrix(NaN, NaN, ...)` here
	// while the parallel `createCamera` path returns a finite matrix. Both
	// paths must agree under defense-in-depth conditions.
	const safeState = sanitizeCropperState( state );
	const translateX = safeState.pan.x * imageSize.width;
	const translateY = safeState.pan.y * imageSize.height;
	const rad = degreesToRadians( safeState.rotation );
	const cos = Math.cos( rad );
	const sin = Math.sin( rad );
	const sx = safeState.flip.horizontal ? -1 : 1;
	const sy = safeState.flip.vertical ? -1 : 1;
	const z = safeState.zoom;

	// Combined: translate(tx,ty) * scale(sx,sy) * rotate(r) * scale(z)
	const a = sx * cos * z;
	const b = sy * sin * z;
	const c = -sx * sin * z;
	const d = sy * cos * z;

	return `matrix(${ a }, ${ b }, ${ c }, ${ d }, ${ translateX }, ${ translateY })`;
}
