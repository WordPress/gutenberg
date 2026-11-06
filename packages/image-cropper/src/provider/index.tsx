import {
	createContext,
	useContext,
	useEffect,
	useMemo,
} from '@wordpress/element';
import deprecated from '@wordpress/deprecated';
import type { ImageEditorController } from '@wordpress/image-editor';
import useCropper from './use-image-cropper';
import type { ImageCropperContextValue } from '../types';
import { MIN_ZOOM } from '../constants';

const DEPRECATION_HINT =
	'Build new croppers on its ImageEditorCanvas and useImageEditor. This package now wraps them and will be removed in a later release.';

/**
 * The notice the provider logs once, in the words `@wordpress/deprecated`
 * puts them in. Tests use it to keep the console quiet.
 */
export const DEPRECATION_MESSAGE = `@wordpress/image-cropper is deprecated. Please use @wordpress/image-editor instead. Note: ${ DEPRECATION_HINT }`;

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

/**
 * What `ImageCropper` needs from the provider and consumers do not: the
 * image editor's controller, and a way to set the zoom cap from its prop.
 */
interface ImageCropperInternals {
	controller: ImageEditorController;
	setMaxZoom: ( maxZoom: number ) => void;
}

const ImageCropperInternalsContext =
	createContext< ImageCropperInternals | null >( null );

export default function ImageCropperProvider( {
	children,
}: {
	children: React.ReactNode;
} ) {
	useEffect( () => {
		deprecated( '@wordpress/image-cropper', {
			alternative: '@wordpress/image-editor',
			hint: DEPRECATION_HINT,
		} );
	}, [] );

	const { contextValue, controller, setMaxZoom } = useCropper();
	const internals = useMemo(
		() => ( { controller, setMaxZoom } ),
		[ controller, setMaxZoom ]
	);

	return (
		<ImageCropperInternalsContext.Provider value={ internals }>
			<ImageCropperContext.Provider value={ contextValue }>
				{ children }
			</ImageCropperContext.Provider>
		</ImageCropperInternalsContext.Provider>
	);
}

export const useImageCropper = () => {
	const context = useContext( ImageCropperContext );
	if ( ! context ) {
		throw new Error( 'Missing ImageCropperContext' );
	}
	return context;
};

export function useImageCropperInternals() {
	const internals = useContext( ImageCropperInternalsContext );
	if ( ! internals ) {
		throw new Error(
			'ImageCropper must be rendered inside ImageCropperProvider.'
		);
	}
	return internals;
}
