/**
 * WordPress dependencies
 */
import { ToolbarGroup, ToolbarButton } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { cog } from '@wordpress/icons';

const SettingsButton = ( { onOpenBlockSettings } ) => {
	return (
		<ToolbarGroup>
			<ToolbarButton
				title={ __( 'Open Settings' ) }
				icon={ cog }
				onClick={ onOpenBlockSettings }
			/>
		</ToolbarGroup>
	);
};

export default SettingsButton;
