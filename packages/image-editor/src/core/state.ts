import type {
	ImageEditorAction,
	ImageEditorState,
	InternalImageEditorState,
	NormalizedPoint,
	NormalizedRect,
	Size,
} from './types';
import {
	ABSOLUTE_MIN_ZOOM,
	DEFAULT_STATE,
	MAX_ZOOM,
	MIN_ZOOM,
} from './constants';
import { normalizeRotation, degreesToRadians } from './math/rotation';
import { restrictPanZoom, restrictCropRect } from './containment';
import { computeInscribedRect } from './crop-rect';
import { getRotatedBBox } from './camera';

/** Small tolerance for editor floating-point comparisons. */
const STATE_EPSILON = 1e-6;

function nearlyEqual( a: number, b: number ): boolean {
	return Math.abs( a - b ) < STATE_EPSILON;
}

/**
 * Fill in the values the editor keeps for itself when a state does not
 * carry them. A state the editor handed out always has them, so the same
 * object comes back; one built by hand does not, and the reducer reads
 * them on the first change. The base pose starts where the state is.
 *
 * @param state A state from the editor, or one built by hand.
 * @return The state, with the editor's own values present.
 */
export function withBaseValues(
	state: ImageEditorState
): InternalImageEditorState {
	const full = state as InternalImageEditorState;
	if (
		full.basePan &&
		typeof full.baseZoom === 'number' &&
		typeof full.baseRotation === 'number'
	) {
		return full;
	}
	return {
		...full,
		basePan: full.basePan ?? { ...state.pan },
		baseZoom: full.baseZoom ?? state.zoom,
		baseRotation: full.baseRotation ?? state.rotation,
	};
}

/**
 * The shape of the view the crop rect is measured against: the image,
 * turned by its rotation snapped to a quarter turn. It is the shape the
 * canvas lays out, so the reducer can keep a locked ratio without the
 * canvas. `undefined` when no image is loaded.
 *
 * @param state The editor state.
 * @return The view's width and height, or `undefined`.
 */
function getViewShape( state: InternalImageEditorState ): Size | undefined {
	const { image, rotation } = state;
	if ( ! image ) {
		return undefined;
	}
	const viewShape = getRotatedBBox(
		image.naturalWidth,
		image.naturalHeight,
		Math.round( rotation / 90 ) * 90
	);
	return viewShape.width > 0 && viewShape.height > 0 ? viewShape : undefined;
}

/**
 * The crop rect for the locked ratio: the largest centred box of that
 * ratio. `undefined` when no ratio is locked or no image is loaded.
 *
 * @param state The editor state.
 * @return The crop rect for the locked ratio, or `undefined`.
 */
function getLockedCropRect(
	state: InternalImageEditorState
): NormalizedRect | undefined {
	const viewShape = getViewShape( state );
	if ( ! viewShape || ! state.aspectRatio || state.aspectRatio <= 0 ) {
		return undefined;
	}
	return computeInscribedRect( state.aspectRatio, viewShape );
}

/**
 * How far a crop's shape may be from the locked ratio, relative to it, and
 * still count as matching. It leaves room for rounding in a handle drag.
 */
const LOCKED_RATIO_TOLERANCE = 1e-3;

/**
 * Make the crop match the locked ratio, so a locked ratio always means a
 * crop of that ratio. A crop that matches is returned as it is. Otherwise
 * the crop keeps its centre and width and takes the height the ratio
 * needs; if that is taller than the view, it takes the full height and
 * the width the ratio needs. A full frame becomes the largest box of the
 * ratio.
 *
 * @param state The editor state.
 * @return The same state when the crop matches, or a state with a crop
 *         that does.
 */
