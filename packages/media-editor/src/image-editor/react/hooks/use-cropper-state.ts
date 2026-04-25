/**
 * WordPress dependencies
 */
import { useReducer, useCallback, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type {
	CropperState,
	TransformOperation,
	NormalizedPoint,
	NormalizedRect,
	Flip,
} from '../../core/types';
import { DEFAULT_STATE } from '../../core/constants';
import { exportCroppedImage } from '../../core/export/canvas-renderer';
import {
	cropperReducer,
	enforceContainment,
	isStateDirty,
} from '../../core/state';

/**
 * The return type of the useCropperState hook.
 *
 * The hook exposes its state through named setter methods rather
 * than a raw dispatch function. Each setter has a specific
 * behavioral contract (see individual JSDoc) that maps 1:1 to a
 * reducer action internally. Keeping the reducer actions private
 * lets the implementation evolve without breaking consumers.
 */
export interface UseCropperStateReturn {
	/** The current cropper state (read-only). */
	state: CropperState;
	/** Set the loaded image (natural size and src). */
	setImage: ( image: CropperState[ 'image' ] ) => void;
	/**
	 * Set the image pan offset in normalized coordinates. Use
	 * `setCropRect` for the crop rectangle.
	 */
	setPan: ( pan: NormalizedPoint ) => void;
	/** Set the zoom level. Clamped to [1, 10]. */
	setZoom: ( zoom: number ) => void;
	/** Set zoom and pan together so focal-point zoom remains atomic. */
	setZoomAtPoint: ( zoom: number, pan: NormalizedPoint ) => void;
	/** Set the rotation in degrees. Normalized to [0, 360). */
	setRotation: ( rotation: number ) => void;
	/** Set the flip state. */
	setFlip: ( flip: Flip ) => void;
	/** Snap rotate 90° preserving the image selection (Google Photos style). */
	snapRotate90: ( direction: 1 | -1 ) => void;
	/** Set the crop rectangle in normalized coordinates. */
	setCropRect: ( rect: NormalizedRect ) => void;
	/**
	 * Settle the crop rect after a resize drag: expand to fill the
	 * available visual area while preserving the framed image region.
	 * Typically called from a stencil's `onResizeEnd` callback.
	 */
	settleCrop: () => void;
	/** Apply a transform operation through the pipeline. */
	applyOperation: ( op: TransformOperation ) => void;
	/** Reset the state. Optionally merge partial state overrides. */
	reset: ( resetState?: Partial< CropperState > ) => void;
	/** Whether the current state differs from the initial state. */
	isDirty: boolean;
	/**
	 * Export the cropped image as a Blob. Throws on failure — see
	 * `exportCroppedImage` in core for the error semantics (image
	 * load errors, CORS taint, missing canvas context). Wrap in
	 * try/catch if you need to recover.
	 */
	getCroppedImage: ( mimeType?: string, quality?: number ) => Promise< Blob >;
}

/**
 * Reducer-based state management hook for the image editor.
 *
 * Provides the full cropper state and named setter methods for
 * every supported transition. The reducer and containment logic
 * live in core/state.ts (framework-agnostic); this hook is a thin
 * React wrapper around that pure reducer, with memoized callbacks.
 *
 * @param initialState Optional partial state to merge with DEFAULT_STATE.
 * @return The cropper state, setters, and utilities.
 */
export function useCropperState(
	initialState?: Partial< CropperState >
): UseCropperStateReturn {
	const [ state, dispatch ] = useReducer(
		cropperReducer,
		initialState,
		( init ) => enforceContainment( { ...DEFAULT_STATE, ...init } )
	);

	const initialRef = useRef< CropperState >(
		enforceContainment( { ...DEFAULT_STATE, ...initialState } )
	);
	// Keep a ref to the latest state so callbacks with stable identity
	// (reset, setImage) can read fresh state without re-creating themselves.
	const stateRef = useRef( state );
	stateRef.current = state;

	const setImage = useCallback(
		( image: CropperState[ 'image' ] ) => {
			dispatch( { type: 'SET_IMAGE', payload: image } );
			// Refresh the "clean" snapshot to match the post-load state
			// produced by the reducer. Otherwise containment can nudge
			// pan/zoom by tiny amounts on load and `isDirty` would
			// report true from the start.
			initialRef.current = enforceContainment( {
				...initialRef.current,
				image,
			} );
		},
		[ dispatch ]
	);

	const setPan = useCallback(
		( pan: NormalizedPoint ) => {
			dispatch( { type: 'SET_PAN', payload: pan } );
		},
		[ dispatch ]
	);

	const setZoom = useCallback(
		( zoom: number ) => {
			dispatch( { type: 'SET_ZOOM', payload: zoom } );
		},
		[ dispatch ]
	);

	const setZoomAtPoint = useCallback(
		( zoom: number, pan: NormalizedPoint ) => {
			dispatch( {
				type: 'SET_ZOOM_AT_POINT',
				payload: { zoom, pan },
			} );
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

	const snapRotate90 = useCallback(
		( direction: 1 | -1 ) => {
			dispatch( {
				type: 'SNAP_ROTATE_90',
				payload: { direction },
			} );
		},
		[ dispatch ]
	);

	const setCropRect = useCallback(
		( rect: NormalizedRect ) => {
			dispatch( { type: 'SET_CROP_RECT', payload: rect } );
		},
		[ dispatch ]
	);

	const settleCrop = useCallback( () => {
		dispatch( { type: 'SETTLE_CROP' } );
	}, [ dispatch ] );

	const applyOperation = useCallback(
		( op: TransformOperation ) => {
			dispatch( { type: 'APPLY_OPERATION', payload: op } );
		},
		[ dispatch ]
	);

	const reset = useCallback(
		( resetState?: Partial< CropperState > ) => {
			dispatch( { type: 'RESET', payload: resetState } );
			// Mirror the reducer's RESET exactly so isDirty stays in
			// sync. RESET preserves the currently-loaded image; the
			// containment step can tweak pan/zoom/cropRect by float ulp,
			// which we must fold into the "initial" snapshot or isDirty
			// would report true after a reset.
			initialRef.current = enforceContainment( {
				...DEFAULT_STATE,
				image: stateRef.current.image,
				...resetState,
			} );
		},
		[ dispatch ]
	);

	const isDirty = isStateDirty( state, initialRef.current );

	const getCroppedImage = useCallback(
		( mimeType?: string, quality?: number ): Promise< Blob > => {
			if ( ! state.image ) {
				return Promise.reject(
					new Error( 'No image loaded — call setImage first.' )
				);
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

	const controller: UseCropperStateReturn = {
		state,
		setImage,
		setPan,
		setZoom,
		setZoomAtPoint,
		setRotation,
		setFlip,
		snapRotate90,
		setCropRect,
		settleCrop,
		applyOperation,
		reset,
		isDirty,
		getCroppedImage,
	};
	return controller;
}
