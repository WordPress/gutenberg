import { createContext, useContext, useMemo } from '@wordpress/element';
import useSaveImage from './use-save-image';
import useTransformImage from './use-transform-image';
import type {
	ImageEditingContextValue,
	ImageEditingProviderProps,
} from './types';

// The provider always supplies the value.
const ImageEditingContext = createContext< ImageEditingContextValue >(
	{} as ImageEditingContextValue
);
ImageEditingContext.displayName = 'ImageEditingContext';

export const useImageEditingContext = () => useContext( ImageEditingContext );

export default function ImageEditingProvider( {
	id,
	url,
	naturalWidth,
	naturalHeight,
	onFinishEditing,
	onSaveImage,
	children,
}: ImageEditingProviderProps ) {
	const transformImage = useTransformImage( {
		url,
		naturalWidth,
		naturalHeight,
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
