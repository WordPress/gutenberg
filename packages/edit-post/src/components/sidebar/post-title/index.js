/**
 * WordPress dependencies
 */
import { PostTypeSupportCheck } from '@wordpress/editor';
import { __experimentalToolsPanelItem as ToolsPanelItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import PostTitleField from './field';

export default function PostTitle() {
	return (
		<PostTypeSupportCheck supportKeys="title">
			<ToolsPanelItem
				className="edit-post-post-title"
				label={ __( 'Title' ) }
				hasValue={ () => true }
			>
				<PostTitleField />
			</ToolsPanelItem>
		</PostTypeSupportCheck>
	);
}
