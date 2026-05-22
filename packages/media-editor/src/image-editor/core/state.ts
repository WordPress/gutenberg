/**
 * Internal dependencies
 */
import type { CropperAction, CropperState, TransformOperation } from './types';
import {
	ABSOLUTE_MIN_ZOOM,
	DEFAULT_STATE,
	MAX_ZOOM,
	MIN_ZOOM,
} from './constants';
import { normalizeRotation, degreesToRadians } from './math/rotation';
import { restrictPanZoom, restrictCropRect } from './containment';

/** Small tolerance for cropper floating-point comparisons. */
const STATE_EPSILON = 1e-6;

function nearlyEqual( a: number, b: number ): boolean {
	return Math.abs( a - b ) < STATE_EPSILON;
}

/**
 * Value-equality check for two cropper states.
 *
 * Used by history machinery to dedup snapshots and detect no-op
 * transitions. Compares every field that participates in the rendered
 * output; ignores reference identity.
 *
 * @param a First cropper state.
 * @param b Second cropper state.
 * @return Whether the two states are value-equal across all tracked fields.
 */
export function areCropperStatesEqual(
	a: CropperState,
	b: CropperState
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
		nearlyEqual( a.cropRect.height, b.cropRect.height )
	);
}

function clampRequestedZoom( state: CropperState, zoom: number ): number {
	// With an image, enforceContainment raises zoom to the coverage-aware
	// floor below. Without an image, no enforcement runs, so MIN_ZOOM stays
	// the conservative resting default.
	if ( state.image ) {
		return Math.min( MAX_ZOOM, Math.max( ABSOLUTE_MIN_ZOOM, zoom ) );
	}
	return Math.min( MAX_ZOOM, Math.max( MIN_ZOOM, zoom ) );
}

/**
 * Translate a pipeline transform operation into the equivalent
 * reducer action. Pipeline ops aren't 1:1 with reducer actions —
 * `rotate` is a delta here, whereas SET_ROTATION takes an absolute
 * angle — so deltas are resolved against the current state.
 *
 * Used by APPLY_OPERATION (and by the pipeline module's
 * `applyOperationToState`, which is now a thin wrapper around the
 * reducer) so that pipeline replay produces identical bounded
 * state to UI interaction or direct setters.
 *
 * @param state The current cropper state.
 * @param op    The pipeline operation.
 * @return The equivalent reducer action.
 */
