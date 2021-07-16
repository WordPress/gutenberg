/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { BlockControls } from '@wordpress/block-editor';
import { edit } from '@wordpress/icons';

const EmbedControls = ( { showEditButton, switchBackToURLInput } ) => (
	<BlockControls>
		<ToolbarGroup>
			{ showEditButton && (
				<ToolbarButton
					label={ __( 'Edit URL' ) }
					icon={ edit }
					onClick={ switchBackToURLInput }
				/>
			) }
		</ToolbarGroup>
	</BlockControls>
);

export default EmbedControls;
