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
 * Whether the run targets the extensible site editor (v2), which lives at
 * `admin.php?page=site-editor-v2` behind the `gutenberg-extensible-site-editor`
 * experiment. Set by `test/e2e/playwright.site-editor-v2.config.ts`.
 */
function isSiteEditorV2() {
	return !! process.env.GUTENBERG_E2E_SITE_EDITOR_V2;
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
	if ( isSiteEditorV2() ) {
		return visitSiteEditorV2.call( this, options );
	}

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

/**
 * Maps the classic site editor's query args onto an extensible site editor
 * route path (the `p` query param of `admin.php?page=site-editor-v2`).
 *
 * Returns `null` for `canvas: 'edit'` without an explicit entity: the classic
 * editor resolves the home template itself in that case, so the caller has to
 * resolve it before it can build an edit route.
 *
 * @param options Options passed to `visitSiteEditor`.
 */
function getSiteEditorV2Route( options: SiteEditorOptions ): string | null {
	const { postId, postType, path, canvas, activeView } = options;

	if ( postType && postId ) {
		const id = encodeURIComponent( String( postId ) );
		// Without `canvas: 'edit'`, a navigation menu opens on its details
		// screen rather than in the editor.
		if ( postType === 'wp_navigation' && canvas !== 'edit' ) {
			return `/navigation/edit/${ id }`;
		}
		return `/types/${ postType }/edit/${ id }`;
	}

	if ( postType === 'wp_template' ) {
		return activeView ? `/templates/list/${ activeView }` : '/templates';
	}
	if ( postType === 'wp_template_part' ) {
		return '/template-parts';
	}
	if ( postType === 'wp_block' ) {
		return activeView ? `/patterns/list/${ activeView }` : '/patterns';
	}
	if ( postType === 'wp_navigation' ) {
		return '/navigation';
	}
	if ( postType ) {
		return `/types/${ postType }`;
	}

	if ( path ) {
		const pathMapping: Record< string, string > = {
			'/wp_template': '/templates',
			'/wp_template_part': '/template-parts',
			'/patterns': '/patterns',
			'/wp_block': '/patterns',
			'/navigation': '/navigation',
			'/page': '/types/page',
		};
		return pathMapping[ path ] ?? path;
	}

	if ( canvas === 'edit' ) {
		return null;
	}

	return '/';
}

/**
 * Visits the extensible site editor (v2), translating the classic site
 * editor's options to the equivalent v2 route.
 *
 * @param this
 * @param options Options to visit the site editor.
 */
async function visitSiteEditorV2( this: Admin, options: SiteEditorOptions ) {
	let route = getSiteEditorV2Route( options );

	const gotoRoute = async ( p: string ) => {
		const query = new URLSearchParams( { page: 'site-editor-v2' } );
		query.set( 'p', p );
		await this.visitAdminPage( 'admin.php', query.toString() );
	};

	if ( route === null ) {
		// `canvas: 'edit'` with no explicit entity. Load the home screen,
		// whose preview resolves the same template the classic editor would
		// open, read the resolution, and jump to that template's edit route.
		await gotoRoute( '/' );
		const resolved = ( await this.page
			.waitForFunction( () => {
				const editorSelect = window.wp?.data?.select( 'core/editor' );
				const currentPostId = editorSelect?.getCurrentPostId();
				if ( ! currentPostId ) {
					return null;
				}
				return {
					postId: String( currentPostId ),
					postType: editorSelect.getCurrentPostType() as string,
				};
			} )
			.then( ( handle ) => handle.jsonValue() ) ) as {
			postId: string;
			postType: string;
		};
		route = `/types/${ resolved.postType }/edit/${ encodeURIComponent(
			resolved.postId
		) }`;
		await gotoRoute( route );
	} else {
		await gotoRoute( route );
	}

	if ( ! options.showWelcomeGuide ) {
		await this.editor.setPreferences( 'core/edit-site', {
			welcomeGuide: false,
			welcomeGuideStyles: false,
			welcomeGuidePage: false,
			welcomeGuideTemplate: false,
		} );
	}

	await this.waitForSiteEditor();

	// The extensible site editor loads the editor bundle lazily. On edit
	// routes, wait until the editor has initialized its blocks, so tests can
	// manipulate the block editor store right away without the editor
	// provider resetting their changes.
	if ( route.includes( '/edit/' ) ) {
		await this.page.waitForFunction(
			() =>
				window.wp?.data
					?.select( 'core/editor' )
					?.__unstableIsEditorReady()
		);
	}

	// The home screen previews the resolved home template through the same
	// lazily loaded editor, so wait until it holds a post before tests read
	// editor state. Classic themes render a plain site preview instead, which
	// counts as ready as soon as its frame exists.
	if ( route === '/' ) {
		await this.page.waitForFunction(
			() =>
				!! window.wp?.data
					?.select( 'core/editor' )
					?.getCurrentPostId() ||
				!! document.querySelector( 'iframe[title="Site Preview"]' )
		);
	}
}
