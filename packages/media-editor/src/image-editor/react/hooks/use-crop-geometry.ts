/**
 * WordPress dependencies
 */
import { useCallback, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	applyCropGeometryOperation,
	getCropGeometryCapabilities,
	getCropGeometryRange,
	getCropGeometrySourceRegion,
	getCropPixelRect,
	isCropGeometryReady,
	type CropGeometryApplyOperation,
	type CropGeometryCapabilities,
	type CropGeometryOperation,
	type CropGeometryOptions,
	type CropGeometryRange,
	type CropPixelRect,
} from '../../core/crop-geometry';
import type { SourceRegion } from '../../core/source-region';
import { useCropperGeometry, useCropper } from '../components/cropper-provider';

export type {
	CropGeometryApplyOperation,
	CropGeometryCapabilities,
	CropGeometryOperation,
	CropGeometryOptions,
	CropGeometryRange,
	CropPixelRect,
};

export interface UseCropGeometryReturn {
	isReady: boolean;
	rect: CropPixelRect | null;
	sourceRegion: SourceRegion | null;
	capabilities: CropGeometryCapabilities;
	getRange: ( operation: CropGeometryOperation ) => CropGeometryRange;
	applyGeometryOperation: ( operation: CropGeometryApplyOperation ) => void;
}

const EMPTY_CAPABILITIES: CropGeometryCapabilities = {
	canMoveX: false,
	canMoveY: false,
	canResizeWidth: false,
	canResizeHeight: false,
	hasLockedAspectRatio: false,
};

const EMPTY_RANGE: CropGeometryRange = {
	minValue: 0,
	maxValue: 0,
	minDelta: 0,
	maxDelta: 0,
	canApply: false,
};

/**
 * Expose current crop geometry and operation-aware constraints to controls,
 * automation, and AI workflows.
 *
 * @param options Crop mode options not stored in CropperState.
 * @return Current crop geometry, capabilities, and constrained operations.
 */
export function useCropGeometry(
	options: CropGeometryOptions = {}
): UseCropGeometryReturn {
	const cropper = useCropper();
	const geometry = useCropperGeometry();
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

	const input = useMemo( () => {
		if ( ! geometry ) {
			return null;
		}
		return {
			state: cropper.state,
			imageSize,
			geometry,
			freeformCrop: options.freeformCrop,
			aspectRatio: options.aspectRatio,
		};
	}, [
		cropper.state,
		geometry,
		imageSize,
		options.freeformCrop,
		options.aspectRatio,
	] );

	const isReady = !! input && isCropGeometryReady( input );
	const rect =
		isReady && input ? getCropPixelRect( input.state, imageSize ) : null;
	const sourceRegion =
		isReady && input ? getCropGeometrySourceRegion( input ) : null;
	const capabilities =
		isReady && input
			? getCropGeometryCapabilities( input )
			: EMPTY_CAPABILITIES;

	const getRange = useCallback(
		( operation: CropGeometryOperation ): CropGeometryRange => {
			if ( ! input || ! isCropGeometryReady( input ) ) {
				return EMPTY_RANGE;
			}
			return getCropGeometryRange( input, operation );
		},
		[ input ]
	);

	const applyGeometryOperation = useCallback(
		( operation: CropGeometryApplyOperation ) => {
			if ( ! input || ! isCropGeometryReady( input ) ) {
				return;
			}
			const nextRect = applyCropGeometryOperation( input, operation );
			if ( nextRect ) {
				cropper.setCropRect( nextRect );
			}
		},
		[ cropper, input ]
	);

	return {
		isReady,
		rect,
		sourceRegion,
		capabilities,
		getRange,
		applyGeometryOperation,
	};
}
