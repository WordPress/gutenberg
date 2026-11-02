import {
	useCallback,
	useMemo,
	useReducer,
	useRef,
	useState,
} from '@wordpress/element';
import {
	DEFAULT_STATE,
	enforceContainment,
	isStateDirty,
	exportCroppedImage,
	type CropperAction,
	type CropperControllerState,
	type NormalizedRect,
	type Size,
} from '../core';
import { buildCropperSetters, type CropperController } from '../react/hooks';
import {
	cropSessionReducer,
	areCropSessionStatesEqual,
	buildInitialCropSessionState,
} from './reducer';
import { resolveAspectRatio } from './resolve-aspect-ratio';
import type { CropOptions, CropSessionAction, CropSessionState } from './types';

function areCropperImagesEqual(
	a: CropperControllerState[ 'image' ],
	b: CropperControllerState[ 'image' ]
): boolean {
	return (
		a?.src === b?.src &&
		a?.naturalWidth === b?.naturalWidth &&
		a?.naturalHeight === b?.naturalHeight
	);
}

/**
 * Options for `useCropSession`. Leave them out for a session that holds
 * only the cropper state and crop options.
 *
 * To hold more state in the same undo history, pass all three, defined
 * outside the component so they keep their identity between renders.
 */
export interface CropSessionOptions< S extends CropSessionState, A > {
	/**
	 * Reducer for the full state. Handle your own actions and pass the
	 * rest to `cropSessionReducer`.
	 */
	reducer: ( state: S, action: A | CropSessionAction< S > ) => S;
	/** Value equality for the full state, used to skip no-op snapshots. */
	areStatesEqual: ( a: S, b: S ) => boolean;
	/** Builds the state a session starts from, given its cropper state. */
	createInitialState: ( cropper: CropperControllerState ) => S;
}

/**
 * A crop session: what is being edited, the shared undo/redo history,
 * and gesture boundaries.
 */
export interface CropSession<
	S extends CropSessionState = CropSessionState,
	A = never,
> {
	/** The full session state. */
	state: S;
	/**
	 * Apply one of your own actions (see `CropSessionOptions.reducer`).
	 * Recorded in the undo history like any other change.
	 */
	dispatch: ( action: A ) => void;
	/**
	 * Geometry controller for a `<Cropper>`. Its setters record history
	 * in the session; its `isDirty` covers geometry only. Its `setImage`
	 * is `setSourceImage`, so the `<Cropper>` reporting a newly loaded
	 * image starts a fresh session.
	 */
	cropper: CropperController;
	/** The crop options. */
	cropOptions: CropOptions;
	/** Set the aspect-ratio preset and reshape the crop in one step. */
	setAspectRatioValue: ( presetKey: string ) => void;
	/**
	 * Put the state back to its starting point in one undo entry,
	 * keeping the image.
	 */
	reset: () => void;
	/**
	 * Replace the image being edited. A different image starts a fresh
	 * session: the initial state, a clean baseline, and no history.
	 * Reporting the same image again is a no-op.
	 */
	setSourceImage: ( image: CropperControllerState[ 'image' ] ) => void;
	/**
	 * Whether anything in the session differs from its baseline,
	 * including state that does not change the image, such as the
	 * aspect-ratio preset.
	 */
	isDirty: boolean;
	/** Whether there's an undoable change in history. */
	hasUndo: boolean;
	/** Whether there's a redoable change in history. */
	hasRedo: boolean;
	/** Undo the last committed change. */
	undo: () => void;
	/** Redo the last undone change. */
	redo: () => void;
	/**
	 * Open a gesture boundary. During a gesture all changes coalesce into
	 * one undo entry: the snapshot taken at `beginGesture`. Pair with
	 * `endGesture` on pointer-up / key-up.
	 */
	beginGesture: () => void;
	/** Close a gesture boundary and commit the pre-gesture snapshot. */
	endGesture: () => void;
}

const DEFAULT_OPTIONS = {
	reducer: cropSessionReducer,
	areStatesEqual: areCropSessionStatesEqual,
	createInitialState: buildInitialCropSessionState,
};

/**
 * A crop session with undo and redo.
 *
 * Cropper state, crop options and any state added through `options`
 * go through one reducer and one history stack.
 *
 * History:
 * - Each change pushes its pre-state to the undo stack, unless a gesture
 *   is open or the change is a no-op (post-state equal to pre-state).
 * - During a gesture (`beginGesture` → `endGesture`) changes coalesce:
 *   only the pre-gesture snapshot is pushed, at gesture end. Undo and
 *   redo close an open gesture first.
 * - Viewport-driven cropRect reshapes (window resize) are never
 *   recorded.
 *
 * The session starts empty. Call `setSourceImage`, or let the
 * `<Cropper>` call it on load.
 *
 * @param options Reducer, equality and initial state for a wider state.
 * @return The crop session.
 */
