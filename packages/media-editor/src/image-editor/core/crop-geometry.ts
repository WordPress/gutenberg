/**
 * Internal dependencies
 */
import type { CropperState, NormalizedRect, Size } from './types';
import { getRotatedBBox } from './camera';
import { getSourceRegion, type SourceRegion } from './source-region';
import { MIN_CROP_SIZE, type CropBounds } from './stencil-math';

const EPSILON = 1e-9;
declare const cropPixelRectBrand: unique symbol;

/**
 * Measured cropper layout geometry. Published by the Cropper component so
 * external controls can use the same current-layout bounds as manual stencil
 * interaction.
 */
export interface CropperLayoutGeometry {
	canvasSize: Size;
	elementSize: Size;
	visualSize: Size;
	cropBounds: CropBounds | undefined;
}

/**
 * Candidate crop rectangle expressed in snap-rotation crop pixels.
 *
 * This is the shape consumers provide for validation or conversion. Derived
 * `right` / `bottom` edges are intentionally not accepted from consumers.
 */
export interface CropPixelRectInput {
	left: number;
	top: number;
	width: number;
	height: number;
}

/**
 * Crop rectangle expressed in snap-rotation crop pixels.
 *
 * `right` and `bottom` are derived from `left + width` and `top + height`.
 * Use the exported helpers to create this type; accept consumer-proposed
 * rectangles as `CropPixelRectInput`.
 */
export type CropPixelRect = CropPixelRectInput & {
	/** Derived right edge, equal to `left + width`. */
	readonly right: number;
	/** Derived bottom edge, equal to `top + height`. */
	readonly bottom: number;
	readonly [ cropPixelRectBrand ]: true;
};

/**
 * Generic crop rectangle limits expressed in the same snap-rotation pixel
 * space as `CropPixelRect`.
 */
export interface CropPixelRectBounds {
	minLeft: number;
	minTop: number;
	maxRight: number;
	maxBottom: number;
	minWidth: number;
	minHeight: number;
	maxWidth: number;
	maxHeight: number;
}

/**
 * Current-layout crop limits for the cropper's current zoom, pan, rotation,
 * and measured canvas. These are not absolute source-image bounds.
 */
export type CropPixelLayoutBounds = CropPixelRectBounds;

export interface CropGeometryInput {
	state: CropperState;
	imageSize: Size;
	geometry: CropperLayoutGeometry;
}

export interface CropGeometrySnapshot {
	rect: CropPixelRect;
	layoutBounds: CropPixelLayoutBounds;
	sourceRegion: SourceRegion;
}

export type CropPixelRectViolation =
	| 'non-finite'
	| 'left-out-of-bounds'
	| 'top-out-of-bounds'
	| 'right-out-of-bounds'
	| 'bottom-out-of-bounds'
	| 'width-too-small'
	| 'width-too-large'
	| 'height-too-small'
	| 'height-too-large'
	| 'precision-clamped';

