/**
 * Internal dependencies
 */
import { wpDataSelect } from './wp-data-select';

/**
 * Returns a promise which resolves with the edited post content (HTML string).
 *
 * @return {Promise} Promise resolving with post content markup.
 */
export async function getEditedPostContent() {
	return wpDataSelect('core/editor', 'getEditedPostContent');
}
