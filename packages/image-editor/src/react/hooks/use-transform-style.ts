import { useMemo } from '@wordpress/element';
import type { InternalImageEditorState, Size } from '../../core/types';
import { computeTransformStyle } from '../../core/transform-style';

/**
 * React hook that computes a memoized CSS matrix() transform string
 * from the editor state.
 *
 * Delegates to the pure `computeTransformStyle` function in core.
 *
 * @param state     The current editor state.
 * @param imageSize The rendered image dimensions in pixels.
 * @return A CSS transform string.
 */
export function useTransformStyle(
	state: InternalImageEditorState,
	imageSize: Size
): string {
	return useMemo(
		() => computeTransformStyle( state, imageSize ),
		[ state, imageSize ]
	);
}
