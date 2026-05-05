/**
 * WordPress dependencies
 */
import {
	createContext,
	useCallback,
	useContext,
	useMemo,
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

interface WorkingImage {
	src: string;
	width: number;
	height: number;
}

export interface ImageEditingSession {
	/** Current source being edited by the image session. */
	workingImage: WorkingImage | null;
	/** Low-level cropper controller. */
	cropper: UseCropperStateReturn;
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

	const workingImage = useMemo< WorkingImage | null >( () => {
		if ( ! cropper.state.image ) {
			return null;
		}
		return {
			src: cropper.state.image.src,
			width: cropper.state.image.naturalWidth,
			height: cropper.state.image.naturalHeight,
		};
	}, [ cropper.state.image ] );

	const buildSaveModifiers = useCallback( () => {
		if ( ! cropper.isDirty || ! cropper.state.image ) {
			return [];
		}
		return buildModifiers( cropper.state, {
			width: cropper.state.image.naturalWidth,
			height: cropper.state.image.naturalHeight,
		} );
	}, [ cropper.isDirty, cropper.state ] );

	const session = useMemo< ImageEditingSession >(
		() => ( {
			workingImage,
			cropper,
			isDirty: cropper.isDirty,
			hasUndo: cropper.hasUndo,
			hasRedo: cropper.hasRedo,
			undo: cropper.undo,
			redo: cropper.redo,
			reset: () => cropper.reset(),
			commitHistory: cropper.commitHistory,
			buildSaveModifiers,
		} ),
		[ cropper, workingImage, buildSaveModifiers ]
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
