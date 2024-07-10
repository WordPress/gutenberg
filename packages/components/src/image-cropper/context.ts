/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';
/**
 * Internal dependencies
 */
import type { useImageCropper } from './hook';

export const ImageCropperContext = createContext<
	ReturnType< typeof useImageCropper >
>( null! );
