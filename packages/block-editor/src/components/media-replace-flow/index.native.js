/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ToolbarGroup, ToolbarButton } from '@wordpress/components';
import { replace } from '@wordpress/icons';

const MediaReplaceFlow = () => {
	return (
		<ToolbarGroup>
			<ToolbarButton
				title={ __( 'Edit audio' ) }
				icon={ replace }
				onClick={ () => {} }
			/>
		</ToolbarGroup>
	);
};

export default MediaReplaceFlow;
