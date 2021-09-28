/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ToolbarButton } from '@wordpress/components';
import { fullscreen } from '@wordpress/icons';

function BlockFullHeightAlignmentControl( {
	isActive,
	label = __( 'Toggle full height' ),
	onToggle,
	isDisabled,
} ) {
	return (
		<ToolbarButton
			isActive={ isActive }
			icon={ fullscreen }
			label={ label }
			onClick={ () => onToggle( ! isActive ) }
			disabled={ isDisabled }
		/>
	);
}

export default BlockFullHeightAlignmentControl;
