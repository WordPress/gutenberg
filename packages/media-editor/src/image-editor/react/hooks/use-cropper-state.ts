/**
 * WordPress dependencies
 */
import {
	useReducer,
	useCallback,
	useRef,
	useState,
	useEffect,
} from '@wordpress/element';

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
import { DEFAULT_STATE, MAX_ZOOM } from '../../core/constants';
import { exportCroppedImage } from '../../core/export/canvas-renderer';
import { getMinZoom, restrictPanZoom } from '../../core/containment';
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
	/**
	 * Set the zoom level, anchored at the crop center. Clamped to the
	 * coverage-aware minimum and maximum zoom.
	 *
	 * Pointer-driven zoom (wheel, pinch, double-tap) anchors at the
	 * cursor via `setZoomAtPoint`. Cursorless surfaces — the slider, the
	 * `+`/`-` keys, programmatic toolbar buttons — have no natural
	 * focal point, so they default to the crop center. Otherwise
	 * `enforceContainment` would translate the image whichever way is
	 * shortest, which snaps the framed content toward the nearest
	 * viewport corner when zooming out from an off-center position.
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
	/** Snap rotate 90° preserving the image selection (Google Photos style). */
	snapRotate90: ( direction: 1 | -1 ) => void;
	/** Set the crop rectangle in normalized coordinates. */
	setCropRect: ( rect: NormalizedRect ) => void;
	/**
	 * Settle the crop rect after a resize drag: expand to fill the
	 * available visual area while preserving the framed image region.
	 * Typically called from a stencil's `onResizeEnd` callback.
	 *
	 * Flushes the pending resize history before dispatching, then suppresses
	 * the settle dispatch itself so resizing and settling undo as one step.
	 */
	settleCrop: () => void;
	/** Apply a transform operation through the pipeline. */
	applyOperation: ( op: TransformOperation ) => void;
	/** Reset the state. Optionally merge partial state overrides. */
	reset: ( resetState?: Partial< CropperState > ) => void;
	/** Whether the current state differs from the initial state. */
	isDirty: boolean;
	/** Whether there is a cropper state to undo. */
	hasUndo: boolean;
	/** Whether there is a cropper state to redo. */
	hasRedo: boolean;
	/** Undo the last committed cropper operation. */
	undo: () => void;
	/** Redo the last undone cropper operation. */
	redo: () => void;
	/**
	 * Flush the pending history entry immediately, bypassing the debounce
	 * timer. Useful in two situations:
	 *
	 * - **Pointer-up / key-up**: commit as soon as the user releases so the
	 *   undo button lights up without waiting for the debounce window.
	 * - **Gesture start**: pass to `onGestureStart` on the `Cropper` so any
	 *   pending sidebar interaction is committed before a new canvas gesture
	 *   begins, keeping the two interactions as separate undo steps.
	 */
	commitHistory: () => void;
	/**
	 * Export the cropped image as a Blob. Throws on failure — see
	 * `exportCroppedImage` in core for the error semantics (image
	 * load errors, CORS taint, missing canvas context). Wrap in
	 * try/catch if you need to recover.
	 */
	getCroppedImage: ( mimeType?: string, quality?: number ) => Promise< Blob >;
}

/** Milliseconds of inactivity after which a continuous interaction is committed to history. */
const HISTORY_DEBOUNCE_MS = 300;

/** Small tolerance for cropper floating-point comparisons. */
const HISTORY_EPSILON = 1e-6;

function nearlyEqual( a: number, b: number ): boolean {
	return Math.abs( a - b ) < HISTORY_EPSILON;
}

