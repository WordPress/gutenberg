import {
	useCallback,
	useMemo,
	useReducer,
	useRef,
	useState,
} from '@wordpress/element';
import {
	createImageEditorState,
	useImageEditor,
	type ImageEditorController,
	type ImageEditorState,
} from '@wordpress/image-editor';
import { ORIGINAL_ASPECT_RATIO } from './aspect-ratio-presets';
import {
	mediaEditorReducer,
	areMediaEditorStatesEqual,
	buildInitialMediaEditorState,
} from './composite-reducer';
import type {
	CropOptionsSlice,
	EditsSlice,
	EditValue,
	MediaEditorAction,
	MediaEditorState,
} from './types';

/**
 * Resolve an aspect-ratio preset value (the string the dropdown
 * round-trips) into a numeric width/height ratio for the image editor.
 *
 * - `'0'` → `undefined` (Free; no lock)
 * - `'-1'` (Original) → image's natural width / height, or `undefined`
 *   if no image is loaded.
 * - Any positive decimal → the parsed number.
 *
 * @param presetKey Preset value from the dropdown.
 * @param image     The image editor's loaded image, or `null`.
 * @return The resolved ratio, or `undefined` for Free / unresolvable.
 */
function resolveAspectRatio(
	presetKey: string,
	image: ImageEditorState[ 'image' ] | null
): number | undefined {
	const num = parseFloat( presetKey );
	if ( num === 0 || Number.isNaN( num ) ) {
		return undefined;
	}
	if ( num === ORIGINAL_ASPECT_RATIO ) {
		if ( image && image.naturalWidth > 0 && image.naturalHeight > 0 ) {
			return image.naturalWidth / image.naturalHeight;
		}
		return undefined;
	}
	if ( num > 0 ) {
		return num;
	}
	return undefined;
}

function areImagesEqual(
	a: ImageEditorState[ 'image' ],
	b: ImageEditorState[ 'image' ]
): boolean {
	return (
		a?.src === b?.src &&
		a?.naturalWidth === b?.naturalWidth &&
		a?.naturalHeight === b?.naturalHeight
	);
}

/**
 * The media editor session exposed by `useMediaEditorState`.
 *
 * The session owns what is being edited and how: the source image,
 * every editing slice, the shared undo/redo history, gesture
 * boundaries, and whether the edits change the saved image. The
 * image editor is one participant in the session — `imageEditor` is the
 * controller an `<ImageEditorCanvas>` takes via its `controller` prop — rather
 * than the session itself.
 */
export interface MediaEditorSession {
	/**
	 * Controller for the image editor. Its setters record history in the
	 * session; its `isDirty` covers the crop only. Its `setImage` is
	 * `setSourceImage`, so the `<ImageEditorCanvas>` reporting a newly loaded
	 * image starts a fresh session.
	 */
	imageEditor: ImageEditorController;
	/** The cropOptions slice. */
	cropOptions: CropOptionsSlice;
	/** Set the aspect-ratio preset and reshape the crop in one undo entry. */
	setAspectRatioValue: ( presetKey: string ) => void;
	/**
	 * Put every slice back to its starting state in one undo entry:
	 * default crop and crop options, no edits. Keeps the image.
	 */
	reset: () => void;
	/** The named edits other than crop, keyed by edit name. */
	edits: EditsSlice;
	/**
	 * Set a named edit, or remove it by passing `undefined`. Recorded
	 * in the session history like any crop change. Setting a value
	 * equal in content to the current one is a no-op.
	 */
	setEdit: ( name: string, value: EditValue | undefined ) => void;
	/**
	 * Replace the image being edited. A different image starts a
	 * fresh session: default crop and crop options, a clean baseline,
	 * and no history. Reporting the same image again is a no-op.
	 */
	setSourceImage: ( image: ImageEditorState[ 'image' ] ) => void;
	/**
	 * Whether anything in the session differs from its baseline,
	 * including editor-only state such as the aspect-ratio preset.
	 */
	isDirty: boolean;
	/**
	 * Whether the edits change the saved image, so saving has to
	 * produce new image output rather than only metadata.
	 */
	hasOutputEdits: boolean;
	/** Whether there's an undoable change in history. */
	hasUndo: boolean;
	/** Whether there's a redoable change in history. */
	hasRedo: boolean;
	/** Undo the last committed change across all slices. */
	undo: () => void;
	/** Redo the last undone change across all slices. */
	redo: () => void;
	/**
	 * Open a gesture boundary. During a gesture all changes coalesce
	 * into one undo entry — the snapshot taken at `beginGesture`. Pair
	 * with `endGesture` on pointer-up / key-up.
	 */
	beginGesture: () => void;
	/** Close a gesture boundary and commit the pre-gesture snapshot. */
	endGesture: () => void;
}

/**
 * The media editor session.
 *
 * Owns the only undo/redo history for the editor. The image editor's state,
 * the sidebar crop options and named edits are slices of one state, so
 * one history stack covers them all. The image editor works out its own
 * changes and reports each next state through `onChange`.
 *
 * History semantics:
 * - Each change pushes its pre-state to the undo stack, unless a
 *   gesture is open or the change is a no-op (post-state value-equal
 *   to pre-state).
 * - During a gesture (`beginGesture` → `endGesture`) changes coalesce:
 *   only the pre-gesture snapshot is pushed, at gesture end. Undo and
 *   redo close an open gesture first.
 * - Changes the image editor marks as not edits (an image loading, a refit
 *   after a window resize) are never recorded.
 *
 * `isDirty` tracks the full session, including undoable UI state. Use
 * `hasOutputEdits` when deciding whether the image output needs saving.
 *
 * The session starts empty. Call `setSourceImage` to load an image.
 *
 * @return The media editor session.
 */
