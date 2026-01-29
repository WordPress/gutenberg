/**
 * Internal dependencies
 */
import type { Admin } from '.';

/**
 * Open the post with given ID in the editor.
 *
 * @param this
 * @param postId Post ID to visit.
 */
export async function editPost( this: Admin, postId: string | number ) {
	const query = new URLSearchParams();

	query.set( 'post', String( postId ) );
	query.set( 'action', 'edit' );

	await this.visitAdminPage( 'post.php', query.toString() );

	await this.editor.setPreferences( 'core/edit-post', {
		welcomeGuide: false,
		fullscreenMode: false,
	} );
}