function areHistoryStatesEqual( a: CropperState, b: CropperState ): boolean {
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

/**
 * Reducer-based state management hook for the image editor.
 *
 * Provides the full cropper state and named setter methods for
 * every supported transition. The reducer and containment logic
 * live in core/state.ts (framework-agnostic); this hook is a thin
 * React wrapper around that pure reducer, with memoized callbacks.
 *
 * History is recorded via a state-change debounce: any state change
 * starts a 300 ms timer; when it fires the pre-change state is pushed
 * onto the undo stack. `commitHistory` flushes the timer immediately
 * (useful on pointer-up / key-up for a crisp commit feel).
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

	// History stack for undo/redo. Using refs for the arrays avoids
	// unnecessary re-renders on every push; a pair of boolean state values
	// drives the enabled/disabled state of the undo/redo buttons.
	const historyRef = useRef< CropperState[] >( [] );
	const redoStackRef = useRef< CropperState[] >( [] );
	const [ hasUndo, setHasUndo ] = useState( false );
	const [ hasRedo, setHasRedo ] = useState( false );

	// Debounce-based history: tracks the last committed state and a pending
	// timer. Any state change resets the timer; when it expires the
	// pre-change state is pushed to history.
	const lastCommittedStateRef = useRef< CropperState | null >( state );
	const debounceTimerRef = useRef< ReturnType< typeof setTimeout > >();
	// Set to true before dispatching actions that must not produce a debounce
	// history entry (undo, redo, reset, setImage, discrete actions).
	const suppressDebounceRef = useRef( false );

	// Pushes `entry` (defaults to current state) onto the undo stack and
	// clears the redo stack. Skips if `entry` is already the last item,
	// so rapid discrete actions on unchanged state don't create duplicates.
	const pushToHistory = useCallback( ( entry?: CropperState ) => {
		const target = entry ?? stateRef.current;
		const previousEntry =
			historyRef.current[ historyRef.current.length - 1 ];
		if ( previousEntry && areHistoryStatesEqual( previousEntry, target ) ) {
			return;
		}
		historyRef.current = [ ...historyRef.current, target ];
		redoStackRef.current = [];
		setHasUndo( true );
		setHasRedo( false );
	}, [] );

	// Watch state and debounce history commits. Any dispatch resets the
	// timer; once the state has settled for HISTORY_DEBOUNCE_MS the
	// pre-change snapshot is pushed to the undo stack.
	useEffect( () => {
		// Suppress flag: undo/redo/reset/setImage/discrete actions set this
		// to opt out of the debounce for their own state changes.
		if ( suppressDebounceRef.current ) {
			suppressDebounceRef.current = false;
			lastCommittedStateRef.current = stateRef.current;
			return;
		}
		if (
			lastCommittedStateRef.current !== null &&
			areHistoryStatesEqual(
				lastCommittedStateRef.current,
				stateRef.current
			)
		) {
			lastCommittedStateRef.current = stateRef.current;
			return;
		}
		clearTimeout( debounceTimerRef.current );
		debounceTimerRef.current = setTimeout( () => {
			const snapshot = lastCommittedStateRef.current;
			if (
				snapshot !== null &&
				! areHistoryStatesEqual( snapshot, stateRef.current )
			) {
				pushToHistory( snapshot );
			}
			lastCommittedStateRef.current = stateRef.current;
		}, HISTORY_DEBOUNCE_MS );
		return () => clearTimeout( debounceTimerRef.current );
	}, [ state, pushToHistory ] );

	// Flush the pending debounce immediately: cancel the timer and push the
	// pre-change snapshot if the state has actually changed. Used by
	// pointer-up / key-up handlers for an instant commit feel, and by
	// undo/redo/discrete actions before recording their own history entry.
	const commitHistory = useCallback( () => {
		clearTimeout( debounceTimerRef.current );
		const snapshot = lastCommittedStateRef.current;
		if (
			snapshot !== null &&
			! areHistoryStatesEqual( snapshot, stateRef.current )
		) {
			pushToHistory( snapshot );
		}
		lastCommittedStateRef.current = stateRef.current;
	}, [ pushToHistory ] );

	const undo = useCallback( () => {
		// Flush any pending gesture so it becomes a distinct undo step
		// before we pop history. This ensures mid-gesture undo undoes the
		// pending change rather than silently discarding it.
		commitHistory();
		const prev = historyRef.current[ historyRef.current.length - 1 ];
		if ( ! prev ) {
			return;
		}
		redoStackRef.current = [ stateRef.current, ...redoStackRef.current ];
		historyRef.current = historyRef.current.slice( 0, -1 );
		suppressDebounceRef.current = true;
		setHasUndo( historyRef.current.length > 0 );
		setHasRedo( true );
		dispatch( { type: 'RESET', payload: prev } );
	}, [ dispatch, commitHistory ] );

	const redo = useCallback( () => {
		// Flush any pending gesture before redoing so the in-flight change
		// is saved and the redo target lands on top of it.
		commitHistory();
		const next = redoStackRef.current[ 0 ];
		if ( ! next ) {
			return;
		}
		historyRef.current = [ ...historyRef.current, stateRef.current ];
		redoStackRef.current = redoStackRef.current.slice( 1 );
		suppressDebounceRef.current = true;
		setHasUndo( true );
		setHasRedo( redoStackRef.current.length > 0 );
		dispatch( { type: 'RESET', payload: next } );
	}, [ dispatch, commitHistory ] );

	const setImage = useCallback(
		( image: CropperState[ 'image' ] ) => {
			clearTimeout( debounceTimerRef.current );
			suppressDebounceRef.current = true;
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
			const s = stateRef.current;
			const clampedZoom = Math.min(
				MAX_ZOOM,
				Math.max( getMinZoom( s ), zoom )
			);
			if ( clampedZoom === s.zoom ) {
				return;
			}
			// Crop center expressed in the same coord system as `state.pan`:
			// container-center-relative, normalized by image rendered size.
			// `cropRect` is image-top-left-origin (0–1), so subtract 0.5
			// to recenter.
			const { cropRect } = s;
			const focalNormX = cropRect.x + cropRect.width / 2 - 0.5;
			const focalNormY = cropRect.y + cropRect.height / 2 - 0.5;
			const zoomRatio = 1 - clampedZoom / s.zoom;
			const newPanX = s.pan.x + ( focalNormX - s.pan.x ) * zoomRatio;
			const newPanY = s.pan.y + ( focalNormY - s.pan.y ) * zoomRatio;
			const imageSize = s.image
				? {
						width: s.image.naturalWidth,
						height: s.image.naturalHeight,
				  }
				: { width: 1, height: 1 };
			const { pan: clampedPan } = restrictPanZoom(
				{
					...s,
					zoom: clampedZoom,
					pan: { x: newPanX, y: newPanY },
				},
				imageSize,
				s.cropRect
			);
			dispatch( {
				type: 'SET_ZOOM_AT_POINT',
				payload: { zoom: clampedZoom, pan: clampedPan },
			} );
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
			commitHistory(); // flush any pending continuous gesture first
			pushToHistory(); // record current state as the undo point
			suppressDebounceRef.current = true;
			dispatch( { type: 'SET_FLIP', payload: flip } );
		},
		[ dispatch, pushToHistory, commitHistory ]
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
			commitHistory();
			pushToHistory();
			suppressDebounceRef.current = true;
			dispatch( {
				type: 'SNAP_ROTATE_90',
				payload: { direction },
			} );
		},
		[ dispatch, pushToHistory, commitHistory ]
	);

	const setCropRect = useCallback(
		( rect: NormalizedRect ) => {
			dispatch( { type: 'SET_CROP_RECT', payload: rect } );
		},
		[ dispatch ]
	);

	const settleCrop = useCallback( () => {
		commitHistory();
		suppressDebounceRef.current = true;
		dispatch( { type: 'SETTLE_CROP' } );
	}, [ dispatch, commitHistory ] );

	const applyOperation = useCallback(
		( op: TransformOperation ) => {
			commitHistory();
			pushToHistory();
			suppressDebounceRef.current = true;
			dispatch( { type: 'APPLY_OPERATION', payload: op } );
		},
		[ dispatch, pushToHistory, commitHistory ]
	);

	const reset = useCallback(
		( resetState?: Partial< CropperState > ) => {
			commitHistory();
			const nextInitialState = enforceContainment( {
				...DEFAULT_STATE,
				image: stateRef.current.image,
				...resetState,
			} );
			if (
				! areHistoryStatesEqual( stateRef.current, nextInitialState )
			) {
				pushToHistory();
			}
			suppressDebounceRef.current = true;
			dispatch( { type: 'RESET', payload: resetState } );
			// Mirror the reducer's RESET exactly so isDirty stays in
			// sync. RESET preserves the currently-loaded image; the
			// containment step can tweak pan/zoom/cropRect by float ulp,
			// which we must fold into the "initial" snapshot or isDirty
			// would report true after a reset.
			initialRef.current = nextInitialState;
		},
		[ dispatch, pushToHistory, commitHistory ]
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
		toggleFlip,
		snapRotate90,
		setCropRect,
		settleCrop,
		applyOperation,
		reset,
		isDirty,
		getCroppedImage,
		hasUndo,
		hasRedo,
		undo,
		redo,
		commitHistory,
	};
	return controller;
}
