/**
 * Internal dependencies
 */
import type { Editor } from './index';

/**
 * Returns a promise which resolves with the edited post content (HTML string).
 *
 * @param {Editor} this
 *
 * @return {Promise} Promise resolving with post content markup.
 */
export async function getEditedPostContent( this: Editor ) {
	return await this.page.evaluate( () =>
		// @ts-ignore (Reason: wp isn't typed)
		window.wp.data.select( 'core/editor' ).getEditedPostContent()
	);
}
