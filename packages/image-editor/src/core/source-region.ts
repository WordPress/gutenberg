import { mat2d, vec2 } from 'gl-matrix';
import type {
	InternalImageEditorState,
	HandlePosition,
	NormalizedRect,
	Size,
} from './types';
import { createCamera, getRotatedBBox, getVisibleBounds } from './camera';
import { isValidSize, sanitizeImageEditorState } from './math/sanitize';
import { normalizeRotation } from './math/rotation';

/**
 * The crop's size in source pixels, with the position of the image point
 * under its centre. Not an axis-aligned region of the image — see
 * `getSourceRegion`.
 */
export interface SourceRegion {
	/** X offset in source pixels. */
	x: number;
	/** Y offset in source pixels. */
	y: number;
	/** Width in source pixels. */
	width: number;
	/** Height in source pixels. */
	height: number;
	/** Rotation in degrees (0-360). */
	rotation: number;
	/** Flip state. */
	flip: { horizontal: boolean; vertical: boolean };
	/** Zoom factor applied. */
	zoom: number;
}

/**
 * The crop's size in source pixels, positioned at the point of the image
 * that sits under the crop's centre.
 *
 * The width and height are measured along the view, which is the image
 * turned to its nearest quarter turn. At 90 or 270 degrees they are
 * therefore swapped relative to the image's own axes: a full-frame crop of
 * a 1600x900 image at 90 degrees reports a width of 900 and a height of
 * 1600. The centre is a real point of the image, so the rectangle as a
 * whole is not an axis-aligned region of the image and can fall outside
 * it.
 *
 * That makes it right for telling someone the size of what they are
 * framing, which is what it is for, and wrong as a region to crop with.
 * For the size on its own, prefer the public `getOutputSize`.
 *
 * Rotation and flip come back as separate fields because they are
 * transforms rather than part of a region.
 *
 * @param state     The current editor state.
 * @param imageSize The natural dimensions of the source image.
 * @return The crop size in source pixels, where its centre sits, and the
 *         rotation and flip in force.
 */
export function getSourceRegion(
	state: InternalImageEditorState,
	imageSize: Size
): SourceRegion {
	// Sanitize before the zero-size short-circuit so the early return
	// doesn't leak raw non-finite state.rotation or state.zoom out
	// through the metadata fields. (state.flip is boolean and isn't
	// at risk of NaN propagation.)
	const safeState = sanitizeImageEditorState( state );

	if ( ! isValidSize( imageSize ) ) {
		return {
			x: 0,
			y: 0,
			width: 0,
			height: 0,
			rotation: safeState.rotation,
			flip: { ...safeState.flip },
			zoom: safeState.zoom,
		};
	}

	// Use a synthetic 1:1 container so the camera maps normalized coords
	// to a known pixel space. The container size cancels out.
	const syntheticContainer: Size = { width: 1000, height: 1000 };
	const camera = createCamera( safeState, syntheticContainer, imageSize );

	// Inverse camera maps screen pixels back to normalized [0,1] world coords.
	const inv = mat2d.create();
	mat2d.invert( inv, camera );

	// The crop rect center in screen space. We need the base camera
	// (zoom=1, no pan) to locate the visual bounds, then place the
	// crop rect within them.
	const baseCamera = createCamera(
		{ ...safeState, pan: { x: 0, y: 0 }, zoom: 1 },
		syntheticContainer,
		imageSize
	);
	const visibleBounds = getVisibleBounds( baseCamera );

	const cropRect = safeState.cropRect;
	const cropCenterScreenX =
		visibleBounds.left +
		( cropRect.x + cropRect.width / 2 ) * visibleBounds.width;
	const cropCenterScreenY =
		visibleBounds.top +
		( cropRect.y + cropRect.height / 2 ) * visibleBounds.height;

	// Transform crop center through inverse camera to get source position.
	const srcCenter = vec2.create();
	vec2.transformMat2d(
		srcCenter,
		[ cropCenterScreenX, cropCenterScreenY ],
		inv
	);

	// Crop rect size in the snap-rotation visual space, divided by zoom
	// for source-pixel dimensions. Matches the stencil's reference frame.
	const snapRotation = Math.round( safeState.rotation / 90 ) * 90;
	const { width: rotW, height: rotH } = getRotatedBBox(
		imageSize.width,
		imageSize.height,
		snapRotation
	);
	const sourceW = ( cropRect.width * rotW ) / safeState.zoom;
	const sourceH = ( cropRect.height * rotH ) / safeState.zoom;

	return {
		x: srcCenter[ 0 ] * imageSize.width - sourceW / 2,
		y: srcCenter[ 1 ] * imageSize.height - sourceH / 2,
		width: sourceW,
		height: sourceH,
		rotation: safeState.rotation,
		flip: { ...safeState.flip },
		zoom: safeState.zoom,
	};
}

/**
 * Convert a source-pixel region back to the editor's normalized crop rect.
 *
 * The math intentionally mirrors `getSourceRegion`: map the requested source
 * center through the current camera, then express that screen point inside the
 * same base visible bounds used to position crop overlays.
 *
 * @param state     The current editor state.
 * @param imageSize The natural dimensions of the source image.
 * @param region    The source-pixel region to represent as a crop rect.
 * @return The normalized crop rect, or null when inputs cannot be mapped.
 */
