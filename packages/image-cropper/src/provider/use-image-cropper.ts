import {
	useCallback,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import {
	areImageEditorStatesEqual,
	createImageEditorState,
	exportImage,
	useImageEditor,
	type ImageEditorState,
} from '@wordpress/image-editor';
import type {
	CropperState,
	ImageCropperContextValue,
	ImageCropperState,
} from '../types';
import { MAX_ZOOM, MIN_ZOOM } from '../constants';
import { normalizeRotation } from '../utils';
import { toCropperState } from './cropper-state';

export const DEFAULT_INITIAL_STATE: Required< ImageCropperState > = {
	crop: {
		x: 0,
		y: 0,
		width: 100,
		height: 100,
	},
	zoom: MIN_ZOOM,
	rotation: 0,
	aspectRatio: 1,
	flip: {
		horizontal: false,
		vertical: false,
	},
};

/**
 * The cropper's state and the functions that change it, built on the
 * image editor. The provider keeps the editor's state here and hands the
 * editor each change, so the reset state and dirtiness can be the
 * cropper's own.
 *
 * @return The context value for consumers, the editor's controller for
 *         the component, and a setter for the zoom cap.
 */
export default function useCropper() {
	const [ editorState, setEditorState ] = useState( () =>
		createImageEditorState( {
			aspectRatio: DEFAULT_INITIAL_STATE.aspectRatio,
		} )
	);
	const [ maxZoom, setMaxZoom ] = useState( MAX_ZOOM );
	const [ resetState, setInternalResetState ] =
		useState< ImageCropperState | null >( null );
	// The editor state `reset` returns to and `isDirty` compares against,
	// once a reset state is set. Without one, the editor's own clean state
	// serves.
	const [ snapshot, setSnapshot ] = useState< ImageEditorState | null >(
		null
	);

	// The latest editor state, so several setters in one event see each
	// other's result and the snapshot is taken from the composed state.
	const latestRef = useRef( editorState );
	useLayoutEffect( () => {
		latestRef.current = editorState;
	}, [ editorState ] );
	// Until the person edits, the snapshot follows the changes they did
	// not make, such as the image loading and the crop fitting to its
	// ratio, as the editor's own clean state does.
	const editedSinceSnapshotRef = useRef( false );

	const onChange = useCallback(
		( next: ImageEditorState, { isEdit }: { isEdit: boolean } ) => {
			latestRef.current = next;
			setEditorState( next );
			if ( isEdit ) {
				editedSinceSnapshotRef.current = true;
			} else if ( ! editedSinceSnapshotRef.current ) {
				setSnapshot( ( current ) => ( current ? next : current ) );
			}
		},
		[]
	);

	const controller = useImageEditor( {
		state: editorState,
		onChange,
		maxZoom,
	} );

	const applyFields = useCallback(
		( fields: Partial< CropperState > ) => {
			if ( fields.rotation !== undefined ) {
				const target = normalizeRotation( fields.rotation );
				const turn = normalizeRotation(
					target - latestRef.current.rotation
				);
				if ( turn % 90 === 0 ) {
					// A whole number of quarter turns goes through the
					// editor's snap, which refits the crop to the largest
					// box of its ratio and turns the pan with the image, as
					// the old cropper did. `setRotation` is for fine angles:
					// it keeps the crop's centre and width instead.
					if ( turn === 270 ) {
						controller.snapRotate90( -1 );
					}
					for ( let i = 0; i < turn / 90 && turn !== 270; i++ ) {
						controller.snapRotate90( 1 );
					}
				} else {
					controller.setRotation( target );
				}
			}
			if ( fields.aspectRatio !== undefined ) {
				controller.setAspectRatio( fields.aspectRatio );
			}
			if ( fields.zoom !== undefined ) {
				controller.setZoom( fields.zoom );
			}
			if ( fields.flip !== undefined ) {
				controller.setFlip( { ...fields.flip } );
			}
			if ( fields.crop !== undefined ) {
				controller.setPan( { x: fields.crop.x, y: fields.crop.y } );
			}
			// `croppedArea`, `croppedAreaPixels` and `mediaSize` are read
			// from the editor's state, so writing them changes nothing.
		},
		[ controller ]
	);

	const setCropperState = useCallback<
		ImageCropperContextValue[ 'setCropperState' ]
	>(
		( newState ) => {
			applyFields(
				typeof newState === 'function'
					? newState( toCropperState( latestRef.current ) )
					: newState
			);
		},
		[ applyFields ]
	);

	const setResetState = useCallback(
		( newResetState: Partial< ImageCropperState > | null = null ) => {
			if ( ! newResetState ) {
				setInternalResetState( null );
				setSnapshot( null );
				controller.reset();
				return;
			}
			const initialState = {
				...DEFAULT_INITIAL_STATE,
				...newResetState,
			};
			setInternalResetState( initialState );
			// Start from the clean state, so the fields a reset state
			// leaves out return to their defaults. Its `crop` is a region
			// of the image, which the editor cannot place yet.
			controller.reset();
			applyFields( {
				rotation: initialState.rotation,
				aspectRatio: initialState.aspectRatio,
				zoom: initialState.zoom,
				flip: initialState.flip,
			} );
			setSnapshot( latestRef.current );
			editedSinceSnapshotRef.current = false;
		},
		[ controller, applyFields ]
	);

	const reset = useCallback( () => {
		if ( ! snapshot ) {
			controller.reset();
			return;
		}
		const next = { ...snapshot, image: latestRef.current.image };
		latestRef.current = next;
		setEditorState( next );
		editedSinceSnapshotRef.current = false;
	}, [ snapshot, controller ] );

	const isDirty = snapshot
		? ! areImageEditorStatesEqual( editorState, snapshot )
		: controller.isDirty;

	const getCroppedImage = useCallback( async () => {
		if ( ! latestRef.current.image ) {
			return null;
		}
		try {
			const blob = await exportImage( latestRef.current, {
				type: 'image/jpeg',
			} );
			return URL.createObjectURL( blob );
		} catch {
			return null;
		}
	}, [] );

	const cropperState = useMemo(
		() => toCropperState( editorState ),
		[ editorState ]
	);

	const contextValue = useMemo< ImageCropperContextValue >(
		() => ( {
			cropperState,
			setCropperState,
			resetState,
			setResetState,
			isDirty,
			reset,
			getCroppedImage,
		} ),
		[
			cropperState,
			setCropperState,
			resetState,
			setResetState,
			isDirty,
			reset,
			getCroppedImage,
		]
	);

	return { contextValue, controller, setMaxZoom };
}
