/**
 * Internal dependencies
 */
import type { Admin } from './';

interface SiteEditorOptions {
	postId?: string | number;
	postType?: string;
	path?: string;
	canvas?: string;
	activeView?: string;
	showWelcomeGuide?: boolean;
}

/**
 * Visits the Site Editor main page.
 *
 * @param this
 * @param options Options to visit the site editor.
 */
export async function visitSiteEditor(
	this: Admin,
	options: SiteEditorOptions = {}
) {
	const { postId, postType, path, canvas, activeView } = options;
	const query = new URLSearchParams();

	if ( postId ) {
		query.set( 'postId', String( postId ) );
	}
	if ( postType ) {
		query.set( 'postType', postType );
	}
	if ( path ) {
		query.set( 'path', path );
	}
	if ( canvas ) {
		query.set( 'canvas', canvas );
	}
	if ( activeView ) {
		query.set( 'activeView', activeView );
	}

	await this.visitAdminPage( 'site-editor.php', query.toString() );

	if ( ! options.showWelcomeGuide ) {
		await this.editor.setPreferences( 'core/edit-site', {
			welcomeGuide: false,
			welcomeGuideStyles: false,
			welcomeGuidePage: false,
			welcomeGuideTemplate: false,
		} );
	}

	/**
	 * Wait until the editor is loaded. The logic is a copy of the
	 * `waitWhileSiteEditorLoading` function in the `edit-site` package.
	 */
	if ( ! query.size || postId || canvas === 'edit' ) {
		await this.waitForSiteEditor();
	}
}
