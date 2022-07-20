/**
 * WordPress dependencies
 */
import { __experimentalToolsPanelItem as ToolsPanelItem } from '@wordpress/components';
import { PostTrash as PostTrashLink, PostTrashCheck } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';

export default function PostTrash() {
	return (
		<PostTrashCheck>
			<ToolsPanelItem
				label={ __( 'Move to trash' ) }
				hasValue={ () => true }
			>
				<PostTrashLink />
			</ToolsPanelItem>
		</PostTrashCheck>
	);
}
