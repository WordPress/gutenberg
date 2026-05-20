/**
 * WordPress dependencies
 */
import {
	useReducer,
	useCallback,
	useEffect,
	useRef,
	useState,
} from '@wordpress/element';

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
	Size,
} from '../../core/types';
import { DEFAULT_STATE } from '../../core/constants';
import { exportCroppedImage } from '../../core/export/canvas-renderer';
import {
	cropperReducer,
	enforceContainment,
	isStateDirty,
} from '../../core/state';
import { buildFocalPointZoomAction } from '../../core/setter-helpers';

/**
 * The cropper controller surface — the contract the Cropper component
 * and its interaction hooks consume.
 *
 * History (undo / redo / commitHistory) is intentionally NOT part of
 * this interface. The cropper is a pure state machine; history is a
 * higher-layer concern owned by a composite store
 * (see media-editor/src/state).
 */
export interface CropperController {
	/** The current cropper state (read-only). */
	state: CropperState;
	/** Set the loaded image (natural size and src). */
	setImage: ( image: CropperState[ 'image' ] ) => void;
	/**
	 * Set the image pan offset in normalized coordinates. Use
	 * `setCropRect` for the crop rectangle.
	 */
	setPan: ( pan: NormalizedPoint ) => void;
	/**
	 * Set the zoom level, anchored at the crop center. Clamped to the
	 * coverage-aware minimum and maximum zoom.
	 */
	setZoom: ( zoom: number ) => void;
	/** Set zoom and pan together so focal-point zoom remains atomic. */
	setZoomAtPoint: ( zoom: number, pan: NormalizedPoint ) => void;
	/** Set the rotation in degrees. Normalized to [0, 360). */
	setRotation: ( rotation: number ) => void;
	/** Set the flip state. */
	setFlip: ( flip: Flip ) => void;
	/** Toggle flip on the given axis. */
	toggleFlip: ( direction: 'horizontal' | 'vertical' ) => void;
	/** Snap rotate 90° preserving the image selection. */
	snapRotate90: ( direction: 1 | -1 ) => void;
	/** Set the crop rectangle in normalized coordinates. */
	setCropRect: ( rect: NormalizedRect ) => void;
	/**
	 * Settle the crop rect after a resize drag: expand to fill the
	 * available visual area while preserving the framed image region.
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
	 * `exportCroppedImage` for error semantics.
	 */
	getCroppedImage: ( mimeType?: string, quality?: number ) => Promise< Blob >;
	/**
	 * Report the current rendered image size to the controller. The
	 * Cropper component calls this on visualSize changes; composite
	 * controllers use it to compute aspect-ratio reshapes. The pure
	 * cropper hook ignores it (no-op).
	 */
	setVisualSize: ( size: Size ) => void;
	/**
	 * Adjust the cropRect in response to a viewport change (window
	 * resize, canvas resize). Behaves like `setCropRect` but, in
	 * composite controllers, does NOT record an undo entry — viewport
	 * reshapes aren't editor actions. The pure cropper hook aliases
	 * this to `setCropRect` (history is a composite concern).
	 */
	adjustCropRectForViewport: ( rect: NormalizedRect ) => void;
}

function areCropperImagesEqual(
	a: CropperState[ 'image' ],
	b: CropperState[ 'image' ]
): boolean {
	return (
		a?.src === b?.src &&
		a?.naturalWidth === b?.naturalWidth &&
		a?.naturalHeight === b?.naturalHeight
	);
}

/**
 * Pure reducer hook for the image cropper.
 *
 * Wraps the framework-agnostic `cropperReducer` and exposes named
 * setters. Does NOT manage undo/redo history — that responsibility
 * belongs to the surrounding application (see
 * `useMediaEditorState` for the composite store used by the media
 * editor).
 *
 * @param initialState Optional partial state to merge with DEFAULT_STATE.
 * @return The cropper controller — state, setters, and helpers.
 */
