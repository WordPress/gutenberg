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
		// These editor-startup request assertions time out in CI starting
		// with the Playwright upgrade to Chrome for Testing 148/149 (#78632).
		// Chrome >= 148 is the first CI browser to support
		// Document-Isolation-Policy, so the editor screen now loads
		// cross-origin isolated; in that mode startup never reaches the
		// (deprecated) `networkidle` state these specs wait on, the page is
		// torn down and the test times out. The exact reason isolation keeps
		// the network busy is not yet root-caused. Skip on the affected
		// browsers until the wait is reworked off `networkidle` or the cause
		// is found. See https://github.com/WordPress/gutenberg/pull/78632.
		test.skip(
			( await getChromiumMajorVersion( page ) ) >= 148,
			'Editor startup never reaches networkidle under cross-origin isolation on Chromium 148+'
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
