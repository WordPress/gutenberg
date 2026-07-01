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

interface CanvasReadyWaitArgs {
	canvasLoaderSelector: string;
	readySelector: string;
	state: 'loading-or-ready' | 'loaded';
}

function isCanvasReadyState( {
	canvasLoaderSelector: loader,
	readySelector: ready,
	state,
}: CanvasReadyWaitArgs ) {
	const isVisibleElement = ( element: Element ) => {
		if ( ! element.getClientRects().length ) {
			return false;
		}
		const style = window.getComputedStyle( element );
		return style.display !== 'none' && style.visibility !== 'hidden';
	};

	const isReadyElement = ( element: Element ) => {
		if ( ! isVisibleElement( element ) ) {
			return false;
		}
		if ( element instanceof HTMLIFrameElement ) {
			return element.contentDocument?.readyState === 'complete';
		}
		return true;
	};

	const hasVisibleLoader = Array.from(
		document.querySelectorAll( loader )
	).some( isVisibleElement );
	const hasReadyCanvas = Array.from(
		document.querySelectorAll( ready )
	).some( isReadyElement );

	return state === 'loading-or-ready'
		? hasVisibleLoader || hasReadyCanvas
		: ! hasVisibleLoader && hasReadyCanvas;
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
	 * @todo This is a workaround for the fact that the editor canvas is seen as
	 * ready and visible before the loading spinner is hidden. Ideally, the
	 * content underneath the loading overlay should be marked inert until the
	 * loading is done.
	 */
	if ( ! query.size || postId || canvas === 'edit' ) {
		const canvasLoaderSelector =
			// Spinner was used instead of the progress bar in an earlier
			// version of the site editor.
			'.edit-site-canvas-loader, .edit-site-canvas-spinner';
		const readySelector = [
			'.edit-site-editor__editor-interface',
			'iframe[src*="wp_site_preview=1"]',
		].join( ', ' );
		// Larger timeout is needed for large entities, like the Large Post HTML
		// fixture that we load for performance tests.
		const canvasLoadTimeout = 60_000;

		// The loader can finish before this helper starts waiting. Wait for
		// either the loader or a ready canvas state, then verify the loader is gone.
		await this.page.waitForFunction(
			isCanvasReadyState,
			{
				canvasLoaderSelector,
				readySelector,
				state: 'loading-or-ready',
			} satisfies CanvasReadyWaitArgs,
			{ timeout: canvasLoadTimeout }
		);

		await this.page.waitForFunction(
			isCanvasReadyState,
			{
				canvasLoaderSelector,
				readySelector,
				state: 'loaded',
			} satisfies CanvasReadyWaitArgs,
			{ timeout: canvasLoadTimeout }
		);
	}
}
