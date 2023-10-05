/**
 * WordPress dependencies
 */
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import type { Admin } from './';

interface NewPostOptions {
	postType?: string;
	title?: string;
	content?: string;
	excerpt?: string;
	showWelcomeGuide?: boolean;
}

/**
 * Creates new post.
 *
 * @param this
 * @param options Options to create new post.
 */
export async function createNewPost(
	this: Admin,
	options: NewPostOptions = {}
) {
	const query = addQueryArgs( '', {
		post_type: options.postType,
		post_title: options.title,
		content: options.content,
		excerpt: options.excerpt,
	} ).slice( 1 );

	await this.visitAdminPage( 'post-new.php', query );

	await this.editor.setPreferences( 'core/edit-post', {
		welcomeGuide: options.showWelcomeGuide ?? false,
		fullscreenMode: false,
	} );
}
