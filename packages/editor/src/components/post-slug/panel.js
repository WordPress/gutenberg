/**
 * WordPress dependencies
 */
import { PanelRow } from '@wordpress/components';

/**
 * Internal dependencies
 */
import PostSlugForm from './';
import PostSlugCheck from './check';

export function PostSlug() {
	return (
		<PostSlugCheck>
			<PanelRow className="editor-post-slug">
				<PostSlugForm />
			</PanelRow>
		</PostSlugCheck>
	);
}

export default PostSlug;
