/**
 * Internal dependencies
 */
import type { CropperState, NormalizedRect, Size } from './types';
import { getRotatedBBox } from './camera';
import { getSourceRegion, type SourceRegion } from './source-region';
import { MIN_CROP_SIZE, type CropBounds } from './stencil-math';

const EPSILON = 1e-9;

/**
 * Measured cropper layout geometry. Published by the Cropper component so
 * external controls can use the same bounds as manual stencil interaction.
 */
export interface CropperLayoutGeometry {
	canvasSize: Size;
	elementSize: Size;
	visualSize: Size;
	cropBounds: CropBounds | undefined;
}

/**
 * Crop rectangle expressed in snap-rotation crop pixels.
 */
export interface CropPixelRect {
	left: number;
	top: number;
	width: number;
	height: number;
	right: number;
	bottom: number;
}

export interface CropGeometryCapabilities {
	canMoveX: boolean;
	canMoveY: boolean;
	canResizeWidth: boolean;
	canResizeHeight: boolean;
	hasLockedAspectRatio: boolean;
}

export type CropGeometryOperation =
	| { type: 'move-x' }
	| { type: 'move-y' }
	| { type: 'resize-width' }
	| { type: 'resize-height' };

export interface CropGeometryRange {
	minValue: number;
	maxValue: number;
	minDelta: number;
	maxDelta: number;
	canApply: boolean;
}

export type CropGeometryApplyOperation =
	| { type: 'move-x'; value: number }
	| { type: 'move-y'; value: number }
	| { type: 'resize-width'; value: number }
	| { type: 'resize-height'; value: number };

export interface CropGeometryOptions {
	freeformCrop?: boolean;
	aspectRatio?: number;
}

export interface CropGeometryInput extends CropGeometryOptions {
	state: CropperState;
	imageSize: Size;
	geometry: CropperLayoutGeometry;
}

interface SnapGeometry {
	width: number;
	height: number;
	imageLeft: number;
	imageTop: number;
}

function clamp( value: number, min: number, max: number ): number {
	if ( max < min ) {
		return min;
	}
	return Math.min( max, Math.max( min, value ) );
}

function getSnapGeometry( state: CropperState, imageSize: Size ): SnapGeometry {
	const snapRotation = Math.round( state.rotation / 90 ) * 90;
	const { width, height } = getRotatedBBox(
		imageSize.width,
		imageSize.height,
		snapRotation
	);
	return {
		width,
		height,
		imageLeft: 0.5 + state.pan.x - state.zoom / 2,
		imageTop: 0.5 + state.pan.y - state.zoom / 2,
	};
}

function normalizedXToPixel(
	x: number,
	state: CropperState,
	snap: SnapGeometry
): number {
	return ( ( x - snap.imageLeft ) / state.zoom ) * snap.width;
}

function normalizedYToPixel(
	y: number,
	state: CropperState,
	snap: SnapGeometry
): number {
	return ( ( y - snap.imageTop ) / state.zoom ) * snap.height;
}

function normalizedWidthToPixel(
	width: number,
	state: CropperState,
	snap: SnapGeometry
): number {
	return ( width / state.zoom ) * snap.width;
}

function normalizedHeightToPixel(
	height: number,
	state: CropperState,
	snap: SnapGeometry
): number {
	return ( height / state.zoom ) * snap.height;
}

function pixelXToNormalized(
	left: number,
	state: CropperState,
	snap: SnapGeometry
): number {
	return ( left / snap.width ) * state.zoom + snap.imageLeft;
}

function pixelYToNormalized(
	top: number,
	state: CropperState,
	snap: SnapGeometry
): number {
	return ( top / snap.height ) * state.zoom + snap.imageTop;
}

function pixelWidthToNormalized(
	width: number,
	state: CropperState,
	snap: SnapGeometry
): number {
	return ( width / snap.width ) * state.zoom;
}

