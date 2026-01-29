/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { Spinner } from '@wordpress/components';
import {
	ImageCropper as ImageCropperComponent,
	useImageCropper,
	type MediaSize,
} from '@wordpress/image-cropper';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useMediaEditorContext } from '../media-editor-provider';

const DEFAULT_CONTAINER_STYLE = {
	minHeight: '100%',
	minWidth: '100%',
	maxWidth: '100%',
	maxHeight: '100%',
};

/**
 * MediaEditorCanvas component renders the image cropper when in editing mode.
 * This is a sibling component to MediaPreview and only renders when editing an image.
 *
 * Note: ImageCropperProvider is provided internally by MediaEditorProvider,
 * so both this component and the sidebar controls can access the same cropper state.
 */
export default function MediaEditorCanvas() {
	const { media, isEditingImage } = useMediaEditorContext();
	const { setResetState, isDirty, cropperState, setCropperState } =
		useImageCropper();

	const isLoading = ! media?.source_url;
	const imageUrl = media?.source_url || '';

	/**
	 * Handles the image load event to initialize the cropper with the natural aspect ratio.
	 * Sets the reset state so that the cropper starts with the full image selected.
	 */
	const handleOnLoad = useCallback(
		( loadedMediaSize: MediaSize ) => {
			// If the cropper is already dirty (has been edited), preserve the existing state
			if ( isDirty ) {
				// Restore the current crop position
				setCropperState( { crop: cropperState.crop } );
				return;
			}

			// Set the initial reset state with the natural aspect ratio
			const newResetState = {
				aspectRatio:
					loadedMediaSize.naturalWidth /
					loadedMediaSize.naturalHeight,
				crop: {
					x: 0,
					y: 0,
					width: loadedMediaSize.naturalWidth,
					height: loadedMediaSize.naturalHeight,
				},
				zoom: 1,
				rotation: 0,
				flip: {
					horizontal: false,
					vertical: false,
				},
			};

			setResetState( newResetState );
		},
		[ isDirty, setResetState, cropperState, setCropperState ]
	);

	// Only render when editing an image
	if ( ! isEditingImage || media?.mime_type?.split( '/' )[ 0 ] !== 'image' ) {
		return null;
	}

	return (
		<div
			className={ clsx( 'media-editor-canvas', {
				'is-loading': isLoading,
			} ) }
		>
			{ isLoading ? (
				<div className="media-editor-canvas__spinner">
					<Spinner />
				</div>
			) : (
				<div
					className="media-editor-canvas__crop-area"
					style={ DEFAULT_CONTAINER_STYLE }
				>
					<ImageCropperComponent
						src={ imageUrl }
						onLoad={ handleOnLoad }
					/>
				</div>
			) }
		</div>
	);
}
