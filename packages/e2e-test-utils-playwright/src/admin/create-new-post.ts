import type { Admin } from './';

interface NewPostOptions {
	postType?: string;
	title?: string;
	content?: string;
	excerpt?: string;
	showWelcomeGuide?: boolean;
	fullscreenMode?: boolean;
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
	const query = new URLSearchParams();
	const { postType, title, content, excerpt } = options;

	if ( postType ) {
		query.set( 'post_type', postType );
	}
	if ( title ) {
		query.set( 'post_title', title );
	}
	if ( content ) {
		query.set( 'content', content );
	}
	if ( excerpt ) {
		query.set( 'excerpt', excerpt );
	}

	await this.visitAdminPage( 'post-new.php', query.toString() );

	await this.editor.setPreferences( 'core/edit-post', {
		welcomeGuide: options.showWelcomeGuide ?? false,
		fullscreenMode: options.fullscreenMode ?? false,
	} );

	// Key presses don't wait for the canvas like locators do, so wait until
	// the editor renders into it.
	await this.editor.canvas
		.locator( 'body > *' )
		.first()
		.waitFor( { state: 'attached' } );
}
