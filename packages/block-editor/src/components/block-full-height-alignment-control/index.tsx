import { __ } from '@wordpress/i18n';
import { ToolbarButton } from '@wordpress/components';
import { fullHeight } from '@wordpress/icons';
import type { BlockFullHeightAlignmentControlProps } from './types';

function BlockFullHeightAlignmentControl( {
	isActive,
	label = __( 'Full height' ),
	onToggle,
	isDisabled,
}: BlockFullHeightAlignmentControlProps ) {
	return (
		<ToolbarButton
			isActive={ isActive }
			icon={ fullHeight }
			label={ label }
			onClick={ () => onToggle( ! isActive ) }
			disabled={ isDisabled }
		/>
	);
}

export default BlockFullHeightAlignmentControl;
