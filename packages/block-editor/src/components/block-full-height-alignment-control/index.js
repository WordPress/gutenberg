/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ToolbarButton } from '@wordpress/components';
import { fullHeight } from '@wordpress/icons';

function BlockFullHeightAlignmentControl( {
	isActive,
	label = __( 'Full height' ),
	onToggle,
	isDisabled,
} ) {
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
