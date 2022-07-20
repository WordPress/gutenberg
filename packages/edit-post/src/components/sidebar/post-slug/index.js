/**
 * WordPress dependencies
 */
import { __experimentalToolsPanelItem as ToolsPanelItem } from '@wordpress/components';
import { PostSlug as PostSlugForm, PostSlugCheck } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';

export function PostSlug() {
	return (
		<PostSlugCheck>
			<ToolsPanelItem
				className="edit-post-post-slug"
				label={ __( 'Slug' ) }
				hasValue={ () => true }
			>
				<PostSlugForm />
			</ToolsPanelItem>
		</PostSlugCheck>
	);
}

export default PostSlug;
