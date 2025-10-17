/**
 * WordPress dependencies
 */

import { ToolbarButton } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { rotateRight as rotateRightIcon } from '@wordpress/icons';
import { useImageCropper } from '@wordpress/image-cropper';

/**
 * Internal dependencies
 */
import { useImageEditingContext } from './context';

export default function RotationButton() {
	const { cropperState, setCropperState } = useImageCropper();
	const { rotation } = cropperState;
	const rotateClockwise = () => {
		setCropperState( { rotation: rotation + 90 } );
	};
	return (
		<ToolbarButton
			icon={ rotateRightIcon }
			label={ __( 'Rotate' ) }
			onClick={ rotateClockwise }
			//disabled={ isInProgress }
		/>
	);
}
