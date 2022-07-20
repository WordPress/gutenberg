/**
 * WordPress dependencies
 */
import { __experimentalToolsPanelItem as ToolsPanelItem } from '@wordpress/components';
import {
	PostFormat as PostFormatForm,
	PostFormatCheck,
} from '@wordpress/editor';
import { __ } from '@wordpress/i18n';

export function PostFormat() {
	return (
		<PostFormatCheck>
			<ToolsPanelItem
				className="edit-post-post-format"
				label={ __( 'Post format' ) }
			>
				<PostFormatForm />
			</ToolsPanelItem>
		</PostFormatCheck>
	);
}

export default PostFormat;
