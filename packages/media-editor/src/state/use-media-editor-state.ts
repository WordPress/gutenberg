/**
 * WordPress dependencies
 */
import {
	useCallback,
	useMemo,
	useReducer,
	useRef,
	useState,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	DEFAULT_STATE,
	ORIGINAL_ASPECT_RATIO,
	areCropperStatesEqual,
	buildCropperSetters,
	enforceContainment,
	exportCroppedImage,
	type CropperAction,
	type CropperController,
	type CropperState,
	type NormalizedRect,
	type Size,
} from '../image-editor';
import {
	mediaEditorReducer,
	areMediaEditorStatesEqual,
	buildInitialMediaEditorState,
} from './composite-reducer';
import type {
	CropOptionsSlice,
	MediaEditorAction,
	MediaEditorState,
} from './types';

/**
 * Resolve an aspect-ratio preset value (the string the dropdown
 * round-trips) into a numeric width/height ratio for the cropper.
 *
 * - `'0'` → `undefined` (Free; no lock)
 * - `'-1'` (Original) → image's natural width / height, or `undefined`
 *   if no image is loaded.
 * - Any positive decimal → the parsed number.
 *
 * Centralizing here means the dropdown, the action dispatcher, and
 * the test harness all resolve the same way.
 *
 * @param presetKey    Preset value from the dropdown.
 * @param cropperImage The cropper's loaded image, or `null`.
 * @return The resolved ratio, or `undefined` for Free / unresolvable.
 */
