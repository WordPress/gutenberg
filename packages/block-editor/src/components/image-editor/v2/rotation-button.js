/**
 * WordPress dependencies
 */

import { ToolbarButton } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { rotateRight as rotateRightIcon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { useImageCropper } from './context';

export default function RotationButton() {
	const { dispatch } = useImageCropper();

	return (
		<ToolbarButton
			icon={ rotateRightIcon }
			label={ __( 'Rotate' ) }
			onClick={ () => {
				dispatch( { type: 'ROTATE_90_DEG' } );
			} }
		/>
	);
}