function pixelHeightToNormalized(
	height: number,
	state: CropperState,
	snap: SnapGeometry
): number {
	return ( height / snap.height ) * state.zoom;
}

function getNormalizedAspectRatio(
	aspectRatio: number | undefined,
	visualSize: Size
): number | undefined {
	if (
		! aspectRatio ||
		aspectRatio <= 0 ||
		visualSize.width <= 0 ||
		visualSize.height <= 0
	) {
		return undefined;
	}
	return ( aspectRatio * visualSize.height ) / visualSize.width;
}

function makeRange(
	minValue: number,
	maxValue: number,
	currentValue: number,
	canApply: boolean
): CropGeometryRange {
	const min = Math.min( minValue, maxValue );
	const max = Math.max( minValue, maxValue );
	return {
		minValue: min,
		maxValue: max,
		minDelta: min - currentValue,
		maxDelta: max - currentValue,
		canApply: canApply && max - min > EPSILON,
	};
}

/**
 * Convert cropper state to the snap-rotation pixel rectangle used by crop
 * controls and export/save math.
 *
 * @param state     Cropper state.
 * @param imageSize Natural source image size.
 * @return Crop rectangle in snap-rotation pixels.
 */
export function getCropPixelRect(
	state: CropperState,
	imageSize: Size
): CropPixelRect {
	if ( imageSize.width === 0 || imageSize.height === 0 ) {
		return {
			left: 0,
			top: 0,
			width: 0,
			height: 0,
			right: 0,
			bottom: 0,
		};
	}
	const snap = getSnapGeometry( state, imageSize );
	const { cropRect } = state;
	const left = normalizedXToPixel( cropRect.x, state, snap );
	const top = normalizedYToPixel( cropRect.y, state, snap );
	const width = normalizedWidthToPixel( cropRect.width, state, snap );
	const height = normalizedHeightToPixel( cropRect.height, state, snap );

	return {
		left,
		top,
		width,
		height,
		right: left + width,
		bottom: top + height,
	};
}

/**
 * Convert a snap-rotation pixel rectangle back to normalized cropper space.
 *
 * @param pixels    Crop rectangle in snap-rotation pixels.
 * @param state     Cropper state.
 * @param imageSize Natural source image size.
 * @return Normalized crop rectangle.
 */
export function cropPixelRectToNormalizedRect(
	pixels: Pick< CropPixelRect, 'left' | 'top' | 'width' | 'height' >,
	state: CropperState,
	imageSize: Size
): NormalizedRect {
	const snap = getSnapGeometry( state, imageSize );
	return {
		x: pixelXToNormalized( pixels.left, state, snap ),
		y: pixelYToNormalized( pixels.top, state, snap ),
		width: pixelWidthToNormalized( pixels.width, state, snap ),
		height: pixelHeightToNormalized( pixels.height, state, snap ),
	};
}

/**
 * Whether a crop geometry input has enough measured information for ranges.
 *
 * @param input Crop geometry input.
 * @return True when operation geometry can be computed.
 */
export function isCropGeometryReady( input: CropGeometryInput ): boolean {
	return (
		input.imageSize.width > 0 &&
		input.imageSize.height > 0 &&
		input.geometry.canvasSize.width > 0 &&
		input.geometry.canvasSize.height > 0 &&
		input.geometry.elementSize.width > 0 &&
		input.geometry.elementSize.height > 0 &&
		input.geometry.visualSize.width > 0 &&
		input.geometry.visualSize.height > 0 &&
		!! input.geometry.cropBounds
	);
}

/**
 * Get the source-region data for AI and external image-processing consumers.
 *
 * @param input Crop geometry input.
 * @return Source region or null when geometry is not ready.
 */
export function getCropGeometrySourceRegion(
	input: CropGeometryInput
): SourceRegion | null {
	if ( ! isCropGeometryReady( input ) ) {
		return null;
	}
	return getSourceRegion( input.state, input.imageSize );
}

