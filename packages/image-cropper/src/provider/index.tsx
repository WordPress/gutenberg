/**
 * WordPress dependencies
 */
import { createContext, useContext, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useCropper from './use-image-cropper';
import type { ImageCropperContextValue } from '../types';
import { MIN_ZOOM } from '../constants';

export const ImageCropperContext = createContext< ImageCropperContextValue >( {
	cropperState: {
		crop: { x: 0, y: 0 },
		croppedArea: { x: 0, y: 0, width: 100, height: 100 },
		croppedAreaPixels: null,
		zoom: MIN_ZOOM,
		rotation: 0,
		aspectRatio: 1,
		flip: { horizontal: false, vertical: false },
		mediaSize: null,
	},
	setCropperState: () => {},
	resetState: null,
	setResetState: () => {},
	isDirty: false,
	reset: () => {},
	getCroppedImage: () => Promise.resolve( null ),
} );

export default function ImageCropperProvider( {
	children,
}: {
	children: React.ReactNode;
} ) {
	const cropperApi = useCropper();
	const contextValue = useMemo( () => {
		return {
			...cropperApi,
		};
	}, [ cropperApi ] );

	return (
		<ImageCropperContext.Provider value={ contextValue }>
			{ children }
		</ImageCropperContext.Provider>
	);
}

export const useImageCropper = () => {
	const context = useContext( ImageCropperContext );
	if ( ! context ) {
		throw new Error( 'Missing ImageCropperContext' );
	}
	return context;
};
