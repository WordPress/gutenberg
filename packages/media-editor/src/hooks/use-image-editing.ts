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
 * Checks if a rotation is a quarter turn (90° or 270°).
 *
 * @param rotation - The rotation value to check
 * @return True if the rotation is 90° or 270°
 */
function isQuarterTurn( rotation: number ): boolean {
	// Normalize rotation to 0-360 range
	const normalized = ( ( rotation % 360 ) + 360 ) % 360;
	return normalized % 180 === 90;
}

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
		resetState,
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
	 * Checks if the aspect ratio should be flipped during rotation.
	 * If the user is using the natural aspect ratio and hasn't zoomed,
	 * flip the aspect ratio to match the rotated image orientation.
	 *
	 * @param updatedRotation - The new rotation value
	 */
	const maybeFlipAspectRatio = useCallback(
		( updatedRotation: number ) => {
			// Need resetState to get the natural aspect ratio
			if ( ! resetState?.aspectRatio || ! cropperState.mediaSize ) {
				return;
			}

			const original = resetState.aspectRatio;
			const rotated = 1 / original;
			const tolerance = 0.01;

			/*
			 * Only flip the aspect ratio if:
			 * 1. Zoom is still at default (1)
			 * 2. Current aspect ratio matches either the original or rotated natural ratio
			 *    (meaning the user hasn't explicitly chosen a different preset)
			 */
			const matchesOriginal =
				Math.abs( cropperState.aspectRatio - original ) < tolerance;
			const matchesRotated =
				Math.abs( cropperState.aspectRatio - rotated ) < tolerance;

			if (
				cropperState.zoom === 1 &&
				( matchesOriginal || matchesRotated )
			) {
				/*
				 * If rotating to 90° or 270°, use the rotated aspect ratio.
				 * If rotating to 0° or 180°, use the original aspect ratio.
				 * This makes the crop area rotate with the image.
				 */
				const newAspectRatio = isQuarterTurn( updatedRotation )
					? rotated
					: original;

				if (
					Math.abs( newAspectRatio - cropperState.aspectRatio ) >
					tolerance
				) {
					// Reset crop position to center when flipping aspect ratio
					// This prevents unwanted zooming/cropping during rotation
					setCropperState( {
						aspectRatio: newAspectRatio,
						crop: { x: 0, y: 0 },
					} );
				}
			}
		},
		[ cropperState, resetState, setCropperState ]
	);

	/**
	 * Rotates the image by the specified angle.
	 *
	 * @param angle - Rotation angle in degrees
	 */
	const rotate = useCallback(
		( angle: number ) => {
			const newRotation = cropperState.rotation + angle;
			setCropperState( { rotation: newRotation } );
			maybeFlipAspectRatio( newRotation );
		},
		[ cropperState.rotation, setCropperState, maybeFlipAspectRatio ]
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
