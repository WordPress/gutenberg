/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ToolbarGroup, ToolbarButton } from '@wordpress/components';
import { fullscreen } from '@wordpress/icons';

function BlockFullHeightAlignmentToolbar( {
	isActive,
	label = __( 'Toggle full height' ),
	onToggle,
	isDisabled,
} ) {
	return (
		<ToolbarGroup>
			<ToolbarButton
				isActive={ isActive }
				icon={ fullscreen }
				label={ label }
				onClick={ () => onToggle( ! isActive ) }
				disabled={ isDisabled }
			/>
		</ToolbarGroup>
	);
}

export default BlockFullHeightAlignmentToolbar;
