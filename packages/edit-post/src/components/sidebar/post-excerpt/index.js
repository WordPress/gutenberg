/**
 * WordPress dependencies
 */
import { PostTypeSupportCheck } from '@wordpress/editor';
import { __experimentalToolsPanelItem as ToolsPanelItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import PostExcerptField from './field';

export default function PostExcerpt() {
	return (
		<PostTypeSupportCheck supportKeys="excerpt">
			<ToolsPanelItem
				className="edit-post-post-excerpt"
				label={ __( 'Excerpt' ) }
				hasValue={ () => true }
			>
				<PostExcerptField />
			</ToolsPanelItem>
		</PostTypeSupportCheck>
	);
}
