/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	getCropGeometrySnapshot,
	type CropPixelRect,
	type CropPixelRectBounds,
} from '../../core/crop-geometry';
import type { SourceRegion } from '../../core/source-region';
import {
	useCropper,
	useCropperMeasurements,
} from '../components/cropper-provider';

export type UseCropGeometryReturn =
	| {
			isReady: false;
			rect: null;
			imageBounds: null;
			sourceRegion: null;
	  }
	| {
			isReady: true;
			rect: CropPixelRect;
			imageBounds: CropPixelRectBounds;
			sourceRegion: SourceRegion;
	  };

/**
 * Expose the current crop geometry for advanced crop controls and automation.
 *
 * Reads cropper state + measurements from the surrounding `CropperProvider`
 * and produces a snap-rotation pixel snapshot suitable for editing, display,
 * or programmatic crop generation.
 *
 * @return Current crop rectangle, image bounds, and source region.
 */
export function useCropGeometry(): UseCropGeometryReturn {
	const cropper = useCropper();
	const { cropBounds } = useCropperMeasurements();
	const imageSize = useMemo(
		() =>
			cropper.state.image
				? {
						width: cropper.state.image.naturalWidth,
						height: cropper.state.image.naturalHeight,
				  }
				: { width: 0, height: 0 },
		[ cropper.state.image ]
	);

	const snapshot = useMemo( () => {
		if ( ! cropBounds ) {
			return null;
		}
		return getCropGeometrySnapshot( {
			state: cropper.state,
			imageSize,
			imageBounds: cropBounds,
		} );
	}, [ cropper.state, cropBounds, imageSize ] );

	if ( ! snapshot ) {
		return {
			isReady: false,
			rect: null,
			imageBounds: null,
			sourceRegion: null,
		};
	}

	return {
		isReady: true,
		rect: snapshot.rect,
		imageBounds: snapshot.imageBounds,
		sourceRegion: snapshot.sourceRegion,
	};
}
