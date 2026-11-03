import {
	useCallback,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
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
 * History (undo / redo) is not part of this interface. Keep the state
 * yourself (`useCropperController( { state, onChange } )`) to put it in
 * your own undo history.
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
	 * Called by `Cropper` whenever its rendered image size changes; not for
	 * consumers to call. `setAspectRatio` uses the size to reshape the crop.
	 */
	setVisualSize: ( size: Size ) => void;
	/**
	 * Called by `Cropper` when the viewport changes (window or canvas
	 * resize); not for consumers to call. Like `setCropRect`, except that
	 * `onChange` gets `isEdit: false`, since a viewport refit is not an
	 * edit.
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
 * Build the state a cropper starts from for an image: default pan, zoom,
 * rotation, flip and crop, no locked aspect ratio.
 *
 * @param image The loaded image, or `null` before one loads.
 * @return The starting state.
 */
export function createCropperState(
	image: CropperState[ 'image' ] = null
): CropperState {
	return enforceContainment( { ...DEFAULT_STATE, image } );
}

/**
 * Options for `useCropperController`.
 *
 * Leave out `state` and `onChange` and the controller keeps its own state.
 * Pass both to keep the state yourself, for example in an editor's own
 * undo history.
 */
export interface CropperControllerOptions {
	/** Starting state when the controller keeps its own state. */
	initialState?: Partial< CropperState >;
	/** The cropper state, when you keep it yourself. */
	state?: CropperState;
	/**
	 * Called with the next state, when you keep it yourself. `isEdit` is
	 * `false` for changes the person did not make, such as an image
	 * loading or the crop being refitted after a window resize, which
	 * usually should not get an undo entry.
	 */
	onChange?: (
		nextState: CropperState,
		details: { isEdit: boolean }
	) => void;
}

/**
 * Controller for the image cropper: the state, the named setters and the
 * export helpers. It keeps no undo history; keep the state yourself
 * (`state` and `onChange`) to add one.
 *
 * @param options Starting state, or the state and change handler when
 *                you keep the state yourself.
 * @return The cropper controller: state, setters and helpers.
 */
export function useCropperController(
	options: CropperControllerOptions = {}
): CropperController {
	const { initialState, state: controlledState, onChange } = options;
	const isControlled = controlledState !== undefined;

	const [ ownState, setOwnState ] = useState< CropperState >( () =>
		enforceContainment( { ...DEFAULT_STATE, ...initialState } )
	);
	const state = isControlled ? controlledState : ownState;

	// The "clean" snapshot the controller's own state is compared against
	// for `isDirty`. `setImage` and `reset` refresh it. A controlled
	// state is compared against the starting state for its image.
	const [ ownBaseline, setOwnBaseline ] = useState< CropperState >(
		() => ownState
	);

	// Latest state, so several setters in one event see each other's
	// output before React re-renders. Synced to the rendered state after
	// every commit.
	const latestRef = useRef( state );
	useLayoutEffect( () => {
		latestRef.current = state;
	}, [ state ] );

	const onChangeRef = useRef( onChange );
	useLayoutEffect( () => {
		onChangeRef.current = onChange;
	}, [ onChange ] );

	const apply = useCallback(
		( action: CropperAction, isEdit = true ) => {
			const next = cropperReducer( latestRef.current, action );
			if ( next === latestRef.current ) {
				return next;
			}
			latestRef.current = next;
			if ( isControlled ) {
				onChangeRef.current?.( next, { isEdit } );
			} else {
				setOwnState( next );
			}
			return next;
		},
		[ isControlled ]
	);

	const setImage = useCallback(
		( image: CropperState[ 'image' ] ) => {
			if ( areCropperImagesEqual( latestRef.current.image, image ) ) {
				return;
			}
			const next = apply( { type: 'SET_IMAGE', payload: image }, false );
			// Containment can nudge pan/zoom on load; start clean from the
			// loaded state.
			setOwnBaseline( next );
		},
		[ apply ]
	);

	const reset = useCallback(
		( resetState?: Partial< CropperState > ) => {
			const next = apply( { type: 'RESET', payload: resetState } );
			setOwnBaseline( next );
		},
		[ apply ]
	);

	const visualSizeRef = useRef< Size >( { width: 0, height: 0 } );

	const setters = useMemo(
		() =>
			buildCropperSetters(
				( action ) => {
					apply( action );
				},
				() => latestRef.current,
				() => visualSizeRef.current
			),
		[ apply ]
	);

	const isDirty = isStateDirty(
		state,
		isControlled ? createCropperState( state.image ) : ownBaseline
	);

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

	// A refit after a window resize is not something the person did.
	const adjustCropRectForViewport = useCallback(
		( rect: NormalizedRect ) => {
			apply( { type: 'SET_CROP_RECT', payload: rect }, false );
		},
		[ apply ]
	);

	return useMemo(
		() => ( {
			...setters,
			state,
			setImage,
			reset,
			isDirty,
			getCroppedImage,
			setVisualSize,
			adjustCropRectForViewport,
		} ),
		[
			setters,
			state,
			setImage,
			reset,
			isDirty,
			getCroppedImage,
			setVisualSize,
			adjustCropRectForViewport,
		]
	);
}
