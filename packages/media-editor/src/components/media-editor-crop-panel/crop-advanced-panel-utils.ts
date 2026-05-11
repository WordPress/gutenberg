/**
 * Internal dependencies
 */
import { MAX_ROTATION_OFFSET } from '../../image-editor/core/constants';
import type {
	CropPixelRect,
	CropPixelRectBounds,
} from '../../image-editor/core/crop-geometry';
import {
	INPUT_VALUE_EPSILON,
	makeRange,
	snapInputValueToStep,
	type CropInputRange,
} from './crop-input-utils';

export const FINE_ROTATION_COMMIT_STEP = 0.5;

export function getFineRotationRange(): CropInputRange {
	return makeRange(
		-MAX_ROTATION_OFFSET + FINE_ROTATION_COMMIT_STEP,
		MAX_ROTATION_OFFSET - FINE_ROTATION_COMMIT_STEP
	);
}

export function getWidthRange(
	rect: CropPixelRect,
	imageBounds: CropPixelRectBounds,
	aspectRatio: number | undefined,
	freeformCrop: boolean
): CropInputRange {
	if ( ! freeformCrop ) {
		return makeRange( rect.width, rect.width, false );
	}

	let minWidth = imageBounds.minWidth;
	let maxWidth = imageBounds.maxWidth;

	if ( aspectRatio && aspectRatio > 0 ) {
		minWidth = Math.max( minWidth, imageBounds.minHeight * aspectRatio );
		maxWidth = Math.min( maxWidth, imageBounds.maxHeight * aspectRatio );
	}

	return makeRange( minWidth, maxWidth );
}

export function getHeightRange(
	rect: CropPixelRect,
	imageBounds: CropPixelRectBounds,
	aspectRatio: number | undefined,
	freeformCrop: boolean
): CropInputRange {
	if ( ! freeformCrop ) {
		return makeRange( rect.height, rect.height, false );
	}

	let minHeight = imageBounds.minHeight;
	let maxHeight = imageBounds.maxHeight;

	if ( aspectRatio && aspectRatio > 0 ) {
		minHeight = Math.max( minHeight, imageBounds.minWidth / aspectRatio );
		maxHeight = Math.min( maxHeight, imageBounds.maxWidth / aspectRatio );
	}

	return makeRange( minHeight, maxHeight );
}

export function getVisualRotationDirection( flip: {
	horizontal: boolean;
	vertical: boolean;
} ): 1 | -1 {
	return flip.horizontal !== flip.vertical ? -1 : 1;
}

export function getFineRotationOffset(
	rotation: number,
	flip: { horizontal: boolean; vertical: boolean }
): number {
	const baseAngle = Math.round( rotation / 90 ) * 90;
	return ( rotation - baseAngle ) * getVisualRotationDirection( flip );
}

export function clampFineRotationOffset( value: number ): number {
	const max = MAX_ROTATION_OFFSET - FINE_ROTATION_COMMIT_STEP;
	return Math.max(
		-max,
		Math.min(
			max,
			snapInputValueToStep( value, FINE_ROTATION_COMMIT_STEP )
		)
	);
}

export function hasFineRotationChanged( a: number, b: number ): boolean {
	return Math.abs( a - b ) >= INPUT_VALUE_EPSILON;
}
