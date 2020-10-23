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

export const useImageEditingContext = () => useContext( ImageEditingContext );

export default function ImageEditingProvider( {
	id,
	url,
	naturalWidth,
	naturalHeight,
	width,
	height,
	clientWidth,
	onFinishEditing,
	onSaveImage,
	children,
} ) {
	const transformImage = useTransformImage( {
		url,
		naturalWidth,
		naturalHeight,
		width,
		height,
		clientWidth,
	} );

	const saveImage = useSaveImage( {
		id,
		url,
		onSaveImage,
		onFinishEditing,
		...transformImage,
	} );

	const providerValue = useMemo(
		() => ( {
			...transformImage,
			...saveImage,
		} ),
		[ transformImage, saveImage ]
	);

	return (
		<ImageEditingContext.Provider value={ providerValue }>
			{ children }
		</ImageEditingContext.Provider>
	);
}
