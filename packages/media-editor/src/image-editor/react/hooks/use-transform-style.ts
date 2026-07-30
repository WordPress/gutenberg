/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { CropperState, Size } from '../../core/types';
import { computeTransformStyle } from '../../core/transform-style';

/**
 * React hook that computes a memoized CSS matrix() transform string
 * from the cropper state.
 *
 * Delegates to the pure `computeTransformStyle` function in core.
 *
 * @param state     The current cropper state.
 * @param imageSize The rendered image dimensions in pixels.
 * @return A CSS transform string.
 */
export function useTransformStyle(
	state: CropperState,
	imageSize: Size
): string {
	return useMemo(
		() => computeTransformStyle( state, imageSize ),
		[ state, imageSize ]
	);
}
