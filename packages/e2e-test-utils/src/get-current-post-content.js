/**
 * Internal dependencies
 */
import { wpDataSelect } from './wp-data-select';

/**
 * Returns a promise which resolves with the current post content (HTML string).
 *
 * @return {Promise} Promise resolving with current post content markup.
 */
export async function getCurrentPostContent() {
	const post = await wpDataSelect('core/editor', 'getCurrentPost');
	return post.content;
}
