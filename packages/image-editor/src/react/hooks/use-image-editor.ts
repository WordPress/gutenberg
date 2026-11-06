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
	areImageEditorStatesEqual,
	enforceContainment,
	fitCropToLockedRatio,
	isStateDirty,
	withBaseValues,
} from '../../core/state';
import {
	buildImageEditorSetters,
	type ImageEditorSetters,
} from './build-image-editor-setters';

/**
 * Marks a controller as one `useImageEditor` made. `<ImageEditorCanvas>`
 * also calls methods that are not on the public type, so a hand-built
 * object would type-check and then fail. Nothing sets this at runtime.
 */
declare const imageEditorController: unique symbol;

/**
 * The editor controller surface — the contract the ImageEditorCanvas component
 * and its interaction hooks consume.
 *
 * History (undo / redo) is not part of this interface. Keep the state
 * yourself (`useInternalImageEditor( { state, onChange } )`) to put it in
 * your own undo history.
 */
export interface InternalImageEditorController extends ImageEditorSetters {
	readonly [ imageEditorController ]: true;
	/** The current editor state (read-only). */
	state: InternalImageEditorState;
	/**
	 * Set the loaded image (natural size and src). Replacing or clearing a
	 * loaded image starts fresh, keeping only the locked ratio.
	 */
	setImage: ( image: InternalImageEditorState[ 'image' ] ) => void;
	/**
	 * Go back to the clean state. Optionally merge partial state
	 * overrides.
	 */
	reset: ( resetState?: Partial< InternalImageEditorState > ) => void;
	/** Whether the state differs from the clean state. */
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
 * What an editor can start from.
 */
export interface CreateImageEditorStateOptions {
	/** The image to start with, if you already have it. */
	image?: ImageEditorState[ 'image' ];
	/**
	 * A width / height ratio in source pixels to lock the crop to from the
	 * start. With an image, the crop starts as the largest box of that
	 * ratio.
	 */
	aspectRatio?: number;
}

/**
 * Build the state an editor starts from: default pan, zoom, rotation,
 * flip and crop, and no locked ratio unless you ask for one.
 *
 * @param options The image and the locked ratio to start with.
 * @return The starting state.
 */
export function createImageEditorState(
	options: CreateImageEditorStateOptions = {}
): ImageEditorState {
	const { image = null, aspectRatio } = options;
	return enforceContainment(
		fitCropToLockedRatio( {
			...DEFAULT_STATE,
			image,
			aspectRatio:
				aspectRatio && aspectRatio > 0 ? aspectRatio : undefined,
		} )
	);
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
	// A state the consumer passes back is usually one the editor handed
	// out, which carries the values the editor keeps for itself. One built
	// by hand does not, so fill them in rather than read them as undefined.
	const suppliedState = isControlled
		? withBaseValues( controlledState )
		: ownState;
	const state =
		isControlled && fitCropToLockedRatio( suppliedState ) !== suppliedState
			? imageEditorReducer( suppliedState, {
					type: 'SET_CROP_RECT',
					payload: suppliedState.cropRect,
				} )
			: suppliedState;

	// The clean state `isDirty` compares against and `reset` returns to.
	// It starts as the consumer's starting state, and follows the changes
	// the person did not make (an image loading, the canvas fitting the
	// crop) until the person makes an edit. `reset` and a new image make
	// it clean again.
	const [ baseline, setBaseline ] = useState< InternalImageEditorState >(
		() => state
	);
	const hasEditedRef = useRef( false );

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
	// Correct a supplied crop before it can be read or edited. Send the
	// correction back to the consumer without adding an undo entry.
	useLayoutEffect( () => {
		if ( ! isControlled || state === suppliedState ) {
			return;
		}
		if ( ! hasEditedRef.current ) {
			setBaseline( ( current ) =>
				areImageEditorStatesEqual( current, state ) ? current : state
			);
		}
		onChangeRef.current?.( state, { isEdit: false } );
	}, [ isControlled, state, suppliedState ] );

	const apply = useCallback(
		( action: ImageEditorAction, isEdit = true ) => {
			const next = imageEditorReducer( latestRef.current, action );
			if ( next === latestRef.current ) {
				return next;
			}
			latestRef.current = next;
			if ( isEdit ) {
				hasEditedRef.current = true;
			} else if ( ! hasEditedRef.current ) {
				setBaseline( next );
			}
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
			const current = latestRef.current;
			if ( areImagesEqual( current.image, image ) ) {
				// A state can arrive with its image already in it and a crop
				// that does not match its locked ratio. Fit the crop now, as
				// loading the image would have.
				if ( fitCropToLockedRatio( current ) !== current ) {
					apply(
						{ type: 'SET_CROP_RECT', payload: current.cropRect },
						false
					);
				}
				return;
			}
			hasEditedRef.current = false;
			if ( current.image ) {
				// The loaded image is replaced or cleared: start fresh,
				// keeping only the locked ratio. The old pan, zoom, rotation,
				// flip and crop do not fit another image.
				apply(
					{
						type: 'RESET',
						payload: { image, aspectRatio: current.aspectRatio },
					},
					false
				);
				return;
			}
			// The first image keeps the starting state, which may be an edit
			// saved earlier or a locked ratio.
			apply( { type: 'SET_IMAGE', payload: image }, false );
		},
		[ apply ]
	);

	const reset = useCallback(
		( resetState?: Partial< InternalImageEditorState > ) => {
			const next = apply( {
				type: 'RESET',
				payload: {
					...baseline,
					image: latestRef.current.image,
					...resetState,
				},
			} );
			hasEditedRef.current = false;
			setBaseline( next );
		},
		[ apply, baseline ]
	);

	const setters = useMemo(
		() =>
			buildImageEditorSetters(
				( action ) => {
					apply( action );
				},
				() => latestRef.current
			),
		[ apply ]
	);

	const isDirty = isStateDirty( state, baseline );

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

	// A refit after a window resize is not something the person did.
	const adjustCropRectForViewport = useCallback(
		( rect: NormalizedRect ) => {
			apply( { type: 'SET_CROP_RECT', payload: rect }, false );
		},
		[ apply ]
	);

	const minZoom = getMinZoom( state );

	return useMemo(
		() =>
			// The brand is a type-only marker, so the real controller is
			// the one object that carries it.
			( {
				...setters,
				state,
				setImage,
				reset,
				isDirty,
				minZoom,
				maxZoom: MAX_ZOOM,
				maxRotationOffset: MAX_ROTATION_OFFSET,
				getCroppedImage,
				adjustCropRectForViewport,
			} ) as InternalImageEditorController,
		[
			setters,
			state,
			setImage,
			reset,
			isDirty,
			minZoom,
			getCroppedImage,
			adjustCropRectForViewport,
		]
	);
}

/**
 * The controller `useImageEditor` returns: the current state, the
 * changes a person can make, and the limits for building controls.
 */
export interface ImageEditorController {
	readonly [ imageEditorController ]: true;
	/** The current state. */
	readonly state: ImageEditorState;
	/**
	 * Whether the person has changed anything since the clean state: the
	 * state you started from, as the editor settled it before any edit.
	 */
	readonly isDirty: boolean;
	/** The smallest zoom that still covers the crop area. */
	readonly minZoom: number;
	/** The largest zoom. */
	readonly maxZoom: number;
	/** How far, in degrees, fine rotation goes either way of a quarter turn. */
	readonly maxRotationOffset: number;
	/**
	 * Load an image, or clear it with `null`. Replacing or clearing a
	 * loaded image starts fresh, keeping only the locked ratio.
	 */
	setImage: ( image: ImageEditorState[ 'image' ] ) => void;
	/**
	 * Go back to the clean state: the state you started from, as the
	 * editor settled it before the first edit. A ratio locked after that
	 * is an edit, so reset undoes it.
	 */
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