export function useCropSession<
	S extends CropSessionState = CropSessionState,
	A = never,
>( options?: CropSessionOptions< S, A > ): CropSession< S, A > {
	const { reducer, areStatesEqual, createInitialState } = ( options ??
		DEFAULT_OPTIONS ) as unknown as CropSessionOptions< S, A >;

	const [ state, dispatch ] = useReducer( reducer, null, () =>
		createInitialState( { ...DEFAULT_STATE } )
	);

	// The "clean" snapshot the current state is compared against for
	// `isDirty`. Stored in state (not a ref) so the comparison reads a
	// value, not a ref's `current`. `setSourceImage` refreshes this when
	// a new image establishes a fresh baseline.
	const [ initialBaseline, setInitialBaseline ] = useState< S >(
		() => state
	);

	// Latest-state ref used by setters that need to read fresh state
	// (focal-point zoom, dispatch wrapper). Every mutation path
	// (`dispatchWithHistory`, `setSourceImage`, `undo`, `redo`) writes
	// this synchronously, so multiple actions in one event see the
	// latest reducer output before React commits.
	const stateRef = useRef( state );
	const visualSizeRef = useRef< Size >( { width: 0, height: 0 } );

	// History stacks: full snapshots. Refs avoid re-renders on every
	// push; a boolean state pair drives the undo/redo indicators.
	const historyRef = useRef< S[] >( [] );
	const redoStackRef = useRef< S[] >( [] );
	const [ hasUndo, setHasUndo ] = useState( false );
	const [ hasRedo, setHasRedo ] = useState( false );

	// Gesture state. While open, the first non-no-op action captures
	// the pre-gesture snapshot; later actions don't push. `endGesture`
	// pushes the captured snapshot (or nothing, if the gesture produced
	// no changes).
	const isGestureOpenRef = useRef( false );
	const gestureSnapshotRef = useRef< S | null >( null );

	const pushSnapshot = useCallback(
		( snapshot: S ) => {
			const last = historyRef.current[ historyRef.current.length - 1 ];
			if ( last && areStatesEqual( last, snapshot ) ) {
				return;
			}
			historyRef.current = [ ...historyRef.current, snapshot ];
			redoStackRef.current = [];
			setHasUndo( true );
			setHasRedo( false );
		},
		[ areStatesEqual ]
	);

	// Core dispatch wrapper. Computes the post-state with the pure
	// reducer so no-op actions skip history, and keeps `stateRef` in
	// step with React's pending state.
	const dispatchWithHistory = useCallback(
		( action: A | CropSessionAction< S >, recordHistory = true ) => {
			const preState = stateRef.current;
			const postState = reducer( preState, action );
			if ( recordHistory && ! areStatesEqual( preState, postState ) ) {
				if ( isGestureOpenRef.current ) {
					if ( gestureSnapshotRef.current === null ) {
						gestureSnapshotRef.current = preState;
					}
				} else {
					pushSnapshot( preState );
				}
			}
			stateRef.current = postState;
			dispatch( action );
		},
		[ reducer, areStatesEqual, pushSnapshot ]
	);

	const beginGesture = useCallback( () => {
		if ( isGestureOpenRef.current ) {
			return;
		}
		isGestureOpenRef.current = true;
		gestureSnapshotRef.current = null;
	}, [] );

	// Close a gesture (or flush a pending one before undo/redo). Pushes
	// the pre-gesture snapshot only if it differs from current state.
	// Safe to call when no gesture is open.
	const endGesture = useCallback( () => {
		const snapshot = gestureSnapshotRef.current;
		if ( snapshot && ! areStatesEqual( snapshot, stateRef.current ) ) {
			pushSnapshot( snapshot );
		}
		gestureSnapshotRef.current = null;
		isGestureOpenRef.current = false;
	}, [ areStatesEqual, pushSnapshot ] );

	const dispatchCropperAction = useCallback(
		( action: CropperAction ) => {
			dispatchWithHistory( { type: 'CROPPER', action } );
		},
		[ dispatchWithHistory ]
	);

	const cropperSetters = useMemo(
		() =>
			buildCropperSetters(
				dispatchCropperAction,
				() => stateRef.current.cropper,
				() => visualSizeRef.current
			),
		[ dispatchCropperAction ]
	);

	const setSourceImage = useCallback(
		( image: CropperControllerState[ 'image' ] ) => {
			if (
				areCropperImagesEqual( stateRef.current.cropper.image, image )
			) {
				return;
			}
			// New image = fresh session: initial state, a clean baseline,
			// and no history. Built from defaults rather than dispatching
			// SET_IMAGE, which keeps the current pan / zoom / rotation /
			// flip / cropRect: edits made against one image must not
			// survive onto another.
			const next = createInitialState(
				enforceContainment( { ...DEFAULT_STATE, image } )
			);
			stateRef.current = next;
			dispatch( { type: 'RESTORE_SNAPSHOT', payload: next } );
			setInitialBaseline( next );
			isGestureOpenRef.current = false;
			gestureSnapshotRef.current = null;
			historyRef.current = [];
			redoStackRef.current = [];
			setHasUndo( false );
			setHasRedo( false );
		},
		[ createInitialState ]
	);

	const resetCropper = useCallback(
		( resetState?: Partial< CropperControllerState > ) => {
			dispatchWithHistory( {
				type: 'CROPPER',
				action: { type: 'RESET', payload: resetState },
			} );
		},
		[ dispatchWithHistory ]
	);

	const setAspectRatioValue = useCallback(
		( presetKey: string ) => {
			dispatchWithHistory( {
				type: 'SET_ASPECT_RATIO_VALUE',
				payload: {
					presetKey,
					resolved: resolveAspectRatio(
						presetKey,
						stateRef.current.cropper.image
					),
					visualSize: visualSizeRef.current,
				},
			} );
		},
		[ dispatchWithHistory ]
	);

	const reset = useCallback( () => {
		dispatchWithHistory( { type: 'RESET' } );
	}, [ dispatchWithHistory ] );

	const dispatchOwnAction = useCallback(
		( action: A ) => dispatchWithHistory( action ),
		[ dispatchWithHistory ]
	);

	const undo = useCallback( () => {
		endGesture();
		const prev = historyRef.current[ historyRef.current.length - 1 ];
		if ( ! prev ) {
			return;
		}
		redoStackRef.current = [ stateRef.current, ...redoStackRef.current ];
		historyRef.current = historyRef.current.slice( 0, -1 );
		setHasUndo( historyRef.current.length > 0 );
		setHasRedo( true );
		stateRef.current = prev;
		dispatch( { type: 'RESTORE_SNAPSHOT', payload: prev } );
	}, [ endGesture ] );

	const redo = useCallback( () => {
		endGesture();
		const next = redoStackRef.current[ 0 ];
		if ( ! next ) {
			return;
		}
		historyRef.current = [ ...historyRef.current, stateRef.current ];
		redoStackRef.current = redoStackRef.current.slice( 1 );
		setHasUndo( true );
		setHasRedo( redoStackRef.current.length > 0 );
		stateRef.current = next;
		dispatch( { type: 'RESTORE_SNAPSHOT', payload: next } );
	}, [ endGesture ] );

	const setVisualSize = useCallback( ( size: Size ) => {
		visualSizeRef.current = size;
	}, [] );

	const adjustCropRectForViewport = useCallback(
		( rect: NormalizedRect ) => {
			dispatchWithHistory(
				{ type: 'VIEWPORT_ADJUST_CROP_RECT', payload: rect },
				false
			);
		},
		[ dispatchWithHistory ]
	);

	const isDirty = ! areStatesEqual( state, initialBaseline );
	// Whether the crop result differs, so the locked ratio on its own
	// does not count (the session's `isDirty` covers it).
	const isCropperDirty = isStateDirty(
		state.cropper,
		initialBaseline.cropper
	);

	const getCroppedImage = useCallback(
		( mimeType?: string, quality?: number ): Promise< Blob > => {
			if ( ! state.cropper.image ) {
				return Promise.reject(
					new Error( 'No image loaded — call setSourceImage first.' )
				);
			}
			return exportCroppedImage(
				state.cropper.image.src,
				state.cropper,
				mimeType,
				quality
			);
		},
		[ state.cropper ]
	);

	const cropper = useMemo< CropperController >(
		() => ( {
			...cropperSetters,
			state: state.cropper,
			setImage: setSourceImage,
			reset: resetCropper,
			isDirty: isCropperDirty,
			getCroppedImage,
			setVisualSize,
			adjustCropRectForViewport,
		} ),
		[
			cropperSetters,
			state.cropper,
			setSourceImage,
			resetCropper,
			isCropperDirty,
			getCroppedImage,
			setVisualSize,
			adjustCropRectForViewport,
		]
	);

	return useMemo(
		() => ( {
			state,
			dispatch: dispatchOwnAction,
			cropper,
			cropOptions: state.cropOptions,
			setAspectRatioValue,
			reset,
			setSourceImage,
			isDirty,
			hasUndo,
			hasRedo,
			undo,
			redo,
			beginGesture,
			endGesture,
		} ),
		[
			state,
			dispatchOwnAction,
			cropper,
			setAspectRatioValue,
			reset,
			setSourceImage,
			isDirty,
			hasUndo,
			hasRedo,
			undo,
			redo,
			beginGesture,
			endGesture,
		]
	);
}
