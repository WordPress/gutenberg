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
		await this.page.evaluate( () => {
			const MAX_LOADING_TIME = 10000;
			const MAX_PAUSE_TIME = 100;

			return new Promise< void >( ( resolve ) => {
				let pauseTimeout: ReturnType< typeof setTimeout > | undefined;

				function finish() {
					unsubscribe();
					clearTimeout( pauseTimeout );
					clearTimeout( maxTimeout );
					resolve();
				}

				const maxTimeout = setTimeout( finish, MAX_LOADING_TIME );

				function checkResolving() {
					const isResolving = window.wp.data
						.select( 'core' )
						.hasResolvingSelectors();

					if ( isResolving ) {
						clearTimeout( pauseTimeout );
						pauseTimeout = undefined;
						return;
					}

					if ( ! pauseTimeout ) {
						pauseTimeout = setTimeout( finish, MAX_PAUSE_TIME );
					}
				}

				const unsubscribe = window.wp.data.subscribe(
					checkResolving,
					'core'
				);
				checkResolving();
			} );
		} );
	}
}
