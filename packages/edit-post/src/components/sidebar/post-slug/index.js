/**
 * WordPress dependencies
 */
import { PanelRow } from '@wordpress/components';
import { PostSlug as PostSlugForm, PostSlugCheck } from '@wordpress/editor';

export function PostSlug() {
	return (
		<PostSlugCheck>
			<PanelRow className="edit-post-post-slug">
				<PostSlugForm />
			</PanelRow>
		</PostSlugCheck>
	);
}

export default PostSlug;
