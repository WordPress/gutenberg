/**
 * Internal dependencies
 */
import type { Admin } from './';

interface SiteEditorOptions {
	postId?: string | number;
	postType?: string;
	path?: string;
	canvas?: string;
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
	const { postId, postType, path, canvas } = options;
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

	const canvasLoader = this.page.locator(
		// Spinner was used instead of the progress bar in an earlier version of
		// the site editor.
		'.edit-site-canvas-loader, .edit-site-canvas-spinner'
	);

	await this.visitAdminPage( 'site-editor.php', query.toString() );

	// Try waiting for the canvas loader to appear first, so that the locator
	// that waits for it to disappear doesn't resolve prematurely.
	await canvasLoader.waitFor().catch( () => {} );

	/**
	 * @todo This is a workaround for the fact that the editor canvas is seen as
	 * ready and visible before the loading spinner is hidden. Ideally, the
	 * content underneath the loading overlay should be marked inert until the
	 * loading is done.
	 */
	await canvasLoader.waitFor( {
		state: 'hidden',
		// Bigger timeout is needed for larger entities, like the Large Post
		// HTML fixture that we load for performance tests, which often doesn't
		// make it under the default timeout value.
		timeout: 60_000,
	} );

	if ( ! options.showWelcomeGuide ) {
		await this.editor.setPreferences( 'core/edit-site', {
			welcomeGuide: false,
			welcomeGuideStyles: false,
			welcomeGuidePage: false,
			welcomeGuideTemplate: false,
		} );
	}
}