export function useMediaEditorState(): MediaEditorSession {
	const [ state, dispatch ] = useReducer( mediaEditorReducer, null, () =>
		buildInitialMediaEditorState( createImageEditorState() )
	);

	// The "clean" snapshot the current state is compared against for
	// `isDirty`. `setSourceImage` refreshes it when a new image starts a
	// fresh session.
	const [ initialBaseline, setInitialBaseline ] =
		useState< MediaEditorState >( () => state );

	// Latest state, so several actions in one event see each other's
	// output before React commits. Every mutation path writes it
	// synchronously.
	const stateRef = useRef( state );

	// History stacks: full snapshots. Refs avoid re-renders on every
	// push; a boolean state pair drives the undo/redo indicators.
	const historyRef = useRef< MediaEditorState[] >( [] );
	const redoStackRef = useRef< MediaEditorState[] >( [] );
	const [ hasUndo, setHasUndo ] = useState( false );
	const [ hasRedo, setHasRedo ] = useState( false );

	// Gesture state. While open, the first change captures the
	// pre-gesture snapshot; later changes don't push.
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

	const dispatchWithHistory = useCallback(
		( action: MediaEditorAction, recordHistory = true ) => {
			const preState = stateRef.current;
			const postState = mediaEditorReducer( preState, action );
			if (
				recordHistory &&
				! areMediaEditorStatesEqual( preState, postState )
			) {
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
		[ pushSnapshot ]
	);

	const beginGesture = useCallback( () => {
		if ( isGestureOpenRef.current ) {
			return;
		}
		isGestureOpenRef.current = true;
		gestureSnapshotRef.current = null;
	}, [] );

	// Close a gesture (or flush a pending one before undo/redo). Pushes
	// the pre-gesture snapshot only if it differs from the current
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

	// Run several changes as one undo entry, unless a gesture is already
	// open, which groups them anyway.
	const asOneUndoEntry = useCallback(
		( run: () => void ) => {
			if ( isGestureOpenRef.current ) {
				run();
				return;
			}
			beginGesture();
			run();
			endGesture();
		},
		[ beginGesture, endGesture ]
	);

	const setSourceImage = useCallback(
		( image: ImageEditorState[ 'image' ] ) => {
			if ( areImagesEqual( stateRef.current.imageEditor.image, image ) ) {
				return;
			}
			// New image = fresh session: default crop and crop options, a
			// clean baseline, and no history. Edits made against one
			// image must not survive onto another.
			const next = buildInitialMediaEditorState(
				createImageEditorState( { image } )
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
		[]
	);

	const handleImageEditorChange = useCallback(
		( nextState: ImageEditorState, { isEdit }: { isEdit: boolean } ) => {
			if (
				! areImagesEqual(
					stateRef.current.imageEditor.image,
					nextState.image
				)
			) {
				setSourceImage( nextState.image );
				return;
			}
			dispatchWithHistory(
				{ type: 'SET_IMAGE_EDITOR', payload: nextState },
				isEdit
			);
		},
		[ dispatchWithHistory, setSourceImage ]
	);

	const imageEditorController = useImageEditor( {
		state: state.imageEditor,
		onChange: handleImageEditorChange,
	} );

	// The locked ratio has two owners: the preset the sidebar shows, and
	// the number the image editor holds. This is the only path that sets
	// both, so call it rather than `imageEditor.setAspectRatio`, which
	// would leave the sidebar showing a ratio the crop no longer has.
	const setAspectRatioValue = useCallback(
		( presetKey: string ) => {
			asOneUndoEntry( () => {
				dispatchWithHistory( {
					type: 'SET_ASPECT_RATIO_VALUE',
					payload: presetKey,
				} );
				imageEditorController.setAspectRatio(
					resolveAspectRatio(
						presetKey,
						stateRef.current.imageEditor.image
					)
				);
			} );
		},
		[ asOneUndoEntry, dispatchWithHistory, imageEditorController ]
	);

	const reset = useCallback( () => {
		dispatchWithHistory( { type: 'RESET' } );
	}, [ dispatchWithHistory ] );

	const setEdit = useCallback(
		( name: string, value: EditValue | undefined ) => {
			dispatchWithHistory( {
				type: 'SET_EDIT',
				payload: { name, value },
			} );
		},
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

	const imageEditor = useMemo< ImageEditorController >(
		() => ( { ...imageEditorController, setImage: setSourceImage } ),
		[ imageEditorController, setSourceImage ]
	);

	const isDirty = ! areMediaEditorStatesEqual( state, initialBaseline );

	return useMemo(
		() => ( {
			imageEditor,
			cropOptions: state.cropOptions,
			setAspectRatioValue,
			edits: state.edits,
			setEdit,
			setSourceImage,
			reset,
			isDirty,
			// Only the crop changes the saved image so far.
			//
			// This reads the image editor's own clean state, not the
			// session's. The two agree because the session only ever
			// replaces the editor's slice with a state the editor handed
			// out, and because a fresh state for an image matches the
			// default one on every field `isDirty` compares. Change
			// either and this has to compare against the session's
			// baseline instead.
			hasOutputEdits: imageEditor.isDirty,
			hasUndo,
			hasRedo,
			undo,
			redo,
			beginGesture,
			endGesture,
		} ),
		[
			imageEditor,
			state.cropOptions,
			setAspectRatioValue,
			state.edits,
			setEdit,
			setSourceImage,
			reset,
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
