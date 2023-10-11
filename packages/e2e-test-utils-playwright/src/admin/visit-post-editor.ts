/**
 * WordPress dependencies
 */
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import type { Admin } from './';

interface PostOptions {
	postId?: string | number;
	showWelcomeGuide?: boolean;
}

/**
 * Creates new post.
 *
 * @param this
 * @param options Options to create new post.
 */
export async function visitPostEditor(
	this: Admin,
	options: PostOptions = {}
) {
	if ( typeof options.postId === 'undefined' ) {
		throw new Error( 'postId is required.' );
	}

	const query = addQueryArgs( '', {
		post: options.postId,
		action: 'edit',
	} ).slice( 1 );

	await this.visitAdminPage( 'post.php', query );

	await this.editor.setPreferences( 'core/edit-post', {
		welcomeGuide: options.showWelcomeGuide ?? false,
		fullscreenMode: false,
	} );
}
