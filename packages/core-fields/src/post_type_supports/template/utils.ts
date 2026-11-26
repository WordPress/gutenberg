import { store as coreStore } from '@wordpress/core-data';
import type { select as selectFunction } from '@wordpress/data';
import { unlock } from '../../lock-unlock';

/**
 * Whether the post is the front page or the posts page, which take their
 * template from the reading settings rather than from this field.
 *
 * @param select   The select function of the registry.
 * @param postType The post type.
 * @param postId   The post id.
 * @return Whether the reading settings assign the template of the post.
 */
export function hasTemplateFromReadingSettings(
	select: typeof selectFunction,
	postType: string,
	postId: number | string
): boolean {
	const { getHomePage, getPostsPageId } = unlock( select( coreStore ) );
	const singlePostId = String( postId );
	const isPostsPage = getPostsPageId() === singlePostId;
	const isFrontPage =
		postType === 'page' && getHomePage()?.postId === singlePostId;
	return isPostsPage || isFrontPage;
}
