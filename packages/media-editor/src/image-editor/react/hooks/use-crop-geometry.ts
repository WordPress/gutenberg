/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	getCropGeometrySnapshot,
	type CropGeometryBounds,
	type CropGeometrySnapshot,
	type CropPixelImageBounds,
	type CropPixelRect,
	type CropPixelRectInput,
	type CropPixelRectBounds,
	type CropPixelRectValidationResult,
	type CropPixelRectViolation,
	type CropPixelViewportBounds,
} from '../../core/crop-geometry';
import type { SourceRegion } from '../../core/source-region';
import {
	useMeasuredCropperGeometry,
	useCropper,
} from '../components/cropper-provider';

export type {
	CropGeometryBounds,
	CropGeometrySnapshot,
	CropPixelImageBounds,
	CropPixelRect,
	CropPixelRectBounds,
	CropPixelRectInput,
	CropPixelRectValidationResult,
	CropPixelRectViolation,
	CropPixelViewportBounds,
};

export interface UseCropGeometryReturn {
	isReady: boolean;
	rect: CropPixelRect | null;
	bounds: CropGeometryBounds | null;
	sourceRegion: SourceRegion | null;
	snapshot: CropGeometrySnapshot | null;
}

/**
 * Expose the current crop geometry snapshot to controls, automation, and AI
 * workflows. This hook intentionally reports facts about the current cropper
 * state; consumers derive operation-specific field behavior themselves.
 *
 * @return Current crop geometry, bounds, and source region.
 */
export function useCropGeometry(): UseCropGeometryReturn {
	const cropper = useCropper();
	const geometry = useMeasuredCropperGeometry();
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
		if ( ! geometry ) {
			return null;
		}
		return getCropGeometrySnapshot( {
			state: cropper.state,
			imageSize,
			geometry,
		} );
	}, [ cropper.state, geometry, imageSize ] );

	return {
		isReady: !! snapshot,
		rect: snapshot?.rect ?? null,
		bounds: snapshot?.bounds ?? null,
		sourceRegion: snapshot?.sourceRegion ?? null,
		snapshot,
	};
}
