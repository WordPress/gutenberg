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
	type CropPixelRectInput,
	type CropPixelRectBounds,
	type CropPixelRectValidationResult,
	type CropPixelRectViolation,
} from '../../core/crop-geometry';
import type { SourceRegion } from '../../core/source-region';
import {
	useCropperImageBounds,
	useCropper,
} from '../components/cropper-provider';

export type {
	CropPixelRect,
	CropPixelRectBounds,
	CropPixelRectInput,
	CropPixelRectValidationResult,
	CropPixelRectViolation,
};

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
 * Expose the current crop geometry to controls, automation, and AI
 * workflows. This hook intentionally reports facts about the current cropper
 * state; consumers derive operation-specific field behavior themselves.
 *
 * @return Current crop rectangle, image bounds, and source region.
 */
export function useCropGeometry(): UseCropGeometryReturn {
	const cropper = useCropper();
	const measuredImageBounds = useCropperImageBounds();
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
		if ( ! measuredImageBounds ) {
			return null;
		}
		return getCropGeometrySnapshot( {
			state: cropper.state,
			imageSize,
			imageBounds: measuredImageBounds,
		} );
	}, [ cropper.state, measuredImageBounds, imageSize ] );

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
