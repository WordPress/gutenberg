/**
 * Internal dependencies
 */
import type { Admin } from '.';

interface EditPostOptions {
	showWelcomeGuide?: boolean;
	fullscreenMode?: boolean;
}

/**
 * Open the post with given ID in the editor.
 *
 * @param this
 * @param postId  Post ID to visit.
 * @param options Editor options for edit post.
 */
export async function editPost(
	this: Admin,
	postId: string | number,
	options: EditPostOptions = {}
) {
	const query = new URLSearchParams();

	query.set( 'post', String( postId ) );
	query.set( 'action', 'edit' );

	await this.visitAdminPage( 'post.php', query.toString() );

	await this.editor.setPreferences( 'core/edit-post', {
		welcomeGuide: options.showWelcomeGuide ?? false,
		fullscreenMode: options.fullscreenMode ?? false,
	} );
}
