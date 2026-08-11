import { useMemo } from '@wordpress/element';
import type { CropperState, Size } from '../../core/types';
import type { NormalizedCropBounds } from '../../core/crop-geometry';
import { getImageFit } from '../../core/camera';
import { getImageCropBounds } from '../../core/containment';

export interface CropperMeasurements {
	/** Fitted (unrotated) image element dimensions in pixels. */
	elementSize: Size;
	/** Visual (rotated) image bounding box in pixels. */
	visualSize: Size;
	/**
	 * Normalized crop bounds describing how far a crop edge can reach in the
	 * cropper's normalized space. `undefined` until the canvas has been
	 * measured and an image has loaded.
	 */
	cropBounds: NormalizedCropBounds | undefined;
}

/**
 * Derive cropper measurements from state and a measured canvas size.
 *
 * Shared by `<Cropper>` (which always derives locally for its own rendering)
 * and `<CropperProvider>` (which derives once for sibling consumers). Pure
 * function of its inputs — same arguments always produce the same output.
 *
 * @param state      Cropper state.
 * @param canvasSize Measured canvas size in pixels.
 * @return Derived element / visual / bounds measurements.
 */
export function useDerivedCropperMeasurements(
	state: CropperState,
	canvasSize: Size
): CropperMeasurements {
	const naturalWidth = state.image?.naturalWidth ?? 0;
	const naturalHeight = state.image?.naturalHeight ?? 0;

	const { elementSize, visualSize } = useMemo(
		() =>
			getImageFit(
				canvasSize,
				{ width: naturalWidth, height: naturalHeight },
				state.rotation
			),
		[ canvasSize, naturalWidth, naturalHeight, state.rotation ]
	);

	const cropBounds = useMemo< NormalizedCropBounds | undefined >( () => {
		if ( ! state.image || elementSize.width === 0 ) {
			return undefined;
		}
		return getImageCropBounds( state, elementSize, visualSize );
	}, [ state, elementSize, visualSize ] );

	return useMemo< CropperMeasurements >(
		() => ( { elementSize, visualSize, cropBounds } ),
		[ elementSize, visualSize, cropBounds ]
	);
}