function getCropRectFromSourceRegion(
	state: InternalImageEditorState,
	imageSize: Size,
	region: SourceRegion
): NormalizedRect | null {
	if (
		! isValidSize( imageSize ) ||
		region.width <= 0 ||
		region.height <= 0
	) {
		return null;
	}

	const safeState = sanitizeImageEditorState( state );
	const syntheticContainer: Size = { width: 1000, height: 1000 };
	const baseCamera = createCamera(
		{ ...safeState, pan: { x: 0, y: 0 }, zoom: 1 },
		syntheticContainer,
		imageSize
	);
	const visibleBounds = getVisibleBounds( baseCamera );
	if ( visibleBounds.width <= 0 || visibleBounds.height <= 0 ) {
		return null;
	}

	const sourceCenter = vec2.fromValues(
		( region.x + region.width / 2 ) / imageSize.width,
		( region.y + region.height / 2 ) / imageSize.height
	);
	const screenCenter = vec2.create();
	const camera = createCamera( safeState, syntheticContainer, imageSize );
	vec2.transformMat2d( screenCenter, sourceCenter, camera );

	const snapRotation = Math.round( safeState.rotation / 90 ) * 90;
	const { width: rotW, height: rotH } = getRotatedBBox(
		imageSize.width,
		imageSize.height,
		snapRotation
	);
	if ( rotW <= 0 || rotH <= 0 ) {
		return null;
	}

	const width = ( region.width * safeState.zoom ) / rotW;
	const height = ( region.height * safeState.zoom ) / rotH;
	const centerX =
		( screenCenter[ 0 ] - visibleBounds.left ) / visibleBounds.width;
	const centerY =
		( screenCenter[ 1 ] - visibleBounds.top ) / visibleBounds.height;

	return {
		x: centerX - width / 2,
		y: centerY - height / 2,
		width,
		height,
	};
}

interface SourcePixelSnapEdges {
	left: boolean;
	top: boolean;
	right: boolean;
	bottom: boolean;
}

const CARDINAL_ROTATION_EPSILON = 1e-6;

/**
 * Check whether a rotation is effectively at a 90-degree stop.
 *
 * @param rotation The rotation angle in degrees.
 * @return Whether the rotation is close enough to a cardinal angle.
 */
function isCardinalRotation( rotation: number ): boolean {
	const normalizedRotation = normalizeRotation( rotation );
	const nearestCardinal = Math.round( normalizedRotation / 90 ) * 90;
	return (
		Math.abs( normalizedRotation - nearestCardinal ) <
		CARDINAL_ROTATION_EPSILON
	);
}

/**
 * Snap a crop rect so the selected source-region edges land on whole pixels.
 *
 * This is a display-time affordance for visible pixel grids; it does not alter
 * pan/zoom/rotation. Callers decide when snapping is appropriate.
 *
 * @param state     The current editor state.
 * @param imageSize The natural dimensions of the source image.
 * @param cropRect  The candidate crop rect from resize math.
 * @param handle    The active resize handle. Only edges moved by the handle snap.
 * @return A crop rect whose selected source-region edges are whole pixels.
 */
export function snapCropRectToSourcePixels(
	state: InternalImageEditorState,
	imageSize: Size,
	cropRect: NormalizedRect,
	handle: HandlePosition
): NormalizedRect {
	const safeState = sanitizeImageEditorState( state );
	if ( ! isCardinalRotation( safeState.rotation ) ) {
		return cropRect;
	}

	return snapCropRectEdgesToSourcePixels( safeState, imageSize, cropRect, {
		left: handle.includes( 'w' ),
		top: handle.includes( 'n' ),
		right: handle.includes( 'e' ),
		bottom: handle.includes( 's' ),
	} );
}

/**
 * Snap all source-region edges for a crop rect to the nearest whole pixels.
 *
 * @param state     The current editor state.
 * @param imageSize The natural dimensions of the source image.
 * @param cropRect  The crop rect to align to the source-pixel grid.
 * @return A crop rect whose source-region edges are whole pixels.
 */
export function snapCropRectToSourcePixelGrid(
	state: InternalImageEditorState,
	imageSize: Size,
	cropRect: NormalizedRect
): NormalizedRect {
	return snapCropRectEdgesToSourcePixels( state, imageSize, cropRect, {
		left: true,
		top: true,
		right: true,
		bottom: true,
	} );
}

function snapCropRectEdgesToSourcePixels(
	state: InternalImageEditorState,
	imageSize: Size,
	cropRect: NormalizedRect,
	edges: SourcePixelSnapEdges
): NormalizedRect {
	if ( ! isValidSize( imageSize ) ) {
		return cropRect;
	}

	const stateWithCrop = sanitizeImageEditorState( { ...state, cropRect } );
	const region = getSourceRegion( stateWithCrop, imageSize );
	const shouldSnapX = edges.left || edges.right;
	const shouldSnapY = edges.top || edges.bottom;
	const left = edges.left ? Math.round( region.x ) : region.x;
	const top = edges.top ? Math.round( region.y ) : region.y;
	const right = edges.right
		? Math.round( region.x + region.width )
		: region.x + region.width;
	const bottom = edges.bottom
		? Math.round( region.y + region.height )
		: region.y + region.height;
	if ( right <= left || bottom <= top ) {
		return cropRect;
	}

	const snappedCropRect = getCropRectFromSourceRegion(
		stateWithCrop,
		imageSize,
		{
			...region,
			x: left,
			y: top,
			width: right - left,
			height: bottom - top,
		}
	);
	if ( ! snappedCropRect ) {
		return cropRect;
	}

	return {
		x: shouldSnapX ? snappedCropRect.x : cropRect.x,
		y: shouldSnapY ? snappedCropRect.y : cropRect.y,
		width: shouldSnapX ? snappedCropRect.width : cropRect.width,
		height: shouldSnapY ? snappedCropRect.height : cropRect.height,
	};
}
