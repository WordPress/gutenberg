/**
 * WordPress dependencies
 */
import {
	Button,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalHeading as Heading,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { rotateLeft, rotateRight } from '@wordpress/icons';
import { useImageCropper } from '@wordpress/image-cropper';
import { useCallback } from '@wordpress/element';

/**
 * Checks if a rotation is a quarter turn (90° or 270°).
 *
 * @param rotation - The rotation value to check
 * @return True if the rotation is 90° or 270°
 */
function isQuarterTurn( rotation: number ): boolean {
	const normalized = ( ( rotation % 360 ) + 360 ) % 360;
	return normalized % 180 === 90;
}

/**
 * RotationControl component provides buttons to rotate the image by 90 degrees.
 * Includes rotate left and rotate right buttons with a visual label.
 */
export default function RotationControl() {
	const { cropperState, setCropperState, resetState } = useImageCropper();
	const rotation = cropperState.rotation;

	/**
	 * Checks if the aspect ratio should be flipped during rotation.
	 * If the user is using the natural aspect ratio and hasn't zoomed,
	 * flip the aspect ratio to match the rotated image orientation.
	 */
	const maybeFlipAspectRatio = useCallback(
		( updatedRotation: number ) => {
			if ( ! resetState?.aspectRatio || ! cropperState.mediaSize ) {
				return;
			}

			const original = resetState.aspectRatio;
			const rotated = 1 / original;
			const tolerance = 0.01;

			const matchesOriginal =
				Math.abs( cropperState.aspectRatio - original ) < tolerance;
			const matchesRotated =
				Math.abs( cropperState.aspectRatio - rotated ) < tolerance;

			if (
				cropperState.zoom === 1 &&
				( matchesOriginal || matchesRotated )
			) {
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

	const handleRotateLeft = () => {
		const newRotation = rotation - 90;
		setCropperState( { rotation: newRotation } );
		maybeFlipAspectRatio( newRotation );
	};

	const handleRotateRight = () => {
		const newRotation = rotation + 90;
		setCropperState( { rotation: newRotation } );
		maybeFlipAspectRatio( newRotation );
	};

	return (
		<VStack spacing={ 2 }>
			<Heading
				level={ 3 }
				className="media-editor-rotation-control__heading"
			>
				{ __( 'Rotate' ) }
			</Heading>
			<HStack
				className="media-editor-rotation-control"
				justify="space-between"
				spacing={ 2 }
			>
				<Button
					__next40pxDefaultSize
					variant="secondary"
					icon={ rotateLeft }
					onClick={ handleRotateLeft }
					className="media-editor-rotation-control__button"
				>
					{ __( '90° left' ) }
				</Button>
				<Button
					__next40pxDefaultSize
					variant="secondary"
					icon={ rotateRight }
					onClick={ handleRotateRight }
					className="media-editor-rotation-control__button"
				>
					{ __( '90° right' ) }
				</Button>
			</HStack>
		</VStack>
	);
}
