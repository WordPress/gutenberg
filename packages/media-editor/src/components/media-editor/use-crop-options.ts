/**
 * WordPress dependencies
 */
import { useCallback, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { DEFAULT_ASPECT_RATIOS } from '../../image-editor/core/constants';
import type { AspectRatioPreset } from '../../image-editor/core/constants';
import { useMediaEditor, resolveAspectRatio } from '../../state';

/** Preset key for "Free" — no aspect lock. Round-trips through SelectControl. */
const FREE_ASPECT_RATIO_VALUE = '0';

interface UseCropOptionsArgs {
	aspectRatioPresets?: AspectRatioPreset[];
}

interface UseCropOptionsReturn {
	aspectRatioValue: string;
	setAspectRatioValue: ( value: string ) => void;
	aspectRatioOptions: AspectRatioPreset[];
	freeformCrop: boolean;
	setFreeformCrop: ( value: boolean ) => void;
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
 * sidebar tab. Reads the cropOptions slice (preset key, freeform) and
 * exposes the corresponding setters plus a render-time
 * `resolvedAspectRatio` derivation.
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
	const { aspectRatioValue, freeformCrop } = controller.cropOptions;
	const cropperImage = controller.state.image;

	const aspectRatioOptions = useMemo(
		() => getAspectRatioOptions( aspectRatioPresets ),
		[ aspectRatioPresets ]
	);

	const resolvedAspectRatio = useMemo(
		() => resolveAspectRatio( aspectRatioValue, cropperImage ),
		[ aspectRatioValue, cropperImage ]
	);

	// Sidebar UX rule: picking Free auto-enables Resize-crop (freeform)
	// when it's currently off — picking Free implies the user wants to
	// freeform-edit, and there'd otherwise be no visible affordance for
	// it. Wrapped in a gesture so the two dispatches collapse into a
	// single undo step.
	const { beginGesture, endGesture, setAspectRatioValue, setFreeformCrop } =
		controller;
	const setAspectRatioValueWithFreeformSync = useCallback(
		( value: string ) => {
			const shouldReenableFreeform =
				value === FREE_ASPECT_RATIO_VALUE && ! freeformCrop;
			if ( ! shouldReenableFreeform ) {
				setAspectRatioValue( value );
				return;
			}
			beginGesture();
			setAspectRatioValue( value );
			setFreeformCrop( true );
			endGesture();
		},
		[
			freeformCrop,
			beginGesture,
			endGesture,
			setAspectRatioValue,
			setFreeformCrop,
		]
	);

	return {
		aspectRatioValue,
		setAspectRatioValue: setAspectRatioValueWithFreeformSync,
		aspectRatioOptions,
		freeformCrop,
		setFreeformCrop: controller.setFreeformCrop,
		resolvedAspectRatio,
		resetCropOptions: controller.resetCropOptions,
	};
}
