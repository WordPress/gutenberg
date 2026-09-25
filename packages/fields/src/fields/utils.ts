import type { BasePost } from '../types';

/**
 * Whether the post's `_links` include the given `wp:action-*` relation.
 *
 * A record without `_links` (a bulk edit form has no record) is treated as
 * allowed, so only an explicit absence of the action hides a control.
 *
 * @param item   The post.
 * @param action The link relation, e.g. `wp:action-publish`.
 * @return Whether the action link is present.
 */
export function hasActionLink( item: BasePost, action: string ): boolean {
	if ( ! item._links ) {
		return true;
	}
	return !! item._links[ action ];
}