function operationToAction(
	state: CropperState,
	op: TransformOperation
): CropperAction {
	switch ( op.type ) {
		case 'crop':
			return { type: 'SET_CROP_RECT', payload: { ...op.rect } };
		case 'rotate': {
			// `op.degrees` is the visual rotation the caller wants (positive
			// = CW on screen). A single-axis flip inverts on-screen rotation
			// relative to the rotation field, so negate the field delta in
			// that case — this keeps `{ type: 'rotate', degrees: 90 }` a
			// reliable "90° clockwise visually" instruction across flip
			// states, matching the SNAP_ROTATE_90 convention.
			const singleFlip = state.flip.horizontal !== state.flip.vertical;
			const fieldDelta = singleFlip ? -op.degrees : op.degrees;
			return {
				type: 'SET_ROTATION',
				payload: normalizeRotation( state.rotation + fieldDelta ),
			};
		}
		case 'flip':
			return {
				type: 'SET_FLIP',
				payload: {
					...state.flip,
					[ op.direction ]: ! state.flip[ op.direction ],
				},
			};
		case 'zoom':
			return { type: 'SET_ZOOM', payload: op.factor };
	}
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
export function enforceContainment( state: CropperState ): CropperState {
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
 * Snapshot the current `crop`, `zoom`, and `rotation` into the
 * corresponding `basePan`, `baseZoom`, `baseRotation` fields. Called
 * by every committing action so that the next SET_ROTATION derives
 * its transient pan from a fresh base (not from a drifted one).
 *
 * SET_ROTATION is the only action that does NOT commit base — it
 * reads the base, computes a transient pan, and leaves the base
 * alone. This is what eliminates rotation drift near edges.
 *
 * @param next The post-containment state to commit.
 * @return The state with base fields synced to current.
 */
function commitBase( next: CropperState ): CropperState {
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
 * Reducer function for cropper state management.
 *
 * Every state transition that could invalidate the containment invariant
 * (crop, zoom, rotation, cropRect, flip) is followed by enforceContainment
 * to ensure the image always covers the crop area.
 *
 * Committing actions (everything except SET_ROTATION) also call
 * `commitBase` to snapshot the post-containment state as the new
 * base pose. SET_ROTATION derives from that base without mutating
 * it, which prevents accumulated-clamp drift during continuous fine
 * rotation.
 *
 * @param state  The current cropper state.
 * @param action The action to process.
 * @return The new cropper state.
 */
export function cropperReducer(
	state: CropperState,
	action: CropperAction
): CropperState {
	// Every action runs through enforceContainment to maintain the invariant:
	// the image always fully covers the crop area.
	switch ( action.type ) {
		case 'SET_IMAGE':
			return commitBase(
				enforceContainment( {
					...state,
					image: action.payload,
				} )
			);

		case 'SET_PAN':
			return commitBase(
				enforceContainment( {
					...state,
					pan: action.payload,
				} )
			);

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
			// With viewport-relative flip, pan rotation is conjugated by
			// the flip (S * R * S) — which reverses direction when exactly
			// one axis is flipped. Negate sin in that case so the crop
			// stays framed on the same image content through rotation.
			const singleFlip = state.flip.horizontal !== state.flip.vertical;
			const deltaRad = degreesToRadians(
				newRotation - state.baseRotation
			);
			const cos = Math.cos( deltaRad );
			const sin = Math.sin( deltaRad ) * ( singleFlip ? -1 : 1 );
			const cropCx = state.cropRect.x + state.cropRect.width / 2;
			const cropCy = state.cropRect.y + state.cropRect.height / 2;
			const ox = cropCx - 0.5;
			const oy = cropCy - 0.5;
			const dx = state.basePan.x - ox;
			const dy = state.basePan.y - oy;
			return enforceContainment( {
				...state,
				rotation: newRotation,
				zoom: state.baseZoom,
				pan: {
					x: ox + cos * dx - sin * dy,
					y: oy + sin * dx + cos * dy,
				},
			} );
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

			// Rotate pan vector 90° around origin.
			//   CW  (rawDir=+1): (px, py) → (-py, px)
			//   CCW (rawDir=-1): (px, py) → (py, -px)
			const newPanX = rawDir === 1 ? -state.pan.y : state.pan.y;
			const newPanY = rawDir === 1 ? state.pan.x : -state.pan.x;

			return commitBase(
				enforceContainment( {
					...state,
					rotation: rot90,
					zoom: state.baseZoom,
					pan: { x: newPanX, y: newPanY },
					cropRect: {
						x: cx - rect.height / 2,
						y: cy - rect.width / 2,
						width: rect.height,
						height: rect.width,
					},
				} )
			);
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
				enforceContainment( {
					...state,
					cropRect: action.payload,
				} )
			);

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

		case 'APPLY_OPERATION':
			// Route through the action equivalent so a pipeline replay
			// yields the same bounded state as the matching UI/setter
			// path (containment, baseZoom relaxation, pan rotation
			// around crop center, etc.).
			return cropperReducer(
				state,
				operationToAction( state, action.payload )
			);

		case 'RESET':
			return commitBase(
				enforceContainment( {
					...DEFAULT_STATE,
					image: state.image,
					...action.payload,
				} )
			);
	}
}

/**
 * Shallow comparison of key cropper state fields to determine if
 * the state has been modified from an initial snapshot.
 *
 * @param current The current cropper state.
 * @param initial The initial cropper state snapshot.
 * @return True if any tracked field differs.
 */
export function isStateDirty(
	current: CropperState,
	initial: CropperState
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