export function fitCropToLockedRatio(
	state: InternalImageEditorState
): InternalImageEditorState {
	const { aspectRatio, cropRect } = state;
	const viewShape = getViewShape( state );
	if (
		! viewShape ||
		! aspectRatio ||
		aspectRatio <= 0 ||
		cropRect.width <= 0 ||
		cropRect.height <= 0
	) {
		return state;
	}
	// The crop's width / height, in view fractions, that gives the locked
	// ratio in pixels.
	const lockedShape = ( aspectRatio * viewShape.height ) / viewShape.width;
	const shape = cropRect.width / cropRect.height;
	if ( Math.abs( shape / lockedShape - 1 ) <= LOCKED_RATIO_TOLERANCE ) {
		return state;
	}
	let width = Math.min( cropRect.width, 1 );
	let height = width / lockedShape;
	if ( height > 1 ) {
		height = 1;
		width = lockedShape;
	}
	const centreX = cropRect.x + cropRect.width / 2;
	const centreY = cropRect.y + cropRect.height / 2;
	return {
		...state,
		cropRect: {
			x: Math.min( Math.max( centreX - width / 2, 0 ), 1 - width ),
			y: Math.min( Math.max( centreY - height / 2, 0 ), 1 - height ),
			width,
			height,
		},
	};
}

/**
 * The crop a quarter turn should leave behind.
 *
 * Without a locked ratio the crop follows the image round, which is the
 * swapped rect the caller passes. A locked crop at the largest size for
 * its view stays at the largest size after the turn. A smaller crop keeps
 * its pixel size, measured as a different fraction of the turned view.
 *
 * When those pixels no longer fit the transposed view, the crop becomes
 * the largest box of the ratio instead.
 *
 * @param state   The state before the turn.
 * @param swapped The crop with its sides swapped, which is what a turn
 *                does without a lock.
 * @return The crop to use.
 */
function keepCropThroughQuarterTurn(
	state: InternalImageEditorState,
	swapped: NormalizedRect
): NormalizedRect {
	const view = getViewShape( state );
	const { aspectRatio, cropRect } = state;
	if ( ! view || ! aspectRatio || aspectRatio <= 0 ) {
		return swapped;
	}
	const maximum = computeInscribedRect( aspectRatio, view );
	if (
		nearlyEqual( cropRect.x, maximum.x ) &&
		nearlyEqual( cropRect.y, maximum.y ) &&
		nearlyEqual( cropRect.width, maximum.width ) &&
		nearlyEqual( cropRect.height, maximum.height )
	) {
		// A maximum crop stays maximum after the view turns.
		return computeInscribedRect( aspectRatio, {
			width: view.height,
			height: view.width,
		} );
	}
	// The view transposes, so a width that was a fraction of `view.width`
	// becomes the same pixels over `view.height`.
	const width = ( cropRect.width * view.width ) / view.height;
	const height = ( cropRect.height * view.height ) / view.width;
	if ( width > 1 || height > 1 ) {
		// Those pixels do not fit the transposed view, so take the
		// largest box of the ratio that does.
		return computeInscribedRect( aspectRatio, {
			width: view.height,
			height: view.width,
		} );
	}
	const centreX = swapped.x + swapped.width / 2;
	const centreY = swapped.y + swapped.height / 2;
	return {
		x: Math.min( Math.max( centreX - width / 2, 0 ), 1 - width ),
		y: Math.min( Math.max( centreY - height / 2, 0 ), 1 - height ),
		width,
		height,
	};
}

/**
 * Value-equality check for two editor states.
 *
 * Compares the public edit fields to dedup snapshots and detect no-op
 * transitions. The editor's internal base pose is not part of the edit.
 *
 * @param a First editor state.
 * @param b Second editor state.
 * @return Whether the two states are value-equal across all tracked fields.
 */
