/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { ImageCropper as ImageCropperComponent } from '@wordpress/image-cropper';

/**
 * Internal dependencies
 */

interface ImageCropperProps {
	src: string;
	width?: number;
	height?: number;
}

/**
 * ImageCropper component wraps the ImageCropperComponent from @wordpress/image-cropper.
 * Provides consistent styling and integration with media-editor.
 *
 * @param {Object}  props        - Component props
 * @param {string}  props.src    - Source URL of the image to crop
 * @param {number=} props.width  - Optional width for the container
 * @param {number=} props.height - Optional height for the container
 * @return {Element} ImageCropper component
 */
export default function ImageCropper( {
	src,
	width,
	height,
}: ImageCropperProps ) {
	return (
		<div
			className={ clsx( 'media-editor-image-cropper' ) }
			style={ {
				width: width || '100%',
				height: height || 'auto',
			} }
		>
			<ImageCropperComponent src={ src } />
		</div>
	);
}
