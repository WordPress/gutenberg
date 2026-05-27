/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { DEFAULT_ASPECT_RATIOS } from '../../image-editor/core/constants';
import type { AspectRatioPreset } from '../../image-editor/core/constants';
import { useMediaEditor, resolveAspectRatio } from '../../state';

/** Preset key for "Free" — no aspect lock. Round-trips through SelectControl. */
const FREE_ASPECT_RATIO_VALUE = '0';

// Session-scoped memory of the last aspect-ratio preset the user picked.
// Lives at module scope so it survives modal close/reopen within a page
// session but is discarded on reload — no store API surface needed.
let sessionAspectRatioValue: string | null = null;

export function getSessionAspectRatioValue(): string | null {
	return sessionAspectRatioValue;
}

/** Preset key for "Original" — the image's natural width/height ratio. */
const ORIGINAL_ASPECT_RATIO_VALUE = '-1';

/**
 * Decide whether the previously-chosen aspect-ratio preset is still
 * meaningful for the image about to be edited.
 *
 * Free and Original always apply (one is a no-op constraint, the other
 * is definitionally the image's own ratio). A fixed numeric preset only
 * applies when the image's natural ratio already matches it within a
 * small tolerance — otherwise restoring the preset would carve a
 * smaller crop than the user expects to see on open, which feels broken.
 *
 * @param storedValue   The previously-chosen preset key.
 * @param naturalWidth  The image's natural width in pixels.
 * @param naturalHeight The image's natural height in pixels.
 * @return Whether to seed the editor with `storedValue`.
 */
export function shouldRestoreAspectRatio(
	storedValue: string,
	naturalWidth: number,
	naturalHeight: number
): boolean {
	if (
		storedValue === FREE_ASPECT_RATIO_VALUE ||
		storedValue === ORIGINAL_ASPECT_RATIO_VALUE
	) {
		return true;
	}
	const ratio = parseFloat( storedValue );
	if (
		! Number.isFinite( ratio ) ||
		ratio <= 0 ||
		! ( naturalWidth > 0 ) ||
		! ( naturalHeight > 0 )
	) {
		return false;
	}
	// 0.5% relative tolerance — tight enough that an obvious mismatch
	// (e.g. 1:1 vs 16:9) is rejected, loose enough that rounding in the
	// preset value (e.g. 1.7778 vs 1920/1080) still matches.
	const imageRatio = naturalWidth / naturalHeight;
	return Math.abs( imageRatio - ratio ) / ratio < 0.005;
}

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
 * The composite store is the source of truth; the only side effect is
 * mirroring the current preset into module-scope memory so the choice
 * can be replayed when the editor reopens within the same session.
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

	useEffect( () => {
		sessionAspectRatioValue = aspectRatioValue;
	}, [ aspectRatioValue ] );

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