export function areImageEditorStatesEqual(
	a: ImageEditorState,
	b: ImageEditorState
): boolean {
	const aImage = a.image;
	const bImage = b.image;
	return (
		aImage?.src === bImage?.src &&
		aImage?.naturalWidth === bImage?.naturalWidth &&
		aImage?.naturalHeight === bImage?.naturalHeight &&
		nearlyEqual( a.pan.x, b.pan.x ) &&
		nearlyEqual( a.pan.y, b.pan.y ) &&
		nearlyEqual( a.zoom, b.zoom ) &&
		nearlyEqual( a.rotation, b.rotation ) &&
		a.flip.horizontal === b.flip.horizontal &&
		a.flip.vertical === b.flip.vertical &&
		nearlyEqual( a.cropRect.x, b.cropRect.x ) &&
		nearlyEqual( a.cropRect.y, b.cropRect.y ) &&
		nearlyEqual( a.cropRect.width, b.cropRect.width ) &&
		nearlyEqual( a.cropRect.height, b.cropRect.height ) &&
		a.aspectRatio === b.aspectRatio
	);
}

function clampRequestedZoom(
	state: InternalImageEditorState,
	zoom: number
): number {
	// With an image, enforceContainment raises zoom to the coverage-aware
	// floor below. Without an image, no enforcement runs, so MIN_ZOOM stays
	// the conservative resting default.
	if ( state.image ) {
		return Math.min( MAX_ZOOM, Math.max( ABSOLUTE_MIN_ZOOM, zoom ) );
	}
	return Math.min( MAX_ZOOM, Math.max( MIN_ZOOM, zoom ) );
}

/**
 * Rotate the last committed pan without containment. A quarter turn may
 * temporarily clamp this position, but a later turn can use it again.
 *
 * @param state    The editor state.
 * @param rotation The angle to rotate the base pan to.
 * @return The pan before containment at that angle.
 */
function getUnclampedPanAtRotation(
	state: InternalImageEditorState,
	rotation: number
): NormalizedPoint {
	if ( rotation === state.baseRotation ) {
		return state.basePan;
	}
	// A single viewport-relative flip reverses the visual rotation.
	const singleFlip = state.flip.horizontal !== state.flip.vertical;
	const deltaRad = degreesToRadians( rotation - state.baseRotation );
	const cos = Math.cos( deltaRad );
	const sin = Math.sin( deltaRad ) * ( singleFlip ? -1 : 1 );
	const cropCx = state.cropRect.x + state.cropRect.width / 2;
	const cropCy = state.cropRect.y + state.cropRect.height / 2;
	const ox = cropCx - 0.5;
	const oy = cropCy - 0.5;
	const dx = state.basePan.x - ox;
	const dy = state.basePan.y - oy;
	return {
		x: ox + cos * dx - sin * dy,
		y: oy + sin * dx + cos * dy,
	};
}

/**
 * Enforces containment: restricts the crop rect to fit within the
 * rotated image, computes minimum zoom, clamps zoom, and restricts
 * the pan position so the image always covers the crop area.
 * Called after every relevant state transition.
 *
 * @param state The state to enforce containment on.
 * @return The state with cropRect, zoom, and position restricted.
 */
export function enforceContainment(
	state: InternalImageEditorState
): InternalImageEditorState {
	if ( ! state.image ) {
		return state;
	}
	const imageSize = {
		width: state.image.naturalWidth,
		height: state.image.naturalHeight,
	};
	const imageAspectRatio = imageSize.width / imageSize.height;

	// 1. First bump zoom so the image can cover the crop rect as-is.
	//    This ensures that explicit crop rect changes (e.g., fixed-crop
	//    mode during rotation) get zoom accommodation, not crop shrinkage.
	const { pan: panAfterZoom, zoom } = restrictPanZoom(
		state,
		imageSize,
		state.cropRect
	);

	// 2. Now restrict the crop rect at the (possibly bumped) zoom.
	//    This handles cases where the crop rect is still too large
	//    (e.g., if zoom hit MAX_ZOOM).
	const cropRect = restrictCropRect(
		state.cropRect,
		zoom,
		state.rotation,
		imageAspectRatio
	);

	// 3. If the crop rect was shrunk, re-restrict pan for the new rect.
	let pan = panAfterZoom;
	if ( cropRect !== state.cropRect ) {
		( { pan } = restrictPanZoom(
			{ ...state, zoom, cropRect },
			imageSize,
			cropRect
		) );
	}

	if (
		pan.x === state.pan.x &&
		pan.y === state.pan.y &&
		zoom === state.zoom &&
		cropRect === state.cropRect
	) {
		return state;
	}
	return { ...state, pan, zoom, cropRect };
}

