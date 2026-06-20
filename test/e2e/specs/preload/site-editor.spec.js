/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

/**
 * Internal dependencies
 */
const { recordRequests } = require( './record-requests' );

/**
 * Returns the major Chromium version from the browser's user agent, or 0 if
 * not Chromium.
 *
 * @param {import('@playwright/test').Page} page Playwright page object.
 * @return {Promise<number>} Major Chromium version.
 */
async function getChromiumMajorVersion( page ) {
	return page.evaluate( () => {
		const match = window.navigator.userAgent.match( /Chrome\/(\d+)/ );
		return match ? parseInt( match[ 1 ], 10 ) : 0;
	} );
}

test.describe( 'Preload', () => {
	let pageId;

	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
		await requestUtils.resetPreferences();
		const pg = await requestUtils.createPage( {
			content:
				'<!-- wp:heading -->\n<h2 class="wp-block-heading">Hello</h2>\n<!-- /wp:heading -->',
			status: 'publish',
		} );
		pageId = pg.id;
	} );

	test.beforeEach( async ( { page } ) => {
		// These editor-startup request assertions fail in CI after the
		// Playwright upgrade to Chrome for Testing 148/149 (the only change in
		// #78632): on the Document-Isolation-Policy editor screen, startup
		// never reaches `networkidle` and the page is torn down, so the test
		// times out. Skip until the bundled browser is past the affected
		// versions. See https://github.com/WordPress/gutenberg/pull/78632.
		test.skip(
			( await getChromiumMajorVersion( page ) ) >= 148,
			'Document-Isolation-Policy is broken in Chromium 148+'
		);
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPages();
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'Site editor root should fetch a known set of routes during startup', async ( {
		page,
		admin,
	} ) => {
		const { requests, stop } = recordRequests( page );

		await admin.visitSiteEditor();
		await page
			.frameLocator( 'iframe[name="editor-canvas"]' )
			.locator( '[data-block]' )
			.first()
			.waitFor();
		// eslint-disable-next-line playwright/no-networkidle
		await page.waitForLoadState( 'networkidle' );
		stop();

		// `POST /wp/v2/users/me` (preferences persistence) occasionally
		// fires twice within the captured window; the duplicate count
		// isn't stable across runs, so this assertion deduplicates.
		// To do: these should all be removed or preloaded.
		expect( Array.from( new Set( requests ) ).sort() ).toEqual(
			[
				'GET /wp/v2/posts?context=edit&offset=0&order=desc&orderby=date&per_page=10&ignore_sticky=false',
				'GET /wp/v2/template-parts/emptytheme//header?context=edit',
				'OPTIONS /wp/v2/settings',
				'POST /wp/v2/users/me',
			].sort()
		);
	} );

	test( 'Editing a page should fetch a known set of routes during startup', async ( {
		page,
		admin,
	} ) => {
		const { requests, stop } = recordRequests( page );

		await admin.visitAdminPage(
			'site-editor.php',
			`p=%2Fpage&postId=${ pageId }&canvas=edit`
		);
		await page
			.frameLocator( 'iframe[name="editor-canvas"]' )
			.getByRole( 'document', { name: 'Block: Heading' } )
			.filter( { hasText: 'Hello' } )
			.waitFor();
		// eslint-disable-next-line playwright/no-networkidle
		await page.waitForLoadState( 'networkidle' );
		stop();

		// `POST /wp/v2/users/me` (preferences persistence) occasionally
		// fires twice within the captured window; the duplicate count
		// isn't stable across runs, so this assertion deduplicates.
		// To do: these should all be removed or preloaded.
		expect( Array.from( new Set( requests ) ).sort() ).toEqual(
			[
				`GET /wp/v2/comments?context=edit&post=${ pageId }&type=note&status=all&per_page=100`,
				`GET /wp/v2/pages/${ pageId }/autosaves?context=edit`,
				'GET /wp/v2/taxonomies?context=edit',
				'GET /wp/v2/templates/lookup?slug=front-page',
				'GET /wp/v2/types/page?context=edit',
				'GET /wp/v2/users/1?context=view&_fields=id%2Cname',
				'GET /wp/v2/users/me',
				'GET /wp/v2/view-config?kind=postType&name=page',
				'OPTIONS /wp/v2/settings',
				'OPTIONS /wp/v2/templates',
				'POST /wp/v2/users/me',
			].sort()
		);
	} );
} );
