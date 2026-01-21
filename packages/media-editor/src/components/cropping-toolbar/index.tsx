/**
 * WordPress dependencies
 */
import { ToolbarGroup, ToolbarButton } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	rotateLeft,
	rotateRight,
	flipHorizontal,
	flipVertical,
} from '@wordpress/icons';
import { useImageCropper } from '@wordpress/image-cropper';

/**
 * CroppingToolbar component provides a compact horizontal toolbar layout
 * for image editing controls. Alternative to CroppingPanel for toolbar scenarios.
 */
export default function CroppingToolbar() {
	const { cropperState, setCropperState } = useImageCropper();
	const { rotation, flip } = cropperState;

	const handleRotateLeft = () => {
		setCropperState( { rotation: rotation - 90 } );
	};

	const handleRotateRight = () => {
		setCropperState( { rotation: rotation + 90 } );
	};

	const handleFlipHorizontal = () => {
		setCropperState( {
			flip: {
				...flip,
				horizontal: ! flip.horizontal,
			},
		} );
	};

	const handleFlipVertical = () => {
		setCropperState( {
			flip: {
				...flip,
				vertical: ! flip.vertical,
			},
		} );
	};

	return (
		<div className="media-editor-cropping-toolbar">
			<ToolbarGroup>
				<ToolbarButton
					icon={ rotateLeft }
					label={ __( 'Rotate left' ) }
					onClick={ handleRotateLeft }
				/>
				<ToolbarButton
					icon={ rotateRight }
					label={ __( 'Rotate right' ) }
					onClick={ handleRotateRight }
				/>
				<ToolbarButton
					icon={ flipHorizontal }
					label={ __( 'Flip horizontal' ) }
					onClick={ handleFlipHorizontal }
					isPressed={ flip.horizontal }
				/>
				<ToolbarButton
					icon={ flipVertical }
					label={ __( 'Flip vertical' ) }
					onClick={ handleFlipVertical }
					isPressed={ flip.vertical }
				/>
			</ToolbarGroup>
		</div>
	);
}
