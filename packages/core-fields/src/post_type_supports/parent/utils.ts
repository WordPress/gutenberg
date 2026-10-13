import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import type { PostWithParent } from './types';

/**
 * A copy of `getTitleWithFallbackName()` of `@wordpress/fields`.
 *
 * @param post The post.
 * @return The decoded title of the post, or its id when it has none.
 */
export function getTitleWithFallbackName( post: PostWithParent ) {
	return typeof post.title === 'object' &&
		'rendered' in post.title &&
		post.title.rendered
		? decodeEntities( post.title.rendered )
		: `#${ post?.id } (${ __( 'no title' ) })`;
}