/**
 * Snapshot the current pan, zoom, and rotation into the base pose.
 * Called by committing actions other than SNAP_ROTATE_90, which keeps
 * its unclamped pan so later turns can restore it.
 *
 * SET_ROTATION reads the base without changing it, which prevents
 * accumulated rotation drift near image edges.
 *
 * @param next The post-containment state to commit.
 * @return The state with base fields synced to current.
 */
function commitBase(
	next: InternalImageEditorState
): InternalImageEditorState {
	if (
		next.basePan.x === next.pan.x &&
		next.basePan.y === next.pan.y &&
		next.baseZoom === next.zoom &&
		next.baseRotation === next.rotation
	) {
		return next;
	}
	return {
		...next,
		basePan: { x: next.pan.x, y: next.pan.y },
		baseZoom: next.zoom,
		baseRotation: next.rotation,
	};
}

/**
 * Reducer function for editor state management.
 *
 * Every state transition that could invalidate the containment invariant
 * (crop, zoom, rotation, cropRect, flip) is followed by enforceContainment
 * to ensure the image always covers the crop area.
 *
 * Committing actions update the base pose. SNAP_ROTATE_90 retains its
 * unclamped pan in the base so later turns can restore it; SET_ROTATION
 * derives from the base without mutating it, preventing accumulated
 * clamp drift during continuous fine rotation.
 *
 * @param state  The current editor state.
 * @param action The action to process.
 * @return The new editor state.
 */