/**
 * Get the allowed value range for a crop geometry operation.
 *
 * @param input     Crop geometry input.
 * @param operation Operation to query.
 * @return Operation range in snap-rotation pixels.
 */
export function getCropGeometryRange(
	input: CropGeometryInput,
	operation: CropGeometryOperation
): CropGeometryRange {
	if ( ! isCropGeometryReady( input ) ) {
		return {
			minValue: 0,
			maxValue: 0,
			minDelta: 0,
			maxDelta: 0,
			canApply: false,
		};
	}

	const { state, imageSize, freeformCrop } = input;

	if ( operation.type === 'move-x' ) {
		const bounds = input.geometry.cropBounds as CropBounds;
		const snap = getSnapGeometry( state, imageSize );
		const rect = getCropPixelRect( state, imageSize );
		const cropRect = state.cropRect;
		const minX = bounds.minX;
		const maxX = Math.max( minX, bounds.maxX - cropRect.width );
		return makeRange(
			normalizedXToPixel( minX, state, snap ),
			normalizedXToPixel( maxX, state, snap ),
			rect.left,
			true
		);
	}

	if ( operation.type === 'move-y' ) {
		const bounds = input.geometry.cropBounds as CropBounds;
		const snap = getSnapGeometry( state, imageSize );
		const rect = getCropPixelRect( state, imageSize );
		const cropRect = state.cropRect;
		const minY = bounds.minY;
		const maxY = Math.max( minY, bounds.maxY - cropRect.height );
		return makeRange(
			normalizedYToPixel( minY, state, snap ),
			normalizedYToPixel( maxY, state, snap ),
			rect.top,
			true
		);
	}

	if ( operation.type === 'resize-width' ) {
		const rect = getCropPixelRect( state, imageSize );
		if ( ! freeformCrop ) {
			return makeRange( rect.width, rect.width, rect.width, false );
		}
		const bounds = input.geometry.cropBounds as CropBounds;
		const snap = getSnapGeometry( state, imageSize );
		const cropRect = state.cropRect;
		const normalizedRatio = getNormalizedAspectRatio(
			input.aspectRatio,
			input.geometry.visualSize
		);
		const centerX = cropRect.x + cropRect.width / 2;
		const centerY = cropRect.y + cropRect.height / 2;
		const maxWidthFromX =
			Math.min( centerX - bounds.minX, bounds.maxX - centerX ) * 2;
		let minWidth = MIN_CROP_SIZE;
		let maxWidth = Math.max( 0, maxWidthFromX );

		if ( normalizedRatio ) {
			const maxHeightFromY =
				Math.min( centerY - bounds.minY, bounds.maxY - centerY ) * 2;
			maxWidth = Math.min(
				maxWidth,
				Math.max( 0, maxHeightFromY ) * normalizedRatio
			);
			minWidth = Math.max( minWidth, MIN_CROP_SIZE * normalizedRatio );
		}

		minWidth = Math.min( minWidth, maxWidth );
		return makeRange(
			normalizedWidthToPixel( minWidth, state, snap ),
			normalizedWidthToPixel( maxWidth, state, snap ),
			rect.width,
			true
		);
	}

	const rect = getCropPixelRect( state, imageSize );
	if ( ! freeformCrop ) {
		return makeRange( rect.height, rect.height, rect.height, false );
	}
	const bounds = input.geometry.cropBounds as CropBounds;
	const snap = getSnapGeometry( state, imageSize );
	const cropRect = state.cropRect;
	const normalizedRatio = getNormalizedAspectRatio(
		input.aspectRatio,
		input.geometry.visualSize
	);
	const centerX = cropRect.x + cropRect.width / 2;
	const centerY = cropRect.y + cropRect.height / 2;
	const maxHeightFromY =
		Math.min( centerY - bounds.minY, bounds.maxY - centerY ) * 2;
	let minHeight = MIN_CROP_SIZE;
	let maxHeight = Math.max( 0, maxHeightFromY );

	if ( normalizedRatio ) {
		const maxWidthFromX =
			Math.min( centerX - bounds.minX, bounds.maxX - centerX ) * 2;
		maxHeight = Math.min(
			maxHeight,
			Math.max( 0, maxWidthFromX ) / normalizedRatio
		);
		minHeight = Math.max( minHeight, MIN_CROP_SIZE / normalizedRatio );
	}

	minHeight = Math.min( minHeight, maxHeight );
	return makeRange(
		normalizedHeightToPixel( minHeight, state, snap ),
		normalizedHeightToPixel( maxHeight, state, snap ),
		rect.height,
		true
	);
}

