/**
 * Internal dependencies
 */
import type { CropperState, NormalizedRect, Size } from './types';
import { getRotatedBBox } from './camera';
import { getSourceRegion, type SourceRegion } from './source-region';
import { DEFAULT_MIN_CROP_SIZE, type CropBounds } from './stencil-math';

const EPSILON = 1e-9;

/** Normalized crop bounds in the cropper's visual coordinate space. */
export type NormalizedCropBounds = CropBounds;

/**
 * Candidate crop rectangle expressed in snap-rotation crop pixels.
 *
 * This is the shape consumers provide for validation, conversion, or editing.
 * Derived `right` / `bottom` edges are not accepted from consumers; they live
 * on the resolved `CropPixelRect` shape returned by the helpers below.
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
 * Always construct via `toCropPixelRect`, `getCropPixelRect`,
 * `clampCropPixelRectToBounds`, or `applyCropEdit`. `right` and `bottom` are
 * derived from `left + width` and `top + height`.
 */
export interface CropPixelRect extends CropPixelRectInput {
	readonly right: number;
	readonly bottom: number;
}

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

export interface CropGeometryInput {
	state: CropperState;
	imageSize: Size;
	imageBounds: NormalizedCropBounds | undefined;
}

export interface CropGeometrySnapshot {
	rect: CropPixelRect;
	imageBounds: CropPixelRectBounds;
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
	| 'height-too-large';

/**
 * Diagnostic result for validating a candidate rectangle against bounds.
 *
 * The `ok: false` branch still carries a `rect`, the clamped fallback, so
 * consumers can recover without a second call.
 */
export type CropPixelRectCheck =
	| { ok: true; rect: CropPixelRect }
	| {
			ok: false;
			rect: CropPixelRect;
			violations: CropPixelRectViolation[];
	  };

/** The four directly-editable fields on a crop rectangle. */
export type CropEditField = 'left' | 'top' | 'width' | 'height';

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

function clampFinite(
	value: number,
	min: number,
	max: number,
	fallback: number
): number {
	return Number.isFinite( value ) ? clamp( value, min, max ) : fallback;
}

function getAspectRatioWidthBounds(
	bounds: CropPixelRectBounds,
	aspectRatio: number
): { min: number; max: number } {
	return {
		min: Math.max( bounds.minWidth, bounds.minHeight * aspectRatio ),
		max: Math.min( bounds.maxWidth, bounds.maxHeight * aspectRatio ),
	};
}

function getAspectRatioHeightBounds(
	bounds: CropPixelRectBounds,
	aspectRatio: number
): { min: number; max: number } {
	return {
		min: Math.max( bounds.minHeight, bounds.minWidth / aspectRatio ),
		max: Math.min( bounds.maxHeight, bounds.maxWidth / aspectRatio ),
	};
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
		return toCropPixelRect( { left: 0, top: 0, width: 0, height: 0 } );
	}
	const snap = getSnapGeometry( state, imageSize );
	const { cropRect } = state;
	return toCropPixelRect( {
		left: normalizedXToPixel( cropRect.x, state, snap ),
		top: normalizedYToPixel( cropRect.y, state, snap ),
		width: normalizedWidthToPixel( cropRect.width, state, snap ),
		height: normalizedHeightToPixel( cropRect.height, state, snap ),
	} );
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

function isCropGeometryReady( input: CropGeometryInput ): boolean {
	return (
		input.imageSize.width > 0 &&
		input.imageSize.height > 0 &&
		!! input.imageBounds
	);
}

/**
 * Convert normalized image crop bounds to snap-rotation pixel bounds.
 *
 * @param bounds    Normalized crop bounds.
 * @param state     Cropper state.
 * @param imageSize Natural source image size.
 * @return Crop pixel bounds.
 */
function cropBoundsToPixelRectBounds(
	bounds: NormalizedCropBounds,
	state: CropperState,
	imageSize: Size
): CropPixelRectBounds {
	if ( imageSize.width === 0 || imageSize.height === 0 ) {
		return {
			minLeft: 0,
			minTop: 0,
			maxRight: 0,
			maxBottom: 0,
			minWidth: 0,
			minHeight: 0,
			maxWidth: 0,
			maxHeight: 0,
		};
	}

	const snap = getSnapGeometry( state, imageSize );
	const minLeft = normalizedXToPixel( bounds.minX, state, snap );
	const minTop = normalizedYToPixel( bounds.minY, state, snap );
	const maxRight = normalizedXToPixel( bounds.maxX, state, snap );
	const maxBottom = normalizedYToPixel( bounds.maxY, state, snap );
	const maxWidth = Math.max( 0, maxRight - minLeft );
	const maxHeight = Math.max( 0, maxBottom - minTop );
	const minWidth = Math.min(
		normalizedWidthToPixel( DEFAULT_MIN_CROP_SIZE.width, state, snap ),
		maxWidth
	);
	const minHeight = Math.min(
		normalizedHeightToPixel( DEFAULT_MIN_CROP_SIZE.height, state, snap ),
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

function getCropPixelImageBounds(
	input: CropGeometryInput
): CropPixelRectBounds | null {
	if ( ! isCropGeometryReady( input ) ) {
		return null;
	}

	return cropBoundsToPixelRectBounds(
		input.imageBounds as NormalizedCropBounds,
		input.state,
		input.imageSize
	);
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
 * Apply a single-field edit to a crop rectangle, optionally couple the
 * dependent dimension via an aspect ratio, then clamp against bounds.
 *
 * This is the consumer-facing entry point for advanced crop controls: it
 * keeps aspect-ratio coupling and bound clamping in one place so panels and
 * automation can mutate a rectangle without re-implementing either policy.
 *
 * @param rect                Current crop rectangle.
 * @param field               The field the user edited
 *                            (`left` | `top` | `width` | `height`).
 * @param value               New value for the edited field.
 * @param options             Edit options.
 * @param options.aspectRatio Optional width / height lock for size edits.
 * @param options.bounds      Crop pixel bounds to clamp the result against.
 * @return Resulting crop rectangle after coupling and clamping.
 */
export function applyCropEdit(
	rect: CropPixelRectInput,
	field: CropEditField,
	value: number,
	options: { aspectRatio?: number; bounds: CropPixelRectBounds }
): CropPixelRect {
	const next: CropPixelRectInput = {
		left: rect.left,
		top: rect.top,
		width: rect.width,
		height: rect.height,
	};

	if ( options.aspectRatio && options.aspectRatio > 0 ) {
		if ( field === 'width' ) {
			const widthBounds = getAspectRatioWidthBounds(
				options.bounds,
				options.aspectRatio
			);
			next.width = clampFinite(
				value,
				widthBounds.min,
				widthBounds.max,
				next.width
			);
			next.height = next.width / options.aspectRatio;
		} else if ( field === 'height' ) {
			const heightBounds = getAspectRatioHeightBounds(
				options.bounds,
				options.aspectRatio
			);
			next.height = clampFinite(
				value,
				heightBounds.min,
				heightBounds.max,
				next.height
			);
			next.width = next.height * options.aspectRatio;
		} else {
			next[ field ] = value;
		}
	} else {
		next[ field ] = value;
	}

	return clampCropPixelRectToBounds( next, options.bounds );
}

/**
 * Validate a candidate crop rectangle against the provided crop pixel bounds.
 *
 * Used by diagnostics consumers (tests, AI agents) that need to know *why* an
 * input was rejected. Panels that only want a clamped result should call
 * `applyCropEdit` or `clampCropPixelRectToBounds` instead.
 *
 * @param rect   Candidate crop rectangle in snap-rotation pixels.
 * @param bounds Crop pixel bounds to validate against.
 * @return Discriminated check result. The `ok: false` branch carries the
 *         clamped fallback rectangle so consumers can recover.
 */
export function validateCropPixelRectAgainstBounds(
	rect: CropPixelRectInput,
	bounds: CropPixelRectBounds
): CropPixelRectCheck {
	const violations: CropPixelRectViolation[] = [];

	if (
		! Number.isFinite( rect.left ) ||
		! Number.isFinite( rect.top ) ||
		! Number.isFinite( rect.width ) ||
		! Number.isFinite( rect.height )
	) {
		violations.push( 'non-finite' );
	}

	const right = rect.left + rect.width;
	const bottom = rect.top + rect.height;

	if ( rect.left < bounds.minLeft - EPSILON ) {
		violations.push( 'left-out-of-bounds' );
	}
	if ( rect.top < bounds.minTop - EPSILON ) {
		violations.push( 'top-out-of-bounds' );
	}
	if ( right > bounds.maxRight + EPSILON ) {
		violations.push( 'right-out-of-bounds' );
	}
	if ( bottom > bounds.maxBottom + EPSILON ) {
		violations.push( 'bottom-out-of-bounds' );
	}
	if ( rect.width < bounds.minWidth - EPSILON ) {
		violations.push( 'width-too-small' );
	}
	if ( rect.width > bounds.maxWidth + EPSILON ) {
		violations.push( 'width-too-large' );
	}
	if ( rect.height < bounds.minHeight - EPSILON ) {
		violations.push( 'height-too-small' );
	}
	if ( rect.height > bounds.maxHeight + EPSILON ) {
		violations.push( 'height-too-large' );
	}

	const clamped = clampCropPixelRectToBounds( rect, bounds );
	if ( violations.length === 0 ) {
		return { ok: true, rect: clamped };
	}
	return { ok: false, rect: clamped, violations };
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
	const imageBounds = getCropPixelImageBounds( input );

	if ( ! imageBounds ) {
		return null;
	}

	return {
		rect: getCropPixelRect( input.state, input.imageSize ),
		imageBounds,
		sourceRegion: getSourceRegion( input.state, input.imageSize ),
	};
}
