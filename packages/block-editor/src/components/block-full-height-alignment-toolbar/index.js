/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ToolbarGroup, ToolbarButton } from '@wordpress/components';

/**
 * Internal dependencies
 */
import icon from './icon';

function BlockFullHeightAlignmentToolbar( {
	isActive,
	label = __( 'Full Height' ),
	onToggle,
} ) {
	return (
		<ToolbarGroup>
			<ToolbarButton
				isActive={ isActive }
				icon={ icon }
				label={ label }
				onClick={ () => onToggle( ! isActive ) }
			/>
		</ToolbarGroup>
	);
}

export default BlockFullHeightAlignmentToolbar;
