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
 * Returns whether the editor canvas is loaded in the given state.
 *
 * When the editor canvas loads, there are races with the loading spinner
 * and with the test assertions. This function examines the combination of
 * the canvas and the loading spinner to determine the loading state, and
 * indicates if it matches the requested state.
 *
 * @param state 'loading-or-ready' will match once the editor has started
 *              to load as well as once it has fully loaded. 'loaded' only
 *              matches once the spinner is gone and the canvas is visible.
 * @return Whether the given state matches the current editor canvas loading state.
 */
function isCanvasReadyState( state: 'loading-or-ready' | 'loaded' ): boolean {
	// Spinner was used instead of the progress bar in an earlier
	// version of the site editor.
	const loader = '.edit-site-canvas-loader, .edit-site-canvas-spinner';
	const ready =
		'.edit-site-editor__editor-interface, iframe[src*="wp_site_preview=1"]';

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

	return hasVisibleLoader ? 'loading-or-ready' === state : hasReadyCanvas;
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

	/*
	 * It’s necessary here to wait not only until the editor canvas has loaded,
	 * but also until the loading spinner is hidden. Ideally, the content underneath
	 * the loading overlay should be marked inert until the loading is done.
	 */
	if ( ! query.size || postId || canvas === 'edit' ) {
		// Larger timeout is needed for large entities, like the Large Post HTML
		// fixture that we load for performance tests.
		const canvasLoadTimeout = 60_000;

		// The loader can finish before this helper starts waiting. Wait for
		// either the loader or a ready canvas state, then verify the loader is gone.
		await this.page.waitForFunction(
			isCanvasReadyState,
			'loading-or-ready' as const,
			{ timeout: canvasLoadTimeout }
		);

		await this.page.waitForFunction(
			isCanvasReadyState,
			'loaded' as const,
			{ timeout: canvasLoadTimeout }
		);
	}
}
