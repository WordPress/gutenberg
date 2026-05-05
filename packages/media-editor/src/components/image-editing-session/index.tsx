/**
 * WordPress dependencies
 */
import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState,
} from '@wordpress/element';
import type { ReactNode } from 'react';

/**
 * Internal dependencies
 */
import {
	CropperProvider,
	useCropperState,
	type UseCropperStateReturn,
} from '../../image-editor';
import {
	buildModifiers,
	type Modifier,
} from '../media-editor-modal/build-modifiers';

export interface ImageEditingSessionImage {
	src: string;
	width: number;
	height: number;
}

function areImagesEqual(
	a: ImageEditingSessionImage | null,
	b: ImageEditingSessionImage | null
): boolean {
	return (
		a?.src === b?.src && a?.width === b?.width && a?.height === b?.height
	);
}

export interface ImageEditingSession {
	/** Original image source loaded into the current session. */
	sourceImage: ImageEditingSessionImage | null;
	/** Current image source being edited by the image session. */
	workingImage: ImageEditingSessionImage | null;
	/** Low-level cropper controller. */
	cropper: UseCropperStateReturn;
	/** Replace the source image and reset dependent image edits. */
	setSourceImage: ( image: ImageEditingSessionImage | null ) => void;
	/** Whether the image session has unsaved image edits. */
	isDirty: boolean;
	/** Whether the image session has undo history. */
	hasUndo: boolean;
	/** Whether the image session has redo history. */
	hasRedo: boolean;
	/** Undo the last image session edit. */
	undo: () => void;
	/** Redo the last undone image session edit. */
	redo: () => void;
	/** Reset the current image edits. */
	reset: () => void;
	/** Commit any pending continuous edit to history. */
	commitHistory: () => void;
	/** Build the Core REST media edit modifiers for the current image state. */
	buildSaveModifiers: () => Modifier[];
	/**
	 * Render the current working image to a `Blob`.
	 *
	 * Defaults to lossless PNG. Pass `type: 'image/jpeg'` (or `'image/webp'`)
	 * with an optional `quality` (0–1) to produce a compressed encoding —
	 * useful for AI vision APIs and uploads where bytes matter.
	 *
	 * Rejects when no source image has been loaded.
	 */
	getWorkingImage: ( options?: {
		type?: string;
		quality?: number;
	} ) => Promise< Blob >;
}

const ImageEditingSessionContext = createContext<
	ImageEditingSession | undefined
>( undefined );

export function ImageEditingSessionProvider( {
	children,
}: {
	children: ReactNode;
} ) {
	const cropper = useCropperState();
	const setCropperImage = cropper.setImage;
	const [ sourceImage, setSourceImageState ] =
		useState< ImageEditingSessionImage | null >( null );

	const setSourceImage = useCallback(
		( image: ImageEditingSessionImage | null ) => {
			if ( areImagesEqual( sourceImage, image ) ) {
				return;
			}
			setSourceImageState( image );
			setCropperImage(
				image
					? {
							src: image.src,
							naturalWidth: image.width,
							naturalHeight: image.height,
					  }
					: null
			);
		},
		[ setCropperImage, sourceImage ]
	);

	const workingImage = sourceImage;

	const buildSaveModifiers = useCallback( () => {
		if ( ! cropper.isDirty || ! workingImage ) {
			return [];
		}
		return buildModifiers( cropper.state, {
			width: workingImage.width,
			height: workingImage.height,
		} );
	}, [ cropper.isDirty, cropper.state, workingImage ] );

	const cropperGetCroppedImage = cropper.getCroppedImage;
	const getWorkingImage = useCallback(
		( options?: { type?: string; quality?: number } ): Promise< Blob > => {
			return cropperGetCroppedImage( options?.type, options?.quality );
		},
		[ cropperGetCroppedImage ]
	);

	const session = useMemo< ImageEditingSession >(
		() => ( {
			sourceImage,
			workingImage,
			cropper,
			setSourceImage,
			isDirty: cropper.isDirty,
			hasUndo: cropper.hasUndo,
			hasRedo: cropper.hasRedo,
			undo: cropper.undo,
			redo: cropper.redo,
			reset: () => cropper.reset(),
			commitHistory: cropper.commitHistory,
			buildSaveModifiers,
			getWorkingImage,
		} ),
		[
			cropper,
			setSourceImage,
			sourceImage,
			workingImage,
			buildSaveModifiers,
			getWorkingImage,
		]
	);

	return (
		<ImageEditingSessionContext.Provider value={ session }>
			<CropperProvider value={ cropper }>{ children }</CropperProvider>
		</ImageEditingSessionContext.Provider>
	);
}

export function useImageEditingSession(): ImageEditingSession {
	const context = useContext( ImageEditingSessionContext );
	if ( ! context ) {
		throw new Error(
			'useImageEditingSession must be used within ImageEditingSessionProvider.'
		);
	}
	return context;
}
