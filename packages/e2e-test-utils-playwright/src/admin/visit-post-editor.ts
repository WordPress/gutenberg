/**
 * Internal dependencies
 */
import type { Admin } from './';

interface PostEditorOptions {
	postId?: string | number;
	postType?: string;
	title?: string;
	content?: string;
	excerpt?: string;
	showWelcomeGuide?: boolean;
}

/**
 * Creates new post or visits existing post if postId is provided.
 *
 * @param this
 * @param options Options to create or visit post.
 */
export async function visitPostEditor(
	this: Admin,
	options: PostEditorOptions = {}
) {
	const query = new URLSearchParams();
	let adminPage: string;

	if ( options.postId ) {
		const { postId } = options;

		adminPage = 'post.php';

		query.set( 'post', String( postId ) );
		query.set( 'action', 'edit' );
	} else {
		const { postType, title, content, excerpt } = options;

		adminPage = 'post-new.php';

		if ( postType ) query.set( 'post_type', postType );
		if ( title ) query.set( 'post_title', title );
		if ( content ) query.set( 'content', content );
		if ( excerpt ) query.set( 'excerpt', excerpt );
	}

	await this.visitAdminPage( adminPage, query.toString() );

	await this.editor.setPreferences( 'core/edit-post', {
		welcomeGuide: options.showWelcomeGuide ?? false,
		fullscreenMode: false,
	} );
}