export function imageEditorReducer(
	state: InternalImageEditorState,
	action: ImageEditorAction
): InternalImageEditorState {
	// Every action runs through enforceContainment to maintain the invariant:
	// the image always fully covers the crop area.
	switch ( action.type ) {
		case 'SET_IMAGE':
			return commitBase(
				enforceContainment(
					fitCropToLockedRatio( {
						...state,
						image: action.payload,
					} )
				)
			);

		case 'SET_PAN': {
			const next = enforceContainment( {
				...state,
				pan: action.payload,
			} );
			// A pan that hits the boundary has not changed the framing.
			// Keep the unclamped base pan for later rotations.
			return areImageEditorStatesEqual( state, next )
				? state
				: commitBase( next );
		}

		case 'SET_ZOOM': {
			const z = clampRequestedZoom( state, action.payload );
			return commitBase(
				enforceContainment( {
					...state,
					zoom: z,
				} )
			);
		}

		case 'SET_ZOOM_AT_POINT': {
			const z = clampRequestedZoom( state, action.payload.zoom );
			return commitBase(
				enforceContainment( {
					...state,
					zoom: z,
					pan: action.payload.pan,
				} )
			);
		}

		case 'SET_ROTATION': {
			// Rotate the base pan around the crop-rect center by the
			// delta from the base rotation. Deriving each tick from
			// the fixed base — rather than compounding on the previous
			// tick — prevents accumulated-clamp drift. Rotating
			// 0°→30°→0° now returns to the exact base pan.
			//
			// Zoom starts from baseZoom; enforceContainment may bump it
			// up to cover the rotated crop, but never raises the base.
			//
			// SET_ROTATION is the only action that does NOT call
			// commitBase — the base pose stays pinned at the user's
			// last committed pan/zoom/rotation.
			const newRotation = normalizeRotation( action.payload );
			// Rotating past 45° from a quarter turn changes the view's
			// shape, so a locked crop is refitted around its centre.
			return enforceContainment(
				fitCropToLockedRatio( {
					...state,
					rotation: newRotation,
					zoom: state.baseZoom,
					pan: getUnclampedPanAtRotation( state, newRotation ),
				} )
			);
		}

		case 'SNAP_ROTATE_90': {
			// 90° snap: the crop rect rotates 90° around its own center
			// (width/height swap), and the pan rotates 90° around the
			// pan-space origin. The combination keeps the same image
			// slice framed — just viewed through a rotated window.
			//
			// `direction` is the visual rotation the caller wants: +1
			// means "rotate the image CW on screen", −1 means "CCW".
			// With a single-axis flip active, rotation on screen appears
			// reversed relative to the rotation field (S·R·S conjugation),
			// so internally we negate the direction applied to the
			// `rotation` field. Pan rotates in the caller's direction —
			// that way the same image content stays framed after the
			// snap regardless of flip state.
			const rawDir = action.payload.direction;
			const singleFlip = state.flip.horizontal !== state.flip.vertical;
			const fieldDir = singleFlip ? -rawDir : rawDir;
			const rot90 = normalizeRotation( state.rotation + fieldDir * 90 );
			const rect = state.cropRect;
			const cx = rect.x + rect.width / 2;
			const cy = rect.y + rect.height / 2;

			// Rotate the unclamped pan 90° around origin so a later turn can
			// restore a position that does not fit at this angle.
			//   CW  (rawDir=+1): (px, py) → (-py, px)
			//   CCW (rawDir=-1): (px, py) → (py, -px)
			const panBeforeTurn = getUnclampedPanAtRotation(
				state,
				state.rotation
			);
			const newPanX = rawDir === 1 ? -panBeforeTurn.y : panBeforeTurn.y;
			const newPanY = rawDir === 1 ? panBeforeTurn.x : -panBeforeTurn.x;

			// Without a locked ratio, swapping the crop's sides carries it
			// round with the image. With one, the crop keeps the pixel
			// size it had, which is what the lock is about, so only its
			// fractions change as the view transposes.
			const turned = keepCropThroughQuarterTurn( state, {
				x: cx - rect.height / 2,
				y: cy - rect.width / 2,
				width: rect.height,
				height: rect.width,
			} );
			const next = enforceContainment( {
				...state,
				rotation: rot90,
				zoom: state.baseZoom,
				pan: { x: newPanX, y: newPanY },
				cropRect: turned,
			} );
			return {
				...next,
				// This is the position before containment, not the visible pan.
				basePan: { x: newPanX, y: newPanY },
				baseZoom: next.zoom,
				baseRotation: next.rotation,
			};
		}

		case 'SET_FLIP': {
			// Mirror the crop rect and pan so the same image content stays
			// framed after a flip. Flip in the camera matrix is composed
			// outside rotation (viewport-relative), so both `pan` and
			// `cropRect` live in viewport-aligned space: negating the flipped
			// axis on each is enough — no rotation math needed.
			const oldFlip = state.flip;
			const newFlip = action.payload;
			const flippedH = oldFlip.horizontal !== newFlip.horizontal;
			const flippedV = oldFlip.vertical !== newFlip.vertical;
			const rect = state.cropRect;

			return commitBase(
				enforceContainment( {
					...state,
					flip: newFlip,
					pan: {
						x: flippedH ? -state.pan.x : state.pan.x,
						y: flippedV ? -state.pan.y : state.pan.y,
					},
					cropRect: {
						x: flippedH ? 1 - rect.x - rect.width : rect.x,
						y: flippedV ? 1 - rect.y - rect.height : rect.y,
						width: rect.width,
						height: rect.height,
					},
				} )
			);
		}

		case 'SET_CROP_RECT':
			return commitBase(
				enforceContainment(
					fitCropToLockedRatio( {
						...state,
						cropRect: action.payload,
					} )
				)
			);

		case 'SET_ASPECT_RATIO': {
			// A ratio of zero or less is not a shape; treat it as free, so
			// it compares equal to an unlocked crop.
			const aspectRatio =
				action.payload !== undefined && action.payload > 0
					? action.payload
					: undefined;
			const next = { ...state, aspectRatio };
			const cropRect = getLockedCropRect( next );
			if ( ! cropRect ) {
				return state.aspectRatio === aspectRatio ? state : next;
			}
			return commitBase( enforceContainment( { ...next, cropRect } ) );
		}

		case 'SETTLE_CROP': {
			// After a resize drag ends: expand the crop to fill the
			// available height (maintaining its aspect ratio), center it,
			// and adjust zoom/pan so the exact same image content that
			// was visible inside the old crop is visible in the new one.
			const rect = state.cropRect;
			if ( rect.width === 0 || rect.height === 0 || ! state.image ) {
				return state;
			}

			// Scale factor: how much the crop grows. fitScale fills the
			// larger axis to 1 (viewport-filling settle). Cap so the
			// resulting zoom stays at or below MAX_ZOOM — tight crops
			// would otherwise push state.zoom past the user-facing cap
			// and break wheel/slider interactions, which clamp to
			// MAX_ZOOM and snap state.zoom down on the first input.
			const fitScale = 1 / Math.max( rect.width, rect.height );
			const zoomCap = state.zoom > 0 ? MAX_ZOOM / state.zoom : fitScale;
			const s = Math.min( fitScale, zoomCap );

			const newW = rect.width * s;
			const newH = rect.height * s;

			// The old crop center in normalized visual space.
			const oldCx = rect.x + rect.width / 2;
			const oldCy = rect.y + rect.height / 2;

			// Zoom scales by s so the same image region fills the new
			// crop at the same relative size. When s is capped, the new
			// crop is smaller than the viewport but the visible content
			// inside it remains the source region the user framed.
			// Pan: the visible content center was at
			//   (cropCx - crop.x, cropCy - crop.y)
			// in visual-normalized space. After centering the crop to
			// (0.5, 0.5), the pan must place that same content at
			// the new center. Both pan and zoom scale by s because
			// the CSS translate is independent of zoom.
			return commitBase(
				enforceContainment( {
					...state,
					zoom: state.zoom * s,
					pan: {
						x: ( state.pan.x - oldCx + 0.5 ) * s,
						y: ( state.pan.y - oldCy + 0.5 ) * s,
					},
					cropRect: {
						x: ( 1 - newW ) / 2,
						y: ( 1 - newH ) / 2,
						width: newW,
						height: newH,
					},
				} )
			);
		}

		case 'RESET':
			return commitBase(
				enforceContainment(
					fitCropToLockedRatio( {
						...DEFAULT_STATE,
						image: state.image,
						...action.payload,
					} )
				)
			);
	}
}

/**
 * Shallow comparison of key editor state fields to determine if
 * the state has been modified from an initial snapshot.
 *
 * @param current The current editor state.
 * @param initial The initial editor state snapshot.
 * @return True if any tracked field differs.
 */
export function isStateDirty(
	current: ImageEditorState,
	initial: ImageEditorState
): boolean {
	return (
		! nearlyEqual( current.pan.x, initial.pan.x ) ||
		! nearlyEqual( current.pan.y, initial.pan.y ) ||
		! nearlyEqual( current.zoom, initial.zoom ) ||
		! nearlyEqual( current.rotation, initial.rotation ) ||
		current.flip.horizontal !== initial.flip.horizontal ||
		current.flip.vertical !== initial.flip.vertical ||
		! nearlyEqual( current.cropRect.x, initial.cropRect.x ) ||
		! nearlyEqual( current.cropRect.y, initial.cropRect.y ) ||
		! nearlyEqual( current.cropRect.width, initial.cropRect.width ) ||
		! nearlyEqual( current.cropRect.height, initial.cropRect.height )
	);
}
