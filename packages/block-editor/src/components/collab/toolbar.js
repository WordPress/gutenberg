/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { collabComment } from '@wordpress/icons';
const openCollabBoard = () => {};

export default function BlockCommentToolbar( {} ) {
	return (
		<>
			<ToolbarGroup className="block-editor-block-comment-toolbar">
				<ToolbarButton
					accessibleWhenDisabled
					onClick={ openCollabBoard }
					icon={ collabComment }
					label={ __( 'Comment' ) }
				/>
			</ToolbarGroup>
		</>
	);
}
