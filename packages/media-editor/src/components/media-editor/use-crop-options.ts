/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { DEFAULT_ASPECT_RATIOS } from '../../image-editor/core/constants';
import type { AspectRatioPreset } from '../../image-editor/core/constants';
import { useMediaEditor, resolveAspectRatio } from '../../state';

interface UseCropOptionsArgs {
	aspectRatioPresets?: AspectRatioPreset[];
}

interface UseCropOptionsReturn {
	aspectRatioValue: string;
	setAspectRatioValue: ( value: string ) => void;
	aspectRatioOptions: AspectRatioPreset[];
	resolvedAspectRatio: number | undefined;
	resetCropOptions: () => void;
}

/**
 * Build the preset list shown in the dropdown — always include the
 * non-numeric presets (Free, Original) and append either the
 * caller-supplied set or the defaults.
 *
 * @param aspectRatioPresets Optional caller-supplied presets.
 * @return The full preset list to render.
 */
export function getAspectRatioOptions(
	aspectRatioPresets?: AspectRatioPreset[]
): AspectRatioPreset[] {
	return [
		...DEFAULT_ASPECT_RATIOS.filter( ( preset ) => preset.value <= 0 ),
		...( aspectRatioPresets ??
			DEFAULT_ASPECT_RATIOS.filter( ( preset ) => preset.value > 0 ) ),
	];
}

/**
 * Thin selector over the composite media-editor store for the Crop
 * sidebar tab. Reads the cropOptions slice (preset key) and exposes
 * the corresponding setters plus a render-time `resolvedAspectRatio`
 * derivation.
 *
 * No local React state, no refs, no synchronization effects — the
 * composite store is the single source of truth.
 *
 * @param args
 * @param args.aspectRatioPresets Optional caller-supplied aspect-ratio presets.
 */
export function useCropOptions( {
	aspectRatioPresets,
}: UseCropOptionsArgs = {} ): UseCropOptionsReturn {
	const controller = useMediaEditor();
	const { aspectRatioValue } = controller.cropOptions;
	const cropperImage = controller.state.image;

	const aspectRatioOptions = useMemo(
		() => getAspectRatioOptions( aspectRatioPresets ),
		[ aspectRatioPresets ]
	);

	const resolvedAspectRatio = useMemo(
		() => resolveAspectRatio( aspectRatioValue, cropperImage ),
		[ aspectRatioValue, cropperImage ]
	);

	return {
		aspectRatioValue,
		setAspectRatioValue: controller.setAspectRatioValue,
		aspectRatioOptions,
		resolvedAspectRatio,
		resetCropOptions: controller.resetCropOptions,
	};
}
