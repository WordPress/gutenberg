import { __ } from '@wordpress/i18n';
import { ToolbarButton } from '@wordpress/components';
import { fullHeight } from '@wordpress/icons';
import type { BlockFullHeightAlignmentControlProps } from './types';
import renderActionIcon from '../../utils/render-action-icon';

function BlockFullHeightAlignmentControl( {
	isActive,
	label = __( 'Full height' ),
	onToggle,
	isDisabled,
}: BlockFullHeightAlignmentControlProps ) {
	return (
		<ToolbarButton
			isActive={ isActive }
			icon={ renderActionIcon( fullHeight ) }
			label={ label }
			onClick={ () => onToggle( ! isActive ) }
			disabled={ isDisabled }
		/>
	);
}

export default BlockFullHeightAlignmentControl;
