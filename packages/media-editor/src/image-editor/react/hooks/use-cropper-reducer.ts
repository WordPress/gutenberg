/**
 * WordPress dependencies
 */
import {
	useReducer,
	useCallback,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import type {
	CropperState,
	CropperAction,
	NormalizedRect,
	Size,
} from '../../core/types';
import { DEFAULT_STATE } from '../../core/constants';
import { exportCroppedImage } from '../../core/export/canvas-renderer';
import {
	cropperReducer,
	enforceContainment,
	isStateDirty,
} from '../../core/state';
import {
	buildCropperSetters,
	type CropperSetters,
} from './build-cropper-setters';

/**
 * The cropper controller surface — the contract the Cropper component
 * and its interaction hooks consume.
 *
 * History (undo / redo / commitHistory) is intentionally NOT part of
 * this interface. The cropper is a pure state machine; history is a
 * higher-layer concern owned by a composite store
 * (see media-editor/src/state).
 */
export interface CropperController extends CropperSetters {
	/** The current cropper state (read-only). */
	state: CropperState;
	/** Set the loaded image (natural size and src). */
	setImage: ( image: CropperState[ 'image' ] ) => void;
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
 * setters (built from the shared `buildCropperSetters` factory).
 * Does NOT manage undo/redo history — that responsibility belongs to
 * the surrounding application (see `useMediaEditorState` for the
 * composite store used by the media editor).
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
	// Latest-state ref used by setters that need to read fresh state
	// (focal-point zoom, toggleFlip, reset, setImage). Updated
	// synchronously inside `dispatchAndSync` so multiple actions in
	// one event see each other's output before React commits.
	const stateRef = useRef( state );

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

	const setters = useMemo(
		() => buildCropperSetters( dispatchAndSync, () => stateRef.current ),
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
	const adjustCropRectForViewport = setters.setCropRect;

	const controller: CropperController = {
		...setters,
		state,
		setImage,
		reset,
		isDirty,
		getCroppedImage,
		setVisualSize,
		adjustCropRectForViewport,
	};
	return controller;
}
