/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { useImageCropper } from '@wordpress/image-cropper';

/**
 * Internal dependencies
 */
import { useMediaEditorContext } from '../components/media-editor-provider';

/**
 * Hook for managing image editing state and actions.
 * Combines MediaEditorContext and ImageCropperContext to provide a unified API.
 *
 * @return Object with state and actions for image editing
 */
export default function useImageEditing() {
	const { media, onChange, onSaveImage, isEditingImage, setIsEditingImage } =
		useMediaEditorContext();

	const {
		cropperState,
		setCropperState,
		isDirty,
		reset: resetCropper,
		getCroppedImage,
	} = useImageCropper();

	/**
	 * Starts editing mode.
	 */
	const startEditing = useCallback( () => {
		setIsEditingImage( true );
	}, [ setIsEditingImage ] );

	/**
	 * Saves the edited image.
	 * 1. Gets the cropped image blob URL
	 * 2. Updates media via onChange callback
	 * 3. Optionally calls onSaveImage for server persistence
	 * 4. Exits editing mode
	 */
	const saveEdits = useCallback( async () => {
		if ( ! media?.source_url ) {
			return;
		}

		try {
			// Get the cropped image as a blob URL
			const croppedImageUrl = await getCroppedImage( media.source_url );

			if ( croppedImageUrl && onChange ) {
				// Update the media object with the new image URL
				const updatedMedia = {
					...media,
					source_url: croppedImageUrl,
				};

				// Call onChange to update the media in the parent component
				onChange( updatedMedia );

				// Optionally call onSaveImage for server persistence
				if ( onSaveImage ) {
					await onSaveImage( updatedMedia );
				}
			}

			// Exit editing mode
			setIsEditingImage( false );
		} catch ( error ) {
			// eslint-disable-next-line no-console
			console.error( 'Error saving edited image:', error );
		}
	}, [ media, onChange, onSaveImage, getCroppedImage, setIsEditingImage ] );

	/**
	 * Cancels editing and resets changes.
	 * 1. Resets the cropper state
	 * 2. Exits editing mode
	 */
	const cancelEdits = useCallback( () => {
		resetCropper();
		setIsEditingImage( false );
	}, [ resetCropper, setIsEditingImage ] );

	/**
	 * Sets the zoom level.
	 *
	 * @param zoom - Zoom level (1-5)
	 */
	const setZoom = useCallback(
		( zoom: number ) => {
			setCropperState( { zoom } );
		},
		[ setCropperState ]
	);

	/**
	 * Sets the aspect ratio.
	 *
	 * @param aspectRatio - Aspect ratio value
	 */
	const setAspectRatio = useCallback(
		( aspectRatio: number ) => {
			setCropperState( { aspectRatio } );
		},
		[ setCropperState ]
	);

	/**
	 * Rotates the image by the specified angle.
	 *
	 * @param angle - Rotation angle in degrees
	 */
	const rotate = useCallback(
		( angle: number ) => {
			setCropperState( ( prev ) => ( {
				rotation: prev.rotation + angle,
			} ) );
		},
		[ setCropperState ]
	);

	/**
	 * Flips the image horizontally or vertically.
	 *
	 * @param horizontal - Whether to flip horizontally
	 * @param vertical   - Whether to flip vertically
	 */
	const flip = useCallback(
		( horizontal?: boolean, vertical?: boolean ) => {
			setCropperState( ( prev ) => ( {
				flip: {
					horizontal:
						horizontal !== undefined
							? horizontal
							: prev.flip.horizontal,
					vertical:
						vertical !== undefined ? vertical : prev.flip.vertical,
				},
			} ) );
		},
		[ setCropperState ]
	);

	/**
	 * Resets all transformations to their original state.
	 */
	const reset = useCallback( () => {
		resetCropper();
	}, [ resetCropper ] );

	return {
		// State
		isEditingImage,
		isDirty,
		cropperState,

		// Actions
		startEditing,
		saveEdits,
		cancelEdits,

		// Transform controls
		setZoom,
		setAspectRatio,
		rotate,
		flip,
		reset,
	};
}
