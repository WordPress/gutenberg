import {
	useCallback,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import type {
	Flip,
	ImageEditorAction,
	ImageEditorState,
	InternalImageEditorState,
	NormalizedPoint,
	NormalizedRect,
	Size,
} from '../../core/types';
import {
	DEFAULT_STATE,
	MAX_ROTATION_OFFSET,
	MAX_ZOOM,
} from '../../core/constants';
import { getMinZoom } from '../../core/containment';
import { exportCroppedImage } from '../../core/export/canvas-renderer';
import {
	imageEditorReducer,
	enforceContainment,
	isStateDirty,
} from '../../core/state';
import {
	buildImageEditorSetters,
	type ImageEditorSetters,
} from './build-image-editor-setters';

/**
 * The editor controller surface — the contract the ImageEditorCanvas component
 * and its interaction hooks consume.
 *
 * History (undo / redo) is not part of this interface. Keep the state
 * yourself (`useInternalImageEditor( { state, onChange } )`) to put it in
 * your own undo history.
 */
export interface InternalImageEditorController extends ImageEditorSetters {
	/** The current editor state (read-only). */
	state: InternalImageEditorState;
	/** Set the loaded image (natural size and src). */
	setImage: ( image: InternalImageEditorState[ 'image' ] ) => void;
	/** Reset the state. Optionally merge partial state overrides. */
	reset: ( resetState?: Partial< InternalImageEditorState > ) => void;
	/** Whether the current state differs from the initial state. */
	isDirty: boolean;
	/** The smallest zoom that still covers the crop area. */
	minZoom: number;
	/** The largest zoom. */
	maxZoom: number;
	/** How far fine rotation goes either way of a quarter turn, in degrees. */
	maxRotationOffset: number;
	/**
	 * Export the cropped image as a Blob. Throws on failure — see
	 * `exportCroppedImage` for error semantics.
	 */
	getCroppedImage: ( mimeType?: string, quality?: number ) => Promise< Blob >;
	/**
	 * Called by `ImageEditorCanvas` whenever its rendered image size changes; not for
	 * consumers to call. `setAspectRatio` uses the size to reshape the crop.
	 */
	setVisualSize: ( size: Size ) => void;
	/**
	 * Called by `ImageEditorCanvas` when the viewport changes (window or canvas
	 * resize); not for consumers to call. Like `setCropRect`, except that
	 * `onChange` gets `isEdit: false`, since a viewport refit is not an
	 * edit.
	 */
	adjustCropRectForViewport: ( rect: NormalizedRect ) => void;
}

function areImagesEqual(
	a: InternalImageEditorState[ 'image' ],
	b: InternalImageEditorState[ 'image' ]
): boolean {
	return (
		a?.src === b?.src &&
		a?.naturalWidth === b?.naturalWidth &&
		a?.naturalHeight === b?.naturalHeight
	);
}

/**
 * Build the state an editor starts from for an image: default pan, zoom,
 * rotation, flip and crop, no locked aspect ratio.
 *
 * @param image The loaded image, or `null` before one loads.
 * @return The starting state.
 */
export function createImageEditorState(
	image: ImageEditorState[ 'image' ] = null
): ImageEditorState {
	return enforceContainment( { ...DEFAULT_STATE, image } );
}

/**
 * Options for `useInternalImageEditor`.
 *
 * Leave out `state` and `onChange` and the controller keeps its own state.
 * Pass both to keep the state yourself, for example in an editor's own
 * undo history.
 */
export interface InternalImageEditorOptions {
	/** Starting state when the controller keeps its own state. */
	initialState?: Partial< InternalImageEditorState >;
	/** The state, when you keep it yourself. */
	state?: ImageEditorState;
	/**
	 * Called with the next state, when you keep it yourself. `isEdit` is
	 * `false` for changes the person did not make, such as an image
	 * loading or the crop being refitted after a window resize, which
	 * usually should not get an undo entry.
	 */
	onChange?: (
		nextState: InternalImageEditorState,
		details: { isEdit: boolean }
	) => void;
}

/**
 * Controller for the image editor: the state, the named setters and the
 * export helpers. It keeps no undo history; keep the state yourself
 * (`state` and `onChange`) to add one.
 *
 * @param options Starting state, or the state and change handler when
 *                you keep the state yourself.
 * @return The editor controller: state, setters and helpers.
 */
export function useInternalImageEditor(
	options: InternalImageEditorOptions = {}
): InternalImageEditorController {
	const { initialState, state: controlledState, onChange } = options;
	const isControlled = controlledState !== undefined;

	const [ ownState, setOwnState ] = useState< InternalImageEditorState >(
		() => enforceContainment( { ...DEFAULT_STATE, ...initialState } )
	);
	// A state the consumer passes back is one the editor handed out, so it
	// carries the values the editor keeps for itself.
	const state = isControlled
		? ( controlledState as InternalImageEditorState )
		: ownState;

	// The "clean" snapshot the controller's own state is compared against
	// for `isDirty`. `setImage` and `reset` refresh it. A controlled
	// state is compared against the starting state for its image.
	const [ ownBaseline, setOwnBaseline ] =
		useState< InternalImageEditorState >( () => ownState );

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
		( action: ImageEditorAction, isEdit = true ) => {
			const next = imageEditorReducer( latestRef.current, action );
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
		( image: InternalImageEditorState[ 'image' ] ) => {
			if ( areImagesEqual( latestRef.current.image, image ) ) {
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
		( resetState?: Partial< InternalImageEditorState > ) => {
			const next = apply( { type: 'RESET', payload: resetState } );
			setOwnBaseline( next );
		},
		[ apply ]
	);

	const visualSizeRef = useRef< Size >( { width: 0, height: 0 } );

	const setters = useMemo(
		() =>
			buildImageEditorSetters(
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
		isControlled ? createImageEditorState( state.image ) : ownBaseline
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

	const minZoom = getMinZoom( state );

	return useMemo(
		() => ( {
			...setters,
			state,
			setImage,
			reset,
			isDirty,
			minZoom,
			maxZoom: MAX_ZOOM,
			maxRotationOffset: MAX_ROTATION_OFFSET,
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
			minZoom,
			getCroppedImage,
			setVisualSize,
			adjustCropRectForViewport,
		]
	);
}

/**
 * The controller `useImageEditor` returns: the current state, the
 * changes a person can make, and the limits for building controls.
 */
export interface ImageEditorController {
	/** The current state. */
	readonly state: ImageEditorState;
	/** Whether the edit differs from the starting state for the image. */
	readonly isDirty: boolean;
	/** The smallest zoom that still covers the crop area. */
	readonly minZoom: number;
	/** The largest zoom. */
	readonly maxZoom: number;
	/** How far, in degrees, fine rotation goes either way of a quarter turn. */
	readonly maxRotationOffset: number;
	/** Load an image, or clear it with `null`. */
	setImage: ( image: ImageEditorState[ 'image' ] ) => void;
	/** Go back to the starting state for the loaded image. */
	reset: () => void;
	/** Move the image under the crop, in fractions of the image. */
	setPan: ( pan: NormalizedPoint ) => void;
	/** Zoom around the centre of the crop. */
	setZoom: ( zoom: number ) => void;
	/** Rotate to an angle in degrees, clockwise. */
	setRotation: ( rotation: number ) => void;
	/** Rotate a quarter turn: `1` clockwise, `-1` counter-clockwise. */
	snapRotate90: ( direction: 1 | -1 ) => void;
	/** Mirror the image along each axis that is `true`. */
	setFlip: ( flip: Flip ) => void;
	/** Mirror the image along one axis, or undo that. */
	toggleFlip: ( direction: 'horizontal' | 'vertical' ) => void;
	/** Set the crop area, in fractions of the view the canvas shows. */
	setCropRect: ( rect: NormalizedRect ) => void;
	/**
	 * Lock the crop to a width / height ratio in source pixels, or unlock
	 * it with `undefined`. Locking reshapes the crop to the largest box of
	 * that ratio.
	 */
	setAspectRatio: ( aspectRatio: number | undefined ) => void;
}

/**
 * Options for `useImageEditor`. The consumer keeps the state, for example
 * in its own undo history.
 */
export interface ImageEditorOptions {
	/** The current state. Start from `createImageEditorState()`. */
	state: ImageEditorState;
	/**
	 * Called with the next state. `isEdit` is `false` for changes the
	 * person did not make, such as an image loading or the crop being
	 * refitted after a window resize, which usually should not get an
	 * undo entry.
	 */
	onChange: (
		nextState: ImageEditorState,
		details: { isEdit: boolean }
	) => void;
}

/**
 * React hook for an image editor. The consumer keeps the state and gets
 * each change through `onChange`.
 *
 * @param options The state, and a function that stores the next one.
 * @return The controller: the state, the changes a person can make, and
 *         the limits for building controls.
 */
export function useImageEditor(
	options: ImageEditorOptions
): ImageEditorController {
	return useInternalImageEditor( options );
}
