/**
 * WordPress dependencies
 */

import { ToolbarButton } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { rotateRight as rotateRightIcon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { useImageEditingContext } from './context';

export default function RotationButton() {
	const { isInProgress, rotateClockwise } = useImageEditingContext();
	return (
		<ToolbarButton
			icon={ rotateRightIcon }
			label={ __( 'Rotate' ) }
			onClick={ rotateClockwise }
			disabled={ isInProgress }
		/>
	);
}
