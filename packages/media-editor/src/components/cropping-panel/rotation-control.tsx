/**
 * WordPress dependencies
 */
import { Button, __experimentalHStack as HStack } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { rotateLeft, rotateRight } from '@wordpress/icons';
import { useImageCropper } from '@wordpress/image-cropper';

/**
 * RotationControl component provides buttons to rotate the image by 90 degrees.
 * Includes rotate left and rotate right buttons.
 */
export default function RotationControl() {
	const { cropperState, setCropperState } = useImageCropper();
	const rotation = cropperState.rotation;

	const handleRotateLeft = () => {
		setCropperState( { rotation: rotation - 90 } );
	};

	const handleRotateRight = () => {
		setCropperState( { rotation: rotation + 90 } );
	};

	return (
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
	);
}
