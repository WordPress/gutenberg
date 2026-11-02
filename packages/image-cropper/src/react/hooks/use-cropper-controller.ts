import {
	useReducer,
	useCallback,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import type {
	CropperControllerState,
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
	state: CropperControllerState;
	/** Set the loaded image (natural size and src). */
	setImage: ( image: CropperControllerState[ 'image' ] ) => void;
	/** Reset the state. Optionally merge partial state overrides. */
	reset: ( resetState?: Partial< CropperControllerState > ) => void;
	/** Whether the current state differs from the initial state. */
	isDirty: boolean;
	/**
	 * Export the cropped image as a Blob. Throws on failure — see
	 * `exportCroppedImage` for error semantics.
	 */
	getCroppedImage: ( mimeType?: string, quality?: number ) => Promise< Blob >;
	/**
	 * Called by `Cropper` whenever its rendered image size changes; not for
	 * consumers to call. `setAspectRatio` uses the size to reshape the crop.
	 */
	setVisualSize: ( size: Size ) => void;
	/**
	 * Called by `Cropper` when the viewport changes (window or canvas
	 * resize); not for consumers to call. Like `setCropRect`, except that a
	 * composite controller records no undo entry for it, since a viewport
	 * reshape is not an editor action. The pure cropper hook aliases it to
	 * `setCropRect`.
	 */
	adjustCropRectForViewport: ( rect: NormalizedRect ) => void;
}

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
 * Controller hook for the image cropper: the state, the named setters and
 * the export helpers, without history.
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
export function useCropperController(
	initialState?: Partial< CropperControllerState >
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
	const [ initialBaseline, setInitialBaseline ] =
		useState< CropperControllerState >( () =>
			enforceContainment( { ...DEFAULT_STATE, ...initialState } )
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
		( image: CropperControllerState[ 'image' ] ) => {
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
		( resetState?: Partial< CropperControllerState > ) => {
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

	const visualSizeRef = useRef< Size >( { width: 0, height: 0 } );

	const setters = useMemo(
		() =>
			buildCropperSetters(
				dispatchAndSync,
				() => stateRef.current,
				() => visualSizeRef.current
			),
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

	// `setAspectRatio` needs the rendered size to reshape the crop.
	const setVisualSize = useCallback( ( size: Size ) => {
		visualSizeRef.current = size;
	}, [] );

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