export interface CropPixelRectValidationResult {
	isValid: boolean;
	rect: CropPixelRect;
	violations: CropPixelRectViolation[];
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

function isClose( a: number, b: number ): boolean {
	return Math.abs( a - b ) < EPSILON;
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

function toCropPixelRect( pixels: CropPixelRectInput ): CropPixelRect {
	return {
		left: pixels.left,
		top: pixels.top,
		width: pixels.width,
		height: pixels.height,
		right: pixels.left + pixels.width,
		bottom: pixels.top + pixels.height,
	} as CropPixelRect;
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
		return toCropPixelRect( {
			left: 0,
			top: 0,
			width: 0,
			height: 0,
		} );
	}
	const snap = getSnapGeometry( state, imageSize );
	const { cropRect } = state;
	const left = normalizedXToPixel( cropRect.x, state, snap );
	const top = normalizedYToPixel( cropRect.y, state, snap );
	const width = normalizedWidthToPixel( cropRect.width, state, snap );
	const height = normalizedHeightToPixel( cropRect.height, state, snap );

	return toCropPixelRect( { left, top, width, height } );
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
	pixels: CropPixelRectInput,
	state: CropperState,
	imageSize: Size
): NormalizedRect {
	if ( imageSize.width === 0 || imageSize.height === 0 ) {
		return { x: 0, y: 0, width: 0, height: 0 };
	}

	const snap = getSnapGeometry( state, imageSize );
	return {
		x: pixelXToNormalized( pixels.left, state, snap ),
		y: pixelYToNormalized( pixels.top, state, snap ),
		width: pixelWidthToNormalized( pixels.width, state, snap ),
		height: pixelHeightToNormalized( pixels.height, state, snap ),
	};
}

/**
 * Whether a crop geometry input has enough measured information for geometry
 * snapshots and current-layout bounds.
 *
 * `cropBounds` is the derived layout constraint consumed by the pixel helpers;
 * the raw layout sizes document how that constraint was measured, but they are
 * not read directly here.
 *
 * @param input Crop geometry input.
 * @return True when crop geometry can be computed.
 */
export function isCropGeometryReady( input: CropGeometryInput ): boolean {
	return (
		input.imageSize.width > 0 &&
		input.imageSize.height > 0 &&
		!! input.geometry.cropBounds
	);
}

/**
 * Get the current-layout crop limits in snap-rotation pixel space. These
 * bounds describe what fits without changing the cropper camera (zoom/pan).
 * They are not absolute source-image bounds.
 *
 * @param input Crop geometry input.
 * @return Crop pixel layout bounds, or null when geometry is not ready.
 */
export function getCropPixelLayoutBounds(
	input: CropGeometryInput
): CropPixelLayoutBounds | null {
	if ( ! isCropGeometryReady( input ) ) {
		return null;
	}

	const { state, imageSize } = input;
	const bounds = input.geometry.cropBounds as CropBounds;
	const snap = getSnapGeometry( state, imageSize );
	const minLeft = normalizedXToPixel( bounds.minX, state, snap );
	const minTop = normalizedYToPixel( bounds.minY, state, snap );
	const maxRight = normalizedXToPixel( bounds.maxX, state, snap );
	const maxBottom = normalizedYToPixel( bounds.maxY, state, snap );
	const maxWidth = Math.max( 0, maxRight - minLeft );
	const maxHeight = Math.max( 0, maxBottom - minTop );
	const minWidth = Math.min(
		normalizedWidthToPixel( MIN_CROP_SIZE, state, snap ),
		maxWidth
	);
	const minHeight = Math.min(
		normalizedHeightToPixel( MIN_CROP_SIZE, state, snap ),
		maxHeight
	);

	return {
		minLeft,
		minTop,
		maxRight,
		maxBottom,
		minWidth,
		minHeight,
		maxWidth,
		maxHeight,
	};
}

/**
 * Fit a complete crop rectangle inside the provided bounds. This is
 * deliberately rectangle-level logic rather than an operation API: callers
 * decide whether a width change is left-anchored, center-anchored,
 * aspect-ratio locked, etc., then clamp the resulting rectangle here.
 *
 * @param rect   Candidate crop rectangle in snap-rotation pixels.
 * @param bounds Crop pixel bounds to clamp against.
 * @return Clamped crop rectangle in snap-rotation pixels.
 */
export function clampCropPixelRectToBounds(
	rect: CropPixelRectInput,
	bounds: CropPixelRectBounds
): CropPixelRect {
	const fallback = {
		left: bounds.minLeft,
		top: bounds.minTop,
		width: bounds.minWidth,
		height: bounds.minHeight,
	};
	const candidate = {
		left: Number.isFinite( rect.left ) ? rect.left : fallback.left,
		top: Number.isFinite( rect.top ) ? rect.top : fallback.top,
		width: Number.isFinite( rect.width ) ? rect.width : fallback.width,
		height: Number.isFinite( rect.height ) ? rect.height : fallback.height,
	};
	const width = clamp( candidate.width, bounds.minWidth, bounds.maxWidth );
	const height = clamp(
		candidate.height,
		bounds.minHeight,
		bounds.maxHeight
	);
	const left = clamp(
		candidate.left,
		bounds.minLeft,
		bounds.maxRight - width
	);
	const top = clamp(
		candidate.top,
		bounds.minTop,
		bounds.maxBottom - height
	);

	return toCropPixelRect( { left, top, width, height } );
}

/**
 * Validate a candidate crop rectangle against the provided crop pixel bounds.
 * The result only answers whether `rect` fits those bounds. For example,
 * current-layout bounds and absolute image bounds are separate concepts.
 *
 * @param rect   Candidate crop rectangle in snap-rotation pixels.
 * @param bounds Crop pixel bounds to validate against.
 * @return Validation result with a clamped rectangle.
 */
export function validateCropPixelRectAgainstBounds(
	rect: CropPixelRectInput,
	bounds: CropPixelRectBounds
): CropPixelRectValidationResult {
	const violations = new Set< CropPixelRectViolation >();

	if (
		! Number.isFinite( rect.left ) ||
		! Number.isFinite( rect.top ) ||
		! Number.isFinite( rect.width ) ||
		! Number.isFinite( rect.height )
	) {
		violations.add( 'non-finite' );
	}

	const candidate = toCropPixelRect( {
		left: rect.left,
		top: rect.top,
		width: rect.width,
		height: rect.height,
	} );

	if ( candidate.left < bounds.minLeft - EPSILON ) {
		violations.add( 'left-out-of-bounds' );
	}
	if ( candidate.top < bounds.minTop - EPSILON ) {
		violations.add( 'top-out-of-bounds' );
	}
	if ( candidate.right > bounds.maxRight + EPSILON ) {
		violations.add( 'right-out-of-bounds' );
	}
	if ( candidate.bottom > bounds.maxBottom + EPSILON ) {
		violations.add( 'bottom-out-of-bounds' );
	}
	if ( candidate.width < bounds.minWidth - EPSILON ) {
		violations.add( 'width-too-small' );
	}
	if ( candidate.width > bounds.maxWidth + EPSILON ) {
		violations.add( 'width-too-large' );
	}
	if ( candidate.height < bounds.minHeight - EPSILON ) {
		violations.add( 'height-too-small' );
	}
	if ( candidate.height > bounds.maxHeight + EPSILON ) {
		violations.add( 'height-too-large' );
	}

	const clamped = clampCropPixelRectToBounds( rect, bounds );
	const matchesClamped =
		isClose( candidate.left, clamped.left ) &&
		isClose( candidate.top, clamped.top ) &&
		isClose( candidate.width, clamped.width ) &&
		isClose( candidate.height, clamped.height );

	if ( ! matchesClamped && violations.size === 0 ) {
		violations.add( 'precision-clamped' );
	}

	return {
		isValid: violations.size === 0,
		rect: clamped,
		violations: Array.from( violations ),
	};
}

/**
 * Get current crop geometry and source-region data for controls, automation,
 * and AI workflows.
 *
 * @param input Crop geometry input.
 * @return Crop geometry snapshot, or null when geometry is not ready.
 */
export function getCropGeometrySnapshot(
	input: CropGeometryInput
): CropGeometrySnapshot | null {
	const layoutBounds = getCropPixelLayoutBounds( input );

	if ( ! layoutBounds ) {
		return null;
	}

	return {
		rect: getCropPixelRect( input.state, input.imageSize ),
		layoutBounds,
		sourceRegion: getSourceRegion( input.state, input.imageSize ),
	};
}
