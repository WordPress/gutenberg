/**
 * WordPress dependencies
 */
import { useReducer, useCallback, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type {
	CropperState,
	CropperAction,
	TransformOperation,
	NormalizedPoint,
	NormalizedRect,
	Flip,
} from '../core/types';
import { DEFAULT_STATE, MAX_ZOOM } from '../core/constants';
import { applyOperationToState } from '../core/transforms/pipeline';
import { normalizeRotation, degreesToRadians } from '../core/math/rotation';
import { restrictPanZoom, restrictCropRect } from '../core/camera';
import { exportCroppedImage } from '../core/export/canvas-renderer';

/**
 * The return type of the useCropperState hook.
 */
export interface UseCropperStateReturn {
	/** The current cropper state. */
	state: CropperState;
	/** The raw dispatch function for sending actions to the reducer. */
	dispatch: React.Dispatch< CropperAction >;
	/** Set the pan offset in normalized coordinates. */
	setCrop: ( crop: NormalizedPoint ) => void;
	/** Set the zoom level. Clamped to [1, 10]. */
	setZoom: ( zoom: number ) => void;
	/** Set the rotation in degrees. Normalized to [0, 360). */
	setRotation: ( rotation: number ) => void;
	/** Set the flip state. */
	setFlip: ( flip: Flip ) => void;
	/** Set the crop rectangle in normalized coordinates. */
	setCropRect: ( rect: NormalizedRect ) => void;
	/** Apply a transform operation through the pipeline. */
	applyOperation: ( op: TransformOperation ) => void;
	/** Reset the state. Optionally merge partial state overrides. */
	reset: ( resetState?: Partial< CropperState > ) => void;
	/** Whether the current state differs from the initial state. */
	isDirty: boolean;
	/** Export the cropped image as a Blob. */
	getCroppedImage: (
		mimeType?: string,
		quality?: number
	) => Promise< Blob | null >;
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
function enforceContainment( state: CropperState ): CropperState {
	if ( ! state.image ) {
		return state;
	}
	const imageSize = {
		width: state.image.naturalWidth,
		height: state.image.naturalHeight,
	};
	const imageAspectRatio = imageSize.width / imageSize.height;

	// 1. Restrict crop rect so it fits within the rotated, zoomed image.
	const cropRect = restrictCropRect(
		state.cropRect,
		state.zoom,
		state.rotation,
		imageAspectRatio
	);

	// 2. Restrict pan and zoom with the (possibly shrunk) crop rect.
	const stateWithRect =
		cropRect === state.cropRect ? state : { ...state, cropRect };
	const { crop, zoom } = restrictPanZoom(
		stateWithRect,
		imageSize,
		cropRect
	);

	if (
		crop.x === state.crop.x &&
		crop.y === state.crop.y &&
		zoom === state.zoom &&
		cropRect === state.cropRect
	) {
		return state;
	}
	return { ...state, crop, zoom, cropRect };
}

/**
 * Enforces containment without adjusting zoom: restricts the crop rect
 * and pan position, but keeps the current zoom level unchanged.
 * Used when resizing the crop rect so it doesn't trigger zoom changes.
 *
 * @param state The state to enforce containment on.
 * @return The state with cropRect and position restricted.
 */
function enforceContainmentKeepZoom( state: CropperState ): CropperState {
	if ( ! state.image ) {
		return state;
	}
	const imageSize = {
		width: state.image.naturalWidth,
		height: state.image.naturalHeight,
	};
	const { crop } = restrictPanZoom( state, imageSize, state.cropRect );
	if ( crop.x === state.crop.x && crop.y === state.crop.y ) {
		return state;
	}
	return { ...state, crop };
}

/**
 * Reducer function for cropper state management.
 *
 * Every state transition that could invalidate the containment invariant
 * (crop, zoom, rotation, cropRect, flip) is followed by enforceContainment
 * to ensure the image always covers the crop area.
 *
 * @param state  The current cropper state.
 * @param action The action to process.
 * @return The new cropper state.
 */
function cropperReducer(
	state: CropperState,
	action: CropperAction
): CropperState {
	switch ( action.type ) {
		case 'SET_IMAGE':
			return enforceContainment( {
				...state,
				image: action.payload,
			} );

		case 'SET_CROP':
			return enforceContainment( {
				...state,
				crop: action.payload,
			} );

		case 'SET_ZOOM':
			return enforceContainment( {
				...state,
				zoom: Math.min( MAX_ZOOM, Math.max( 1, action.payload ) ),
			} );

		case 'SET_ROTATION': {
			const newRotation = normalizeRotation( action.payload );
			const newState = { ...state, rotation: newRotation };

			// The crop rect and pan are normalized to visualImageSize,
			// which changes on rotation. Rescale both to preserve their
			// screen-space pixel size and position.
			//
			// Skip only when the crop already fills the full visual
			// space (width≈1 AND height≈1) — there's nothing to
			// preserve and it must expand to fill the new footprint.
			const isFull =
				state.cropRect.width > 1 - 1e-9 &&
				state.cropRect.height > 1 - 1e-9;

			if ( ! isFull && state.image && state.image.naturalWidth > 0 ) {
				const nat = {
					width: state.image.naturalWidth,
					height: state.image.naturalHeight,
				};
				const rad1 = degreesToRadians( state.rotation );
				const rad2 = degreesToRadians( newRotation );
				const cos1 = Math.abs( Math.cos( rad1 ) );
				const sin1 = Math.abs( Math.sin( rad1 ) );
				const cos2 = Math.abs( Math.cos( rad2 ) );
				const sin2 = Math.abs( Math.sin( rad2 ) );
				const oldBoxW = cos1 * nat.width + sin1 * nat.height;
				const oldBoxH = sin1 * nat.width + cos1 * nat.height;
				const newBoxW = cos2 * nat.width + sin2 * nat.height;
				const newBoxH = sin2 * nat.width + cos2 * nat.height;

				if ( oldBoxW > 0 && newBoxW > 0 ) {
					const scaleW = oldBoxW / newBoxW;
					const scaleH = oldBoxH / newBoxH;

					// Rescale crop rect to preserve pixel size.
					const newW = Math.min( state.cropRect.width * scaleW, 1 );
					const newH = Math.min( state.cropRect.height * scaleH, 1 );
					const cx = state.cropRect.x + state.cropRect.width / 2;
					const cy = state.cropRect.y + state.cropRect.height / 2;
					newState.cropRect = {
						x: Math.max( 0, Math.min( cx - newW / 2, 1 - newW ) ),
						y: Math.max( 0, Math.min( cy - newH / 2, 1 - newH ) ),
						width: newW,
						height: newH,
					};

					// Rescale pan offset to preserve screen position.
					newState.crop = {
						x: state.crop.x * scaleW,
						y: state.crop.y * scaleH,
					};
				}
			}

			return enforceContainment( newState );
		}

		case 'SET_FLIP':
			return enforceContainment( {
				...state,
				flip: action.payload,
			} );

		case 'SET_CROP_RECT':
			return enforceContainmentKeepZoom( {
				...state,
				cropRect: action.payload,
			} );

		case 'APPLY_OPERATION':
			return enforceContainment(
				applyOperationToState( state, action.payload )
			);

		case 'RESET':
			return {
				...DEFAULT_STATE,
				image: state.image,
				...action.payload,
			};
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
function isStateDirty( current: CropperState, initial: CropperState ): boolean {
	return (
		current.crop.x !== initial.crop.x ||
		current.crop.y !== initial.crop.y ||
		current.zoom !== initial.zoom ||
		current.rotation !== initial.rotation ||
		current.flip.horizontal !== initial.flip.horizontal ||
		current.flip.vertical !== initial.flip.vertical ||
		current.cropRect.x !== initial.cropRect.x ||
		current.cropRect.y !== initial.cropRect.y ||
		current.cropRect.width !== initial.cropRect.width ||
		current.cropRect.height !== initial.cropRect.height
	);
}

/**
 * Reducer-based state management hook for the image cropper.
 *
 * Provides the full cropper state, a dispatch function, and
 * convenience action creators for common operations.
 *
 * @param initialState Optional partial state to merge with DEFAULT_STATE.
 * @return The cropper state, dispatch, convenience setters, and utilities.
 */
export function useCropperState(
	initialState?: Partial< CropperState >
): UseCropperStateReturn {
	const [ state, dispatch ] = useReducer(
		cropperReducer,
		initialState,
		( init ) => ( { ...DEFAULT_STATE, ...init } )
	);

	const initialRef = useRef< CropperState >( {
		...DEFAULT_STATE,
		...initialState,
	} );

	const setCrop = useCallback(
		( crop: NormalizedPoint ) => {
			dispatch( { type: 'SET_CROP', payload: crop } );
		},
		[ dispatch ]
	);

	const setZoom = useCallback(
		( zoom: number ) => {
			dispatch( { type: 'SET_ZOOM', payload: zoom } );
		},
		[ dispatch ]
	);

	const setRotation = useCallback(
		( rotation: number ) => {
			dispatch( { type: 'SET_ROTATION', payload: rotation } );
		},
		[ dispatch ]
	);

	const setFlip = useCallback(
		( flip: Flip ) => {
			dispatch( { type: 'SET_FLIP', payload: flip } );
		},
		[ dispatch ]
	);

	const setCropRect = useCallback(
		( rect: NormalizedRect ) => {
			dispatch( { type: 'SET_CROP_RECT', payload: rect } );
		},
		[ dispatch ]
	);

	const applyOperation = useCallback(
		( op: TransformOperation ) => {
			dispatch( { type: 'APPLY_OPERATION', payload: op } );
		},
		[ dispatch ]
	);

	const reset = useCallback(
		( resetState?: Partial< CropperState > ) => {
			dispatch( { type: 'RESET', payload: resetState } );
			if ( ! resetState ) {
				initialRef.current = { ...DEFAULT_STATE };
			} else {
				initialRef.current = { ...DEFAULT_STATE, ...resetState };
			}
		},
		[ dispatch ]
	);

	const isDirty = isStateDirty( state, initialRef.current );

	const getCroppedImage = useCallback(
		( mimeType?: string, quality?: number ) => {
			if ( ! state.image ) {
				return Promise.resolve( null );
			}
			return exportCroppedImage(
				state.image.src,
				state,
				mimeType,
				quality
			);
		},
		[ state ]
	);

	return {
		state,
		dispatch,
		setCrop,
		setZoom,
		setRotation,
		setFlip,
		setCropRect,
		applyOperation,
		reset,
		isDirty,
		getCroppedImage,
	};
}
