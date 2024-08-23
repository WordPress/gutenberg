/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { collabComment } from '@wordpress/icons';

export default function BlockCommentToolbar( {} ) {
	return (
		<>
			<ToolbarGroup className="block-editor-block-lock-toolbar">
				<ToolbarButton
					accessibleWhenDisabled
					icon={ collabComment }
					label={ __( 'Comment' ) }
				/>
			</ToolbarGroup>
		</>
	);
}
