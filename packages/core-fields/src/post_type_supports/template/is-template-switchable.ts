import { store as coreStore } from '@wordpress/core-data';
import type { select as selectFn } from '@wordpress/data';
import { unlock } from '../../lock-unlock';

/**
 * Whether the template of a post can be switched: the front page and the
 * posts page are assigned a template by the reading settings rather than by
 * this field.
 *
 * @param select   The `select` function of a registry.
 * @param postType The post type.
 * @param postId   The post id.
 * @return Whether the template can be switched.
 */
export function isTemplateSwitchable(
	select: typeof selectFn,
	postType: string,
	postId: number | string
): boolean {
	const { getHomePage, getPostsPageId } = unlock( select( coreStore ) );
	const singlePostId = String( postId );
	const isPostsPage = getPostsPageId() === singlePostId;
	const isFrontPage =
		postType === 'page' && getHomePage()?.postId === singlePostId;

	return ! isPostsPage && ! isFrontPage;
}
