/**
 * WordPress dependencies
 */
import { createContext, useContext, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useSaveImage from './use-save-image';

const ImageEditingContext = createContext( {} );
ImageEditingContext.displayName = 'ImageEditingContext';

export const useImageEditingContext = () => useContext( ImageEditingContext );

export default function ImageEditingProvider( {
	id,
	url,
	onFinishEditing,
	onSaveImage,
	children,
} ) {
	const saveImage = useSaveImage( {
		id,
		url,
		onSaveImage,
		onFinishEditing,
	} );

	const providerValue = useMemo(
		() => ( {
			...saveImage,
		} ),
		[ saveImage ]
	);

	return (
		<ImageEditingContext.Provider value={ providerValue }>
			{ children }
		</ImageEditingContext.Provider>
	);
}
