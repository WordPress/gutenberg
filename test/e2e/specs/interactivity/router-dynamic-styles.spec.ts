/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

/**
 * Covers two style-management bugs reported in #76031.
 *
 * Bug A — runtime-activated deferred stylesheets (media="not all" → "all"):
 * WordPress enqueues optional sheets with media="not all" as a load-deferral
 * sentinel. An iAPI store activates such a sheet by mutating link.media to
 * "all". Before this change, areNodesEqual() (isEqualNode) treated the live
 * media="all" element and the server-returned media="not all" element as two
 * different nodes. The SCS algorithm dropped the live element from page.styles
 * and applyStyles() disabled the activated sheet on the next navigation,
 * silently resetting the user's theme.
 *
 * Bug B — dynamically-injected plugin stylesheets:
 * Plugins like Complianz GDPR append <link> elements via
 * document.head.appendChild() — bypassing wp_enqueue_style() and therefore
 * carrying no id attribute. These elements are absent from every server-
 * rendered HTML response, so they never appear in page.styles. Before this
 * change, applyStyles() unconditionally disabled every stylesheet not in
 * page.styles, including plugin-injected ones, with no console errors.
 *
 * The test/router-dynamic-styles block provides both fixtures so the behaviour
 * is deterministic across all browsers and navigation paths.
 */
test.describe( 'Interactivity API router dynamic styles', () => {
	test.beforeAll( async ( { interactivityUtils: utils } ) => {
		await utils.activatePlugins();
		await utils.addPostWithBlock( 'test/router-dynamic-styles', {
			alias: 'router-dynamic-styles-a',
		} );
		await utils.addPostWithBlock( 'test/router-dynamic-styles', {
			alias: 'router-dynamic-styles-b',
		} );
		await utils.addPostWithBlock( 'test/router-dynamic-styles', {
			alias: 'router-dynamic-styles-c',
		} );
	} );

	test.afterAll( async ( { interactivityUtils: utils } ) => {
		await utils.deactivatePlugins();
		await utils.deleteAllPosts();
	} );

	/**
	 * A stylesheet activated at runtime (media="not all" → "all") must
	 * remain active after a forward SPA navigation.
	 *
	 * Flow:
	 * 1. Page A loads — view.js init() injects
	 *    <style id="test-deferred-style" media="not all">.
	 * 2. User clicks "Activate deferred style" — action sets
	 *    link.media = "all" and deferredStyleStatus = "active".
	 * 3. User navigates to page B via the iAPI router.
	 * 4. applyStyles() runs — with the areNodesEqual change the activated
	 *    sheet is recognised as part of the new page's styles and remains
	 *    enabled (sheet.disabled === false).
	 * 5. init() re-checks sheet.disabled and updates deferredStyleStatus.
	 *
	 * Relates to Bug A.
	 */
	test( 'runtime-activated deferred stylesheet survives forward navigation', async ( {
		interactivityUtils: utils,
		page,
	} ) => {
		await page.goto( utils.getLink( 'router-dynamic-styles-a' ) );

		// Deferred style starts inactive (media="not all").
		await expect( page.getByTestId( 'deferred-style-active' ) ).toHaveText(
			'inactive'
		);

		// Activate the deferred sheet (media="not all" → "all").
		await page.getByTestId( 'activate-deferred-style' ).click();
		await expect( page.getByTestId( 'deferred-style-active' ) ).toHaveText(
			'active'
		);

		// Navigate to page B via the iAPI router — the router region
		// intercepts the click and performs a SPA navigation.
		await page.getByTestId( 'nav-to-b' ).click();

		// The activated sheet must remain enabled after navigation.
		await expect( page.getByTestId( 'deferred-style-active' ) ).toHaveText(
			'active'
		);
	} );

	/**
	 * A plugin-injected stylesheet (no id, appended via appendChild) must
	 * survive forward navigation.
	 *
	 * Flow:
	 * 1. Page A loads — view.js init() appends <style> (no id) to <head>.
	 * 2. routerManagedStyles never enrolled this element
	 *    (no id, not present at module init time).
	 * 3. After navigation applyStyles() leaves the element untouched —
	 *    sheet.disabled remains false.
	 *
	 * Relates to Bug B.
	 */
	test( 'plugin-injected stylesheet survives forward navigation', async ( {
		interactivityUtils: utils,
		page,
	} ) => {
		await page.goto( utils.getLink( 'router-dynamic-styles-a' ) );

		// Plugin sheet is active on the initial page.
		await expect( page.getByTestId( 'plugin-style-active' ) ).toHaveText(
			'active'
		);

		// Navigate to page B.
		await page.getByTestId( 'nav-to-b' ).click();

		// Plugin sheet must still be active after navigation.
		await expect( page.getByTestId( 'plugin-style-active' ) ).toHaveText(
			'active'
		);
	} );

	/**
	 * Plugin-injected stylesheet must survive a multi-hop navigation and
	 * a back-navigation to the cached initial page (A→B→C→A).
	 *
	 * On the return to A, page.styles contains the plugin element because
	 * A was cached when doc === window.document (full DOM snapshot). The
	 * element must not be enrolled in routerManagedStyles on that re-visit —
	 * it was never put through the media="preload" cycle, so the enrollment
	 * gate prevents it from being enrolled and disabled on the next
	 * navigation away from A.
	 *
	 * Relates to Bug B and back-navigation regression.
	 */
	test( 'plugin-injected stylesheet survives back-navigation (A→B→C→A)', async ( {
		interactivityUtils: utils,
		page,
	} ) => {
		await page.goto( utils.getLink( 'router-dynamic-styles-a' ) );
		await expect( page.getByTestId( 'plugin-style-active' ) ).toHaveText(
			'active'
		);

		await page.getByTestId( 'nav-to-b' ).click();
		await expect( page.getByTestId( 'plugin-style-active' ) ).toHaveText(
			'active'
		);

		await page.getByTestId( 'nav-to-c' ).click();
		await expect( page.getByTestId( 'plugin-style-active' ) ).toHaveText(
			'active'
		);

		// Back to A (cached page).
		await page.goBack();
		await page.goBack();
		await expect( page.getByTestId( 'plugin-style-active' ) ).toHaveText(
			'active'
		);

		// Navigate away from A once more — plugin sheet must survive.
		await page.getByTestId( 'nav-to-b' ).click();
		await expect( page.getByTestId( 'plugin-style-active' ) ).toHaveText(
			'active'
		);
	} );
} );
