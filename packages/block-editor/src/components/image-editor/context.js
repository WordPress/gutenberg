/**
 * WordPress dependencies
 */
import { createContext, useContext, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useSaveImage from './use-save-image';
import useTransformImage from './use-transform-image';

const ImageEditingContext = createContext( {} );
ImageEditingContext.displayName = 'ImageEditingContext';

export const useImageEditingContext = () => useContext( ImageEditingContext );

export default function ImageEditingProvider( {
	id,
	url,
	naturalWidth,
	naturalHeight,
	onFinishEditing,
	onSaveImage,
	cropToContentBounds,
	children,
} ) {
	const {
		editedUrl,
		setEditedUrl,
		crop,
		zoom,
		setZoom,
		rotation,
		rotateClockwise,
		aspect,
		setAspect,
		defaultAspect,
		applyCropToContent,
		hasCropToContentBounds,
		cropToContentApplied,
	} = useTransformImage( {
		url,
		naturalWidth,
		naturalHeight,
		cropToContentBounds,
	} );

	const saveImage = useSaveImage( {
		id,
		url,
		onSaveImage,
		onFinishEditing,
		editedUrl,
		setEditedUrl,
		crop,
		zoom,
		rotation,
		aspect,
	} );

	const providerValue = useMemo(
		() => ( {
			editedUrl,
			setEditedUrl,
			crop,
			zoom,
			setZoom,
			rotation,
			rotateClockwise,
			aspect,
			setAspect,
			defaultAspect,
			applyCropToContent,
			hasCropToContentBounds,
			cropToContentApplied,
			...saveImage,
		} ),
		[
			editedUrl,
			setEditedUrl,
			crop,
			zoom,
			setZoom,
			rotation,
			rotateClockwise,
			aspect,
			setAspect,
			defaultAspect,
			applyCropToContent,
			hasCropToContentBounds,
			cropToContentApplied,
			saveImage,
		]
	);

	return (
		<ImageEditingContext.Provider value={ providerValue }>
			{ children }
		</ImageEditingContext.Provider>
	);
}
