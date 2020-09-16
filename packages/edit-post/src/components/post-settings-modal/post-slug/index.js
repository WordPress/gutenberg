/**
 * WordPress dependencies
 */
import { PanelRow } from '@wordpress/components';
import { PostSlug as PostSlugForm, PostSlugCheck } from '@wordpress/editor';

export function PostSlug() {
	return (
		<PostSlugCheck>
			<PanelRow>
				<PostSlugForm />
			</PanelRow>
		</PostSlugCheck>
	);
}

export default PostSlug;