export function useCropperReducer(
	initialState?: Partial< CropperState >
): CropperController {
	const [ state, dispatch ] = useReducer(
		cropperReducer,
		initialState,
		( init ) => enforceContainment( { ...DEFAULT_STATE, ...init } )
	);

	// The "clean" snapshot the current state is compared against for
	// `isDirty`. Stored in state (not a ref) so the comparison reads
	// a value, not a ref's `current`. `setImage` and `reset` refresh
	// this when the consumer establishes a new baseline.
	const [ initialBaseline, setInitialBaseline ] = useState< CropperState >(
		() => enforceContainment( { ...DEFAULT_STATE, ...initialState } )
	);
	// Keep a ref to the latest state so stable-identity callbacks
	// (reset, setImage, focal-point setZoom) can read fresh state
	// without re-creating themselves on every render. The dispatch
	// wrapper updates it synchronously so multiple actions in one event
	// see the latest reducer output before React commits.
	const stateRef = useRef( state );
	useEffect( () => {
		stateRef.current = state;
	}, [ state ] );

	const dispatchAndSync = useCallback( ( action: CropperAction ) => {
		const next = cropperReducer( stateRef.current, action );
		stateRef.current = next;
		dispatch( action );
		return next;
	}, [] );

	const setImage = useCallback(
		( image: CropperState[ 'image' ] ) => {
			if ( areCropperImagesEqual( stateRef.current.image, image ) ) {
				return;
			}
			const next = dispatchAndSync( {
				type: 'SET_IMAGE',
				payload: image,
			} );
			// Refresh the "clean" snapshot to match the post-load state
			// produced by the reducer. Otherwise containment can nudge
			// pan/zoom by tiny amounts on load and `isDirty` would
			// report true from the start.
			setInitialBaseline( next );
		},
		[ dispatchAndSync ]
	);

	const setPan = useCallback(
		( pan: NormalizedPoint ) => {
			dispatchAndSync( { type: 'SET_PAN', payload: pan } );
		},
		[ dispatchAndSync ]
	);

	const setZoom = useCallback(
		( zoom: number ) => {
			const action = buildFocalPointZoomAction( stateRef.current, zoom );
			if ( action ) {
				dispatchAndSync( action );
			}
		},
		[ dispatchAndSync ]
	);

	const setZoomAtPoint = useCallback(
		( zoom: number, pan: NormalizedPoint ) => {
			dispatchAndSync( {
				type: 'SET_ZOOM_AT_POINT',
				payload: { zoom, pan },
			} );
		},
		[ dispatchAndSync ]
	);

	const setRotation = useCallback(
		( rotation: number ) => {
			dispatchAndSync( { type: 'SET_ROTATION', payload: rotation } );
		},
		[ dispatchAndSync ]
	);

	const setFlip = useCallback(
		( flip: Flip ) => {
			dispatchAndSync( { type: 'SET_FLIP', payload: flip } );
		},
		[ dispatchAndSync ]
	);

	const toggleFlip = useCallback(
		( direction: 'horizontal' | 'vertical' ) => {
			setFlip( {
				...stateRef.current.flip,
				[ direction ]: ! stateRef.current.flip[ direction ],
			} );
		},
		[ setFlip ]
	);

	const snapRotate90 = useCallback(
		( direction: 1 | -1 ) => {
			dispatchAndSync( {
				type: 'SNAP_ROTATE_90',
				payload: { direction },
			} );
		},
		[ dispatchAndSync ]
	);

	const setCropRect = useCallback(
		( rect: NormalizedRect ) => {
			dispatchAndSync( { type: 'SET_CROP_RECT', payload: rect } );
		},
		[ dispatchAndSync ]
	);

	const settleCrop = useCallback( () => {
		dispatchAndSync( { type: 'SETTLE_CROP' } );
	}, [ dispatchAndSync ] );

	const applyOperation = useCallback(
		( op: TransformOperation ) => {
			dispatchAndSync( { type: 'APPLY_OPERATION', payload: op } );
		},
		[ dispatchAndSync ]
	);

	const reset = useCallback(
		( resetState?: Partial< CropperState > ) => {
			const nextInitialState = dispatchAndSync( {
				type: 'RESET',
				payload: resetState,
			} );
			// Mirror the reducer's RESET exactly so isDirty stays in
			// sync. The containment step can tweak pan/zoom/cropRect by
			// float ulp; fold those into the "initial" snapshot or
			// isDirty would report true after a reset.
			setInitialBaseline( nextInitialState );
		},
		[ dispatchAndSync ]
	);

	const isDirty = isStateDirty( state, initialBaseline );

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

	// No-op for the pure hook — visualSize matters only when a
	// composite store needs to compute aspect-ratio reshapes
	// (see useMediaEditorState). Typed to accept a Size so it
	// satisfies the controller surface; the value is intentionally
	// ignored.
	const setVisualSize = useCallback( () => {}, [] );

	// In the pure hook, history isn't a concern — viewport-driven
	// reshape is identical to setCropRect.
	const adjustCropRectForViewport = setCropRect;

	const controller: CropperController = {
		state,
		setImage,
		setPan,
		setZoom,
		setZoomAtPoint,
		setRotation,
		setFlip,
		toggleFlip,
		snapRotate90,
		setCropRect,
		settleCrop,
		applyOperation,
		reset,
		isDirty,
		getCroppedImage,
		setVisualSize,
		adjustCropRectForViewport,
	};
	return controller;
}