export function resolveAspectRatio(
	presetKey: string,
	cropperImage: CropperState[ 'image' ] | null
): number | undefined {
	const num = parseFloat( presetKey );
	if ( num === 0 || Number.isNaN( num ) ) {
		return undefined;
	}
	if ( num === ORIGINAL_ASPECT_RATIO ) {
		if (
			cropperImage &&
			cropperImage.naturalWidth > 0 &&
			cropperImage.naturalHeight > 0
		) {
			return cropperImage.naturalWidth / cropperImage.naturalHeight;
		}
		return undefined;
	}
	if ( num > 0 ) {
		return num;
	}
	return undefined;
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
 * The composite controller exposed by `useMediaEditorState`.
 *
 * Satisfies `CropperController` (so a `<Cropper>` can take this
 * controller directly via the `controller` prop) and adds slice
 * setters, undo/redo, gesture boundaries, and viewport reporting.
 */
export interface MediaEditorController extends CropperController {
	/** The cropOptions slice. */
	cropOptions: CropOptionsSlice;
	/** Set the aspect-ratio preset. Atomic with the cropRect reshape. */
	setAspectRatioValue: ( presetKey: string ) => void;
	/** Reset cropOptions to defaults. */
	resetCropOptions: () => void;
	/**
	 * Whether the cropper geometry differs from the initial baseline.
	 */
	isCropperDirty: boolean;
	/** Whether there's an undoable change in history. */
	hasUndo: boolean;
	/** Whether there's a redoable change in history. */
	hasRedo: boolean;
	/** Undo the last committed action across all slices. */
	undo: () => void;
	/** Redo the last undone action across all slices. */
	redo: () => void;
	/**
	 * Open a gesture boundary. During a gesture all state-changing
	 * actions coalesce into one undo entry — the snapshot taken at
	 * `beginGesture`. Pair with `endGesture` on pointer-up / key-up.
	 */
	beginGesture: () => void;
	/** Close a gesture boundary and commit the pre-gesture snapshot. */
	endGesture: () => void;
	/**
	 * Report the current rendered image size to the controller. The
	 * Cropper component calls this whenever its visualSize changes;
	 * the controller needs it to compute aspect-ratio reshapes.
	 */
	setVisualSize: ( size: Size ) => void;
	/**
	 * Reshape the cropRect in response to a viewport change. Behaves
	 * like `setCropRect` but does NOT record an undo entry — window
	 * resizes aren't editor actions.
	 */
	adjustCropRectForViewport: ( rect: NormalizedRect ) => void;
}

interface InitialMediaEditorState {
	cropper?: Partial< CropperState >;
	cropOptions?: Partial< CropOptionsSlice >;
}

/**
 * Composite store for the media editor.
 *
 * Owns the only undo/redo history for the editor. Cropper geometry
 * actions and sidebar cropOptions actions flow through the same
 * reducer and the same history stack.
 *
 * History semantics:
 * - Each action's pre-state is pushed to the undo stack before the
 *   action commits, unless a gesture is open or the action is a
 *   no-op (post-state value-equal to pre-state).
 * - During a gesture (`beginGesture` → `endGesture`) all mutations
 *   coalesce: only the pre-gesture snapshot is pushed, at gesture
 *   end. Any pending gesture is flushed on undo/redo.
 * - Viewport-driven cropRect reshapes (window resize) use a
 *   dedicated non-recording dispatch path so they never produce
 *   undo entries.
 *
 * `isDirty` tracks the full editor session, including undoable UI
 * state. Use `isCropperDirty` when deciding whether the image output
 * needs saving.
 *
 * @param initialState Optional seed for the cropper and cropOptions slices.
 * @return The composite controller.
 */
export function useMediaEditorState(
	initialState?: InitialMediaEditorState
): MediaEditorController {
	const [ state, dispatch ] = useReducer( mediaEditorReducer, null, () =>
		buildInitialMediaEditorState(
			enforceContainment( {
				...DEFAULT_STATE,
				...initialState?.cropper,
			} ),
			initialState?.cropOptions
		)
	);

	// The "clean" snapshot the current state is compared against for
	// `isDirty`. Stored in state (not a ref) so the comparison reads
	// a value, not a ref's `current`. `setImage` refreshes this when
	// a new image establishes a fresh baseline.
	const [ initialBaseline, setInitialBaseline ] =
		useState< MediaEditorState >( () => state );

	// Latest-state ref used by setters that need to read fresh state
	// (focal-point zoom, dispatch wrapper). Every mutation path
	// (`dispatchWithHistory`, `setImage`, `undo`, `redo`) writes this
	// synchronously, so multiple actions in one event see the latest
	// reducer output before React commits.
	const stateRef = useRef( state );
	const visualSizeRef = useRef< Size >( { width: 0, height: 0 } );

	// History stacks: full composite snapshots. Refs avoid re-renders
	// on every push; a boolean state pair drives the enabled/disabled
	// indicators for undo/redo buttons.
	const historyRef = useRef< MediaEditorState[] >( [] );
	const redoStackRef = useRef< MediaEditorState[] >( [] );
	const [ hasUndo, setHasUndo ] = useState( false );
	const [ hasRedo, setHasRedo ] = useState( false );

	// Gesture state. While open, the first non-no-op action captures
	// the pre-gesture snapshot; subsequent actions don't push.
	// `endGesture` pushes the captured snapshot (or nothing, if the
	// gesture produced no changes).
	const isGestureOpenRef = useRef( false );
	const gestureSnapshotRef = useRef< MediaEditorState | null >( null );

	const pushSnapshot = useCallback( ( snapshot: MediaEditorState ) => {
		const last = historyRef.current[ historyRef.current.length - 1 ];
		if ( last && areMediaEditorStatesEqual( last, snapshot ) ) {
			return;
		}
		historyRef.current = [ ...historyRef.current, snapshot ];
		redoStackRef.current = [];
		setHasUndo( true );
		setHasRedo( false );
	}, [] );

	// Core dispatch wrapper. Synchronously computes the post-state via
	// the pure reducer so we can skip history pushes for no-op actions
	// and keep `stateRef` in lockstep with React's pending state.
	const dispatchWithHistory = useCallback(
		( action: MediaEditorAction, recordHistory = true ) => {
			const preState = stateRef.current;
			const postState = mediaEditorReducer( preState, action );
			if ( recordHistory ) {
				if ( ! areMediaEditorStatesEqual( preState, postState ) ) {
					if ( isGestureOpenRef.current ) {
						if ( gestureSnapshotRef.current === null ) {
							gestureSnapshotRef.current = preState;
						}
					} else {
						pushSnapshot( preState );
					}
				}
			}
			stateRef.current = postState;
			dispatch( action );
		},
		[ pushSnapshot ]
	);

	const beginGesture = useCallback( () => {
		if ( isGestureOpenRef.current ) {
			return;
		}
		isGestureOpenRef.current = true;
		gestureSnapshotRef.current = null;
	}, [] );

	// Close a gesture (or flush a pending one before undo/redo).
	// Pushes the pre-gesture snapshot only if it differs from current
	// state. Safe to call when no gesture is open.
	const endGesture = useCallback( () => {
		const snapshot = gestureSnapshotRef.current;
		if (
			snapshot &&
			! areMediaEditorStatesEqual( snapshot, stateRef.current )
		) {
			pushSnapshot( snapshot );
		}
		gestureSnapshotRef.current = null;
		isGestureOpenRef.current = false;
	}, [ pushSnapshot ] );

	// =====================================================================
	// Cropper-slice setters (built from the shared factory so the pure
	// hook and this composite stay in lockstep — add a setter in
	// `buildCropperSetters` once and both hooks get it).
	// =====================================================================

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
				() => stateRef.current.cropper
			),
		[ dispatchCropperAction ]
	);

	const setImage = useCallback( ( image: CropperState[ 'image' ] ) => {
		if ( areCropperImagesEqual( stateRef.current.cropper.image, image ) ) {
			return;
		}
		// New image = fresh canvas: clear history, refresh the
		// initial snapshot so isDirty starts at false.
		const action = {
			type: 'CROPPER' as const,
			action: { type: 'SET_IMAGE' as const, payload: image },
		};
		const next = mediaEditorReducer( stateRef.current, action );
		stateRef.current = next;
		dispatch( action );
		setInitialBaseline( next );
		isGestureOpenRef.current = false;
		gestureSnapshotRef.current = null;
		historyRef.current = [];
		redoStackRef.current = [];
		setHasUndo( false );
		setHasRedo( false );
	}, [] );

	const reset = useCallback(
		( resetState?: Partial< CropperState > ) => {
			dispatchWithHistory( {
				type: 'CROPPER',
				action: { type: 'RESET', payload: resetState },
			} );
		},
		[ dispatchWithHistory ]
	);

	// =====================================================================
	// CropOptions-slice setters
	// =====================================================================

	const setAspectRatioValue = useCallback(
		( presetKey: string ) => {
			const resolved = resolveAspectRatio(
				presetKey,
				stateRef.current.cropper.image
			);
			dispatchWithHistory( {
				type: 'SET_ASPECT_RATIO_VALUE',
				payload: {
					presetKey,
					resolved,
					visualSize: visualSizeRef.current,
				},
			} );
		},
		[ dispatchWithHistory ]
	);

	const resetCropOptions = useCallback( () => {
		dispatchWithHistory( { type: 'RESET_CROP_OPTIONS' } );
	}, [ dispatchWithHistory ] );

	// =====================================================================
	// History
	// =====================================================================

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

	// =====================================================================
	// Viewport
	// =====================================================================

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

	// =====================================================================
	// Derived
	// =====================================================================

	const isDirty = ! areMediaEditorStatesEqual( state, initialBaseline );
	const isCropperDirty = ! areCropperStatesEqual(
		state.cropper,
		initialBaseline.cropper
	);

	const getCroppedImage = useCallback(
		( mimeType?: string, quality?: number ): Promise< Blob > => {
			if ( ! state.cropper.image ) {
				return Promise.reject(
					new Error( 'No image loaded — call setImage first.' )
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

	const controller = useMemo< MediaEditorController >(
		() => ( {
			// CropperController surface (state is the cropper slice so a
			// <Cropper> takes this controller as-is).
			...cropperSetters,
			state: state.cropper,
			setImage,
			reset,
			isDirty,
			getCroppedImage,
			// Composite extensions
			cropOptions: state.cropOptions,
			setAspectRatioValue,
			resetCropOptions,
			isCropperDirty,
			hasUndo,
			hasRedo,
			undo,
			redo,
			beginGesture,
			endGesture,
			setVisualSize,
			adjustCropRectForViewport,
		} ),
		[
			cropperSetters,
			state.cropper,
			setImage,
			reset,
			isDirty,
			getCroppedImage,
			state.cropOptions,
			setAspectRatioValue,
			resetCropOptions,
			isCropperDirty,
			hasUndo,
			hasRedo,
			undo,
			redo,
			beginGesture,
			endGesture,
			setVisualSize,
			adjustCropRectForViewport,
		]
	);
	return controller;
}
