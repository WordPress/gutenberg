/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { CropperState, Size } from '../core/types';

/**
 * Computes a CSS matrix() transform string from the cropper state.
 *
 * The combined transform is: translate(tx, ty) * rotate(r) * scale(sx*z, sy*z)
 * expressed as a 2D CSS matrix(a, b, c, d, tx, ty).
 *
 * @param state         The current cropper state.
 * @param containerSize The container dimensions in pixels.
 * @param imageSize     The rendered image dimensions in pixels.
 * @return A CSS transform string.
 */
export function useTransformStyle(
	state: CropperState,
	containerSize: Size,
	imageSize: Size
): string {
	return useMemo( () => {
		const translateX = state.crop.x * imageSize.width;
		const translateY = state.crop.y * imageSize.height;
		const rad = ( state.rotation * Math.PI ) / 180;
		const cos = Math.cos( rad );
		const sin = Math.sin( rad );
		const sx = state.flip.horizontal ? -1 : 1;
		const sy = state.flip.vertical ? -1 : 1;
		const z = state.zoom;

		// Combined: translate(tx,ty) * rotate(r) * scale(sx*z, sy*z)
		const a = cos * sx * z;
		const b = sin * sx * z;
		const c = -sin * sy * z;
		const d = cos * sy * z;

		return `matrix(${ a }, ${ b }, ${ c }, ${ d }, ${ translateX }, ${ translateY })`;
	}, [
		state.crop.x,
		state.crop.y,
		state.rotation,
		state.flip.horizontal,
		state.flip.vertical,
		state.zoom,
		imageSize.width,
		imageSize.height,
	] );
}