/**
 * Compute a constrained crop rect for a geometry operation.
 *
 * @param input     Crop geometry input.
 * @param operation Operation to apply.
 * @return Next normalized crop rectangle, or null when unavailable.
 */
export function applyCropGeometryOperation(
	input: CropGeometryInput,
	operation: CropGeometryApplyOperation
): NormalizedRect | null {
	if ( ! isCropGeometryReady( input ) ) {
		return null;
	}

	const range = getCropGeometryRange( input, { type: operation.type } );

	if ( ! range.canApply ) {
		return { ...input.state.cropRect };
	}

	const { state, imageSize } = input;
	const snap = getSnapGeometry( state, imageSize );
	const cropRect = state.cropRect;
	const value = clamp( operation.value, range.minValue, range.maxValue );

	if ( operation.type === 'move-x' ) {
		return {
			...cropRect,
			x: pixelXToNormalized( value, state, snap ),
		};
	}

	if ( operation.type === 'move-y' ) {
		return {
			...cropRect,
			y: pixelYToNormalized( value, state, snap ),
		};
	}

	if ( operation.type === 'resize-width' ) {
		const normalizedRatio = getNormalizedAspectRatio(
			input.aspectRatio,
			input.geometry.visualSize
		);
		const centerX = cropRect.x + cropRect.width / 2;
		const centerY = cropRect.y + cropRect.height / 2;
		const width = pixelWidthToNormalized( value, state, snap );
		const height = normalizedRatio
			? width / normalizedRatio
			: cropRect.height;
		return {
			x: centerX - width / 2,
			y: normalizedRatio ? centerY - height / 2 : cropRect.y,
			width,
			height,
		};
	}

	const normalizedRatio = getNormalizedAspectRatio(
		input.aspectRatio,
		input.geometry.visualSize
	);
	const centerX = cropRect.x + cropRect.width / 2;
	const centerY = cropRect.y + cropRect.height / 2;
	const height = pixelHeightToNormalized( value, state, snap );
	const width = normalizedRatio ? height * normalizedRatio : cropRect.width;
	return {
		x: normalizedRatio ? centerX - width / 2 : cropRect.x,
		y: centerY - height / 2,
		width,
		height,
	};
}

/**
 * Get operation capabilities for current crop geometry.
 *
 * @param input Crop geometry input.
 * @return Operation capability flags.
 */
export function getCropGeometryCapabilities(
	input: CropGeometryInput
): CropGeometryCapabilities {
	const moveX = getCropGeometryRange( input, { type: 'move-x' } );
	const moveY = getCropGeometryRange( input, { type: 'move-y' } );
	const resizeWidth = getCropGeometryRange( input, {
		type: 'resize-width',
	} );
	const resizeHeight = getCropGeometryRange( input, {
		type: 'resize-height',
	} );

	return {
		canMoveX: moveX.canApply,
		canMoveY: moveY.canApply,
		canResizeWidth: resizeWidth.canApply,
		canResizeHeight: resizeHeight.canApply,
		hasLockedAspectRatio: !! ( input.aspectRatio && input.aspectRatio > 0 ),
	};
}
