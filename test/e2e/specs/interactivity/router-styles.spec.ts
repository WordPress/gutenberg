import { test, expect } from './fixtures';

const COLOR_RED = 'rgb(255, 0, 0)';
const COLOR_GREEN = 'rgb(0, 255, 0)';
const COLOR_BLUE = 'rgb(0, 0, 255)';
const COLOR_WRAPPER = 'rgb(160, 12, 60)';
const COLOR_DYNAMIC = 'rgb(255, 0, 255)';
const COLOR_ASYNC_PRINT = 'rgb(255, 140, 0)';
const COLOR_ASYNC_DATA_MEDIA = 'rgb(0, 128, 128)';
const COLOR_ASYNC_PRELOAD = 'rgb(75, 0, 130)';
const COLOR_ASYNC_PERSIST = 'rgb(0, 100, 0)';
const COLOR_ASYNC_IGNORE = 'rgb(255, 215, 0)';

/**
 * Returns the media the style sheet of the passed `<link>` applies to.
 *
 * The router restores the media of the elements it inserts through the CSSOM,
 * so the `media` attribute is not a reliable source: it keeps the `preload`
 * sentinel that the router set to load the style sheet without applying it.
 *
 * @param element `<link>` element.
 * @return Media of the style sheet, or `undefined` when it is not loaded.
 */
const getEffectiveMedia = ( element: HTMLLinkElement ) =>
	element.sheet?.media.mediaText;

test.describe( 'Router styles', () => {
	test.beforeAll( async ( { interactivityUtils: utils } ) => {
		await utils.activatePlugins();
		const red = await utils.addPostWithBlock(
			'test/router-styles-wrapper',
			{
				alias: 'red',
				innerBlocks: [ [ 'test/router-styles-red' ] ],
			}
		);
		const green = await utils.addPostWithBlock(
			'test/router-styles-wrapper',
			{
				alias: 'green',
				innerBlocks: [ [ 'test/router-styles-green' ] ],
			}
		);
		const blue = await utils.addPostWithBlock(
			'test/router-styles-wrapper',
			{
				alias: 'blue',
				innerBlocks: [ [ 'test/router-styles-blue' ] ],
			}
		);

		const all = await utils.addPostWithBlock(
			'test/router-styles-wrapper',
			{
				alias: 'all',
				innerBlocks: [
					[ 'test/router-styles-red' ],
					[ 'test/router-styles-green' ],
					[ 'test/router-styles-blue' ],
				],
			}
		);

		await utils.addPostWithBlock( 'test/router-styles-wrapper', {
			alias: 'none',
			attributes: { links: { red, green, blue, all } },
		} );

		/*
		 * Pages that contain both the navigation links and one of the blocks
		 * that print a style sheet loaded asynchronously. They are needed to
		 * start a test with a style element that the browser has already
		 * mutated, which only happens on a full page load.
		 */
		await utils.addPostWithBlock( 'test/router-styles-wrapper', {
			alias: 'red with links',
			attributes: { links: { red, green, blue, all } },
			innerBlocks: [ [ 'test/router-styles-red' ] ],
		} );
		await utils.addPostWithBlock( 'test/router-styles-wrapper', {
			alias: 'blue with links',
			attributes: { links: { red, green, blue, all } },
			innerBlocks: [ [ 'test/router-styles-blue' ] ],
		} );
	} );

	test.beforeEach( async ( { page, interactivityUtils: utils } ) => {
		await page.goto( utils.getLink( 'none' ) );
		await expect( page.getByTestId( 'hydrated' ) ).toBeVisible();
	} );

	test.afterAll( async ( { interactivityUtils: utils } ) => {
		await utils.deactivatePlugins();
		await utils.deleteAllPosts();
	} );

	test( 'should add and remove styles from style tags', async ( {
		page,
	} ) => {
		const csn = page.getByTestId( 'client-side navigation' );
		const red = page.getByTestId( 'red' );
		const green = page.getByTestId( 'green' );
		const blue = page.getByTestId( 'blue' );
		const all = page.getByTestId( 'all' );

		await expect( red ).toHaveCSS( 'color', COLOR_WRAPPER );
		await expect( green ).toHaveCSS( 'color', COLOR_WRAPPER );
		await expect( blue ).toHaveCSS( 'color', COLOR_WRAPPER );
		await expect( all ).toHaveCSS( 'color', COLOR_WRAPPER );

		await page.getByTestId( 'link red' ).click();

		// This element disappears when a navigation starts.
		// It should be visible again after a successful navigation.
		await expect( csn ).toBeHidden();
		await expect( csn ).toBeVisible();
		await expect( red ).toHaveCSS( 'color', COLOR_RED );
		await expect( green ).toHaveCSS( 'color', COLOR_WRAPPER );
		await expect( blue ).toHaveCSS( 'color', COLOR_WRAPPER );
		await expect( all ).toHaveCSS( 'color', COLOR_RED );

		await page.getByTestId( 'link green' ).click();

		await expect( csn ).toBeHidden();
		await expect( csn ).toBeVisible();
		await expect( red ).toHaveCSS( 'color', COLOR_WRAPPER );
		await expect( green ).toHaveCSS( 'color', COLOR_GREEN );
		await expect( blue ).toHaveCSS( 'color', COLOR_WRAPPER );
		await expect( all ).toHaveCSS( 'color', COLOR_GREEN );

		await page.getByTestId( 'link blue' ).click();

		await expect( csn ).toBeHidden();
		await expect( csn ).toBeVisible();
		await expect( red ).toHaveCSS( 'color', COLOR_WRAPPER );
		await expect( green ).toHaveCSS( 'color', COLOR_WRAPPER );
		await expect( blue ).toHaveCSS( 'color', COLOR_BLUE );
		await expect( all ).toHaveCSS( 'color', COLOR_BLUE );

		await page.getByTestId( 'link all' ).click();

		await expect( csn ).toBeHidden();
		await expect( csn ).toBeVisible();
		await expect( red ).toHaveCSS( 'color', COLOR_RED );
		await expect( green ).toHaveCSS( 'color', COLOR_GREEN );
		await expect( blue ).toHaveCSS( 'color', COLOR_BLUE );
		await expect( all ).toHaveCSS( 'color', COLOR_BLUE );
	} );

	test( 'should add and remove styles from referenced style sheets', async ( {
		page,
	} ) => {
		const csn = page.getByTestId( 'client-side navigation' );
		const red = page.getByTestId( 'red-from-link' );
		const green = page.getByTestId( 'green-from-link' );
		const blue = page.getByTestId( 'blue-from-link' );
		const all = page.getByTestId( 'all-from-link' );

		await expect( red ).toHaveCSS( 'color', COLOR_WRAPPER );
		await expect( green ).toHaveCSS( 'color', COLOR_WRAPPER );
		await expect( blue ).toHaveCSS( 'color', COLOR_WRAPPER );
		await expect( all ).toHaveCSS( 'color', COLOR_WRAPPER );

		await page.getByTestId( 'link red' ).click();

		// This element disappears when a navigation starts.
		// It should be visible again after a successful navigation.
		await expect( csn ).toBeHidden();
		await expect( csn ).toBeVisible();
		await expect( red ).toHaveCSS( 'color', COLOR_RED );
		await expect( green ).toHaveCSS( 'color', COLOR_WRAPPER );
		await expect( blue ).toHaveCSS( 'color', COLOR_WRAPPER );
		await expect( all ).toHaveCSS( 'color', COLOR_RED );

		await page.getByTestId( 'link green' ).click();

		await expect( csn ).toBeHidden();
		await expect( csn ).toBeVisible();
		await expect( red ).toHaveCSS( 'color', COLOR_WRAPPER );
		await expect( green ).toHaveCSS( 'color', COLOR_GREEN );
		await expect( blue ).toHaveCSS( 'color', COLOR_WRAPPER );
		await expect( all ).toHaveCSS( 'color', COLOR_GREEN );

		await page.getByTestId( 'link blue' ).click();

		await expect( csn ).toBeHidden();
		await expect( csn ).toBeVisible();
		await expect( red ).toHaveCSS( 'color', COLOR_WRAPPER );
		await expect( green ).toHaveCSS( 'color', COLOR_WRAPPER );
		await expect( blue ).toHaveCSS( 'color', COLOR_BLUE );
		await expect( all ).toHaveCSS( 'color', COLOR_BLUE );

		await page.getByTestId( 'link all' ).click();

		await expect( csn ).toBeHidden();
		await expect( csn ).toBeVisible();
		await expect( red ).toHaveCSS( 'color', COLOR_RED );
		await expect( green ).toHaveCSS( 'color', COLOR_GREEN );
		await expect( blue ).toHaveCSS( 'color', COLOR_BLUE );
		await expect( all ).toHaveCSS( 'color', COLOR_BLUE );
	} );

	test( 'should support relative URLs in referenced style sheets', async ( {
		page,
	} ) => {
		const csn = page.getByTestId( 'client-side navigation' );
		const background = page.getByTestId( 'background-from-link' );

		await expect( background ).toHaveScreenshot();

		await page.getByTestId( 'link red' ).click();

		// This element disappears when a navigation starts.
		// It should be visible again after a successful navigation.
		await expect( csn ).toBeHidden();
		await expect( csn ).toBeVisible();
		await expect( background ).toHaveScreenshot();

		await page.getByTestId( 'link green' ).click();

		await expect( csn ).toBeHidden();
		await expect( csn ).toBeVisible();
		await expect( background ).toHaveScreenshot();

		await page.getByTestId( 'link blue' ).click();

		await expect( csn ).toBeHidden();
		await expect( csn ).toBeVisible();
		await expect( background ).toHaveScreenshot();

		await page.getByTestId( 'link all' ).click();

		await expect( csn ).toBeHidden();
		await expect( csn ).toBeVisible();
		await expect( background ).toHaveScreenshot();
	} );

	test( 'should update style tags with modified content', async ( {
		page,
	} ) => {
		const csn = page.getByTestId( 'client-side navigation' );
		const red = page.getByTestId( 'red-from-inline' );
		const green = page.getByTestId( 'green-from-inline' );
		const blue = page.getByTestId( 'blue-from-inline' );
		const all = page.getByTestId( 'all-from-inline' );

		await expect( red ).toHaveCSS( 'color', COLOR_WRAPPER );
		await expect( green ).toHaveCSS( 'color', COLOR_WRAPPER );
		await expect( blue ).toHaveCSS( 'color', COLOR_WRAPPER );
		await expect( all ).toHaveCSS( 'color', COLOR_WRAPPER );

		await page.getByTestId( 'link red' ).click();

		// This element disappears when a navigation starts.
		// It should be visible again after a successful navigation.
		await expect( csn ).toBeHidden();
		await expect( csn ).toBeVisible();
		await expect( red ).toHaveCSS( 'color', COLOR_RED );
		await expect( green ).toHaveCSS( 'color', COLOR_WRAPPER );
		await expect( blue ).toHaveCSS( 'color', COLOR_WRAPPER );
		await expect( all ).toHaveCSS( 'color', COLOR_RED );

		await page.getByTestId( 'link green' ).click();

		await expect( csn ).toBeHidden();
		await expect( csn ).toBeVisible();
		await expect( red ).toHaveCSS( 'color', COLOR_WRAPPER );
		await expect( green ).toHaveCSS( 'color', COLOR_GREEN );
		await expect( blue ).toHaveCSS( 'color', COLOR_WRAPPER );
		await expect( all ).toHaveCSS( 'color', COLOR_GREEN );

		await page.getByTestId( 'link blue' ).click();

		await expect( csn ).toBeHidden();
		await expect( csn ).toBeVisible();
		await expect( red ).toHaveCSS( 'color', COLOR_WRAPPER );
		await expect( green ).toHaveCSS( 'color', COLOR_WRAPPER );
		await expect( blue ).toHaveCSS( 'color', COLOR_BLUE );
		await expect( all ).toHaveCSS( 'color', COLOR_BLUE );

		await page.getByTestId( 'link all' ).click();

		await expect( csn ).toBeHidden();
		await expect( csn ).toBeVisible();
		await expect( red ).toHaveCSS( 'color', COLOR_RED );
		await expect( green ).toHaveCSS( 'color', COLOR_GREEN );
		await expect( blue ).toHaveCSS( 'color', COLOR_BLUE );
		await expect( all ).toHaveCSS( 'color', COLOR_BLUE );
	} );

	test( 'should preserve rule order from referenced style sheets', async ( {
		page,
	} ) => {
		const csn = page.getByTestId( 'client-side navigation' );
		const orderChecker = page.getByTestId( 'order-checker' );

		await expect( orderChecker ).toHaveCSS( 'color', COLOR_GREEN );

		await page.getByTestId( 'link red' ).click();

		// This element disappears when a navigation starts.
		// It should be visible again after a successful navigation.
		await expect( csn ).toBeHidden();
		await expect( csn ).toBeVisible();
		await expect( orderChecker ).toHaveCSS( 'color', COLOR_GREEN );

		await page.getByTestId( 'link green' ).click();

		await expect( csn ).toBeHidden();
		await expect( csn ).toBeVisible();
		await expect( orderChecker ).toHaveCSS( 'color', COLOR_GREEN );

		await page.getByTestId( 'link blue' ).click();

		await expect( csn ).toBeHidden();
		await expect( csn ).toBeVisible();
		await expect( orderChecker ).toHaveCSS( 'color', COLOR_GREEN );

		await page.getByTestId( 'link all' ).click();

		await expect( csn ).toBeHidden();
		await expect( csn ).toBeVisible();
		await expect( orderChecker ).toHaveCSS( 'color', COLOR_GREEN );
	} );

	test( 'should refresh the page when stylesheet loading fails', async ( {
		page,
	} ) => {
		const csn = page.getByTestId( 'client-side navigation' );
		const red = page.getByTestId( 'red-from-link' );
		const redBlock = page.getByTestId( 'red-block' );

		await expect( red ).toHaveCSS( 'color', COLOR_WRAPPER );
		await expect( redBlock ).toBeHidden();

		/*
		 * Set up a route handler to make requests to the red stylesheet fail.
		 * The route handler only aborts the request the first time to simulate
		 * a temporary error. It is later removed at the end of the test.
		 *
		 * This approach uses a variable to determine whether to abort or continue
		 * the request. Other approaches, like removing the route handler during
		 * execution or using the `times` option, proved unreliable and made the
		 * test flaky.
		 */
		let intercepted = false;
		const linkPattern = '**/router-styles-red/style-from-link.css*';
		await page.route( linkPattern, async ( route ) => {
			if ( ! intercepted ) {
				intercepted = true;
				await route.abort( 'failed' );
			} else {
				await route.continue();
			}
		} );

		// Navigate to the page with the Red block
		await page.getByTestId( 'link red' ).click();

		await expect( csn ).toBeHidden();
		await expect( red ).toHaveCSS( 'color', COLOR_RED );
		await expect( redBlock ).toBeVisible();

		await page.unroute( linkPattern );
	} );

	test( 'should not apply preloaded styles in current page', async ( {
		page,
	} ) => {
		const red = page.getByTestId( 'red-from-inline' );
		const green = page.getByTestId( 'green-from-inline' );
		const blue = page.getByTestId( 'blue-from-inline' );
		const all = page.getByTestId( 'all-from-inline' );
		const prefetching = page.getByTestId( 'prefetching' );

		await expect( red ).toHaveCSS( 'color', COLOR_WRAPPER );
		await expect( green ).toHaveCSS( 'color', COLOR_WRAPPER );
		await expect( blue ).toHaveCSS( 'color', COLOR_WRAPPER );
		await expect( all ).toHaveCSS( 'color', COLOR_WRAPPER );

		await page.getByTestId( 'link red' ).hover();
		await expect( prefetching ).toHaveText( 'true' );

		// Wait until the prefetching has finished.
		await expect( prefetching ).toHaveText( 'false' );

		await expect( red ).toHaveCSS( 'color', COLOR_WRAPPER );
		await expect( green ).toHaveCSS( 'color', COLOR_WRAPPER );
		await expect( blue ).toHaveCSS( 'color', COLOR_WRAPPER );
		await expect( all ).toHaveCSS( 'color', COLOR_WRAPPER );
	} );

	test( 'should not cause race conditions during render', async ( {
		page,
	} ) => {
		// Resolve functions for promises that fulfill once the target
		// style is requested and resolved respectively.
		let requestStyle: ( value?: unknown ) => void;
		let resolveStyle: ( value?: unknown ) => void;

		// Promise that will resolve once the target style is intercepted.
		// See the `page.route()` below.
		const styleHasBeenRequested = new Promise(
			( resolve ) => ( requestStyle = resolve )
		);

		// Setup a route handler to intercept a specific style sheet.
		const linkPattern = '**/router-styles-red/style-from-link.css*';
		await page.route( linkPattern, async ( route ) => {
			requestStyle();
			await new Promise( ( resolve ) => ( resolveStyle = resolve ) );
			await route.continue();
		} );

		const csn = page.getByTestId( 'client-side navigation' );
		const red = page.getByTestId( 'red-from-inline' );
		const green = page.getByTestId( 'green-from-inline' );
		const blue = page.getByTestId( 'blue-from-inline' );
		const all = page.getByTestId( 'all-from-inline' );

		await expect( red ).toHaveCSS( 'color', COLOR_WRAPPER );
		await expect( green ).toHaveCSS( 'color', COLOR_WRAPPER );
		await expect( blue ).toHaveCSS( 'color', COLOR_WRAPPER );
		await expect( all ).toHaveCSS( 'color', COLOR_WRAPPER );

		// Hover the red link.
		await page.getByTestId( 'link red' ).hover();

		// Wait until the target style has been requested.
		await styleHasBeenRequested;

		await page.getByTestId( 'link red' ).click();

		// The red style is not ready yet; colors should stay the same.
		await expect( red ).toHaveCSS( 'color', COLOR_WRAPPER );
		await expect( green ).toHaveCSS( 'color', COLOR_WRAPPER );
		await expect( blue ).toHaveCSS( 'color', COLOR_WRAPPER );
		await expect( all ).toHaveCSS( 'color', COLOR_WRAPPER );

		await page.getByTestId( 'link green' ).click();

		await expect( csn ).toBeHidden();
		await expect( csn ).toBeVisible();

		// Colors should change after navigation.
		await expect( red ).toHaveCSS( 'color', COLOR_WRAPPER );
		await expect( green ).toHaveCSS( 'color', COLOR_GREEN );
		await expect( blue ).toHaveCSS( 'color', COLOR_WRAPPER );
		await expect( all ).toHaveCSS( 'color', COLOR_GREEN );

		// Resolve the requested style.
		resolveStyle!();

		await expect( csn ).toBeVisible();

		// Styles should not change.
		await expect( red ).toHaveCSS( 'color', COLOR_WRAPPER );
		await expect( green ).toHaveCSS( 'color', COLOR_GREEN );
		await expect( blue ).toHaveCSS( 'color', COLOR_WRAPPER );
		await expect( all ).toHaveCSS( 'color', COLOR_GREEN );
	} );

	test( 'should respect the original media attribute on initial style sheets', async ( {
		page,
	} ) => {
		const csn = page.getByTestId( 'client-side navigation' );
		const hideOnPrint = page.getByTestId( 'hide-on-print' );

		await expect( hideOnPrint ).toBeVisible();

		await page.getByTestId( 'link red' ).click();

		// This element disappears when a navigation starts.
		// It should be visible again after a successful navigation.
		await expect( csn ).toBeHidden();
		await expect( csn ).toBeVisible();

		// The "hide-on-print" element should remain visible.
		await expect( hideOnPrint ).toBeVisible();
	} );

	test( 'should update styles when navigating to a cached page with force', async ( {
		page,
		request,
		interactivityUtils: utils,
	} ) => {
		const csn = page.getByTestId( 'client-side navigation' );
		const red = page.getByTestId( 'red' );
		const green = page.getByTestId( 'green' );

		// Navigate to "red" to cache the page and populate the
		// internal style cache for the red page URL.
		await page.getByTestId( 'link red' ).click();
		await expect( csn ).toBeHidden();
		await expect( csn ).toBeVisible();
		await expect( red ).toHaveCSS( 'color', COLOR_RED );
		await expect( green ).toHaveCSS( 'color', COLOR_WRAPPER );

		// Navigate to "green" so red styles are removed.
		await page.getByTestId( 'link green' ).click();
		await expect( csn ).toBeHidden();
		await expect( csn ).toBeVisible();

		// Intercept the next fetch to the red page URL and respond
		// with the "all" page HTML instead.
		const redLink = utils.getLink( 'red' );
		const allLink = utils.getLink( 'all' );
		await page.route( redLink, async ( route ) => {
			// Fetch the "all" page HTML to simulate server-side content
			// changes (e.g., new blocks appearing on the page).
			const allPage = await request.fetch( allLink );
			const body = await allPage.body();
			return route.fulfill( { body, contentType: 'text/html' } );
		} );

		// Force-navigate to "red". The response now contains all
		// three color blocks with their styles.
		await page.getByTestId( 'force link red' ).click();
		await expect( csn ).toBeHidden();
		await expect( csn ).toBeVisible();

		// Red and green styles should be present.
		await expect( red ).toHaveCSS( 'color', COLOR_RED );
		await expect( green ).toHaveCSS( 'color', COLOR_GREEN );

		// Unroute previous route handler for "red".
		await page.unroute( redLink );
	} );

	test( 'should preserve dynamically injected styles across navigations', async ( {
		page,
	} ) => {
		const csn = page.getByTestId( 'client-side navigation' );
		const dynamicStyle = page.getByTestId( 'dynamic-style' );
		const dynamicLink = page.getByTestId( 'dynamic-link' );

		// Initially, no dynamic styles have been injected.
		await expect( dynamicStyle ).toHaveCSS( 'color', COLOR_WRAPPER );
		await expect( dynamicLink ).toHaveCSS( 'color', COLOR_WRAPPER );

		// Inject a `style` tag and a `link` tag from the client.
		await page.getByTestId( 'add dynamic styles' ).click();

		await expect( dynamicStyle ).toHaveCSS( 'color', COLOR_DYNAMIC );
		await expect( dynamicLink ).toHaveCSS( 'color', COLOR_DYNAMIC );

		await page.getByTestId( 'link red' ).click();

		// This element disappears when a navigation starts.
		// It should be visible again after a successful navigation.
		await expect( csn ).toBeHidden();
		await expect( csn ).toBeVisible();

		// Styles injected from the client should survive the navigation.
		await expect( dynamicStyle ).toHaveCSS( 'color', COLOR_DYNAMIC );
		await expect( dynamicLink ).toHaveCSS( 'color', COLOR_DYNAMIC );

		await page.getByTestId( 'link all' ).click();

		await expect( csn ).toBeHidden();
		await expect( csn ).toBeVisible();

		// They should also survive subsequent navigations.
		await expect( dynamicStyle ).toHaveCSS( 'color', COLOR_DYNAMIC );
		await expect( dynamicLink ).toHaveCSS( 'color', COLOR_DYNAMIC );
	} );

	test( 'should ignore styles inside noscript elements during navigation', async ( {
		page,
	} ) => {
		const csn = page.getByTestId( 'client-side navigation' );
		const noscriptStyleTest = page.getByTestId( 'noscript-style-test' );

		// Initially the element should not have styling from noscript.
		await expect( noscriptStyleTest ).toHaveCSS( 'color', COLOR_WRAPPER );

		await page.getByTestId( 'link red' ).click();

		// This element disappears when a navigation starts.
		// It should be visible again after a successful navigation.
		await expect( csn ).toBeHidden();
		await expect( csn ).toBeVisible();

		// After navigation, the element should still have the default color
		// and not be affected by styles in noscript elements
		await expect( noscriptStyleTest ).toHaveCSS( 'color', COLOR_WRAPPER );

		await page.getByTestId( 'link all' ).click();

		await expect( csn ).toBeHidden();
		await expect( csn ).toBeVisible();

		// After navigating to the page with all blocks, the element should
		// still maintain its original styling and not be affected by noscript styles
		await expect( noscriptStyleTest ).toHaveCSS( 'color', COLOR_WRAPPER );
	} );

	test( 'should apply style sheets loaded with the print trick', async ( {
		page,
	} ) => {
		const csn = page.getByTestId( 'client-side navigation' );
		const asyncPrint = page.getByTestId( 'async-print' );
		const asyncPrintLink = page.locator(
			'link[href*="style-async-print.css"]'
		);

		// The style sheet is only printed by the red block.
		await expect( asyncPrint ).toHaveCSS( 'color', COLOR_WRAPPER );
		await expect( asyncPrintLink ).toHaveCount( 0 );

		await page.getByTestId( 'link red' ).click();

		// This element disappears when a navigation starts.
		// It should be visible again after a successful navigation.
		await expect( csn ).toBeHidden();
		await expect( csn ).toBeVisible();
		await expect( asyncPrint ).toHaveCSS( 'color', COLOR_ASYNC_PRINT );

		/*
		 * The inline handler of the adopted element runs on load and sets the
		 * media to `all`, which the router captures: no original media is
		 * stashed and the style sheet applies to all media.
		 *
		 * Note that the router restores the media through the CSSOM, so the
		 * `media` attribute keeps the `preload` sentinel.
		 */
		await expect( asyncPrintLink ).toHaveAttribute( 'onload' );
		await expect( asyncPrintLink ).not.toHaveAttribute(
			'data-original-media'
		);
		await expect
			.poll( () => asyncPrintLink.evaluate( getEffectiveMedia ) )
			.toBe( 'all' );

		await page.getByTestId( 'link green' ).click();

		await expect( csn ).toBeHidden();
		await expect( csn ).toBeVisible();
		await expect( asyncPrint ).toHaveCSS( 'color', COLOR_WRAPPER );

		// Second round trip: the element already in the document must match the
		// markup of the freshly fetched page, so it is reused, not duplicated.
		await page.getByTestId( 'link red' ).click();

		await expect( csn ).toBeHidden();
		await expect( csn ).toBeVisible();
		await expect( asyncPrint ).toHaveCSS( 'color', COLOR_ASYNC_PRINT );

		await page.getByTestId( 'link green' ).click();

		await expect( csn ).toBeHidden();
		await expect( csn ).toBeVisible();
		await expect( asyncPrint ).toHaveCSS( 'color', COLOR_WRAPPER );

		await page.getByTestId( 'link red' ).click();

		await expect( csn ).toBeHidden();
		await expect( csn ).toBeVisible();
		await expect( asyncPrint ).toHaveCSS( 'color', COLOR_ASYNC_PRINT );
		await expect( asyncPrintLink ).toHaveCount( 1 );
	} );

	test( 'should not apply preloaded style sheets loaded with the print trick', async ( {
		page,
	} ) => {
		const csn = page.getByTestId( 'client-side navigation' );
		const asyncPrint = page.getByTestId( 'async-print' );
		const asyncPrintLink = page.locator(
			'link[href*="style-async-print.css"]'
		);
		const prefetching = page.getByTestId( 'prefetching' );

		await expect( asyncPrint ).toHaveCSS( 'color', COLOR_WRAPPER );

		await page.getByTestId( 'link red' ).hover();
		await expect( prefetching ).toHaveText( 'true' );

		// Wait until the prefetching has finished. At this point the style
		// sheet has been downloaded, so the inline handler of the original
		// markup would have already applied it to the current page.
		await expect( prefetching ).toHaveText( 'false' );

		await expect( asyncPrintLink ).toHaveAttribute( 'media', 'preload' );
		await expect( asyncPrint ).toHaveCSS( 'color', COLOR_WRAPPER );

		await page.getByTestId( 'link red' ).click();

		await expect( csn ).toBeHidden();
		await expect( csn ).toBeVisible();
		await expect( asyncPrint ).toHaveCSS( 'color', COLOR_ASYNC_PRINT );
	} );

	test( 'should apply style sheets that read the media from a data attribute', async ( {
		page,
	} ) => {
		const csn = page.getByTestId( 'client-side navigation' );
		const asyncDataMedia = page.getByTestId( 'async-data-media' );
		const asyncDataMediaLink = page.locator(
			'link[href*="style-async-data-media.css"]'
		);

		// The style sheet is only printed by the green block.
		await expect( asyncDataMedia ).toHaveCSS( 'color', COLOR_WRAPPER );

		await page.getByTestId( 'link green' ).click();

		await expect( csn ).toBeHidden();
		await expect( csn ).toBeVisible();
		await expect( asyncDataMedia ).toHaveCSS(
			'color',
			COLOR_ASYNC_DATA_MEDIA
		);

		// The media of the applied element is the one the inline handler copied
		// from the data attribute, not its `not all` face value.
		await expect( asyncDataMediaLink ).toHaveCount( 1 );
		await expect( asyncDataMediaLink ).toHaveAttribute(
			'data-media',
			'all'
		);
		await expect( asyncDataMediaLink ).not.toHaveAttribute(
			'data-original-media'
		);
		await expect
			.poll( () => asyncDataMediaLink.evaluate( getEffectiveMedia ) )
			.toBe( 'all' );

		await page.getByTestId( 'link red' ).click();

		await expect( csn ).toBeHidden();
		await expect( csn ).toBeVisible();
		await expect( asyncDataMedia ).toHaveCSS( 'color', COLOR_WRAPPER );

		await page.getByTestId( 'link green' ).click();

		await expect( csn ).toBeHidden();
		await expect( csn ).toBeVisible();
		await expect( asyncDataMedia ).toHaveCSS(
			'color',
			COLOR_ASYNC_DATA_MEDIA
		);
		await expect( asyncDataMediaLink ).toHaveCount( 1 );
	} );

	test( 'should apply preloads that turn themselves into style sheets', async ( {
		page,
	} ) => {
		const csn = page.getByTestId( 'client-side navigation' );
		const asyncPreload = page.getByTestId( 'async-preload' );
		const asyncPreloadLink = page.locator(
			'link[href*="style-async-preload.css"]'
		);

		// The style sheet is only printed by the blue block.
		await expect( asyncPreload ).toHaveCSS( 'color', COLOR_WRAPPER );

		await page.getByTestId( 'link blue' ).click();

		await expect( csn ).toBeHidden();
		await expect( csn ).toBeVisible();
		await expect( asyncPreload ).toHaveCSS( 'color', COLOR_ASYNC_PRELOAD );

		// The router turns the preload into a regular style sheet.
		await expect( asyncPreloadLink ).toHaveAttribute( 'rel', 'stylesheet' );
		await expect( asyncPreloadLink ).not.toHaveAttribute( 'as' );

		await page.getByTestId( 'link red' ).click();

		await expect( csn ).toBeHidden();
		await expect( csn ).toBeVisible();
		await expect( asyncPreload ).toHaveCSS( 'color', COLOR_WRAPPER );

		await page.getByTestId( 'link blue' ).click();

		await expect( csn ).toBeHidden();
		await expect( csn ).toBeVisible();
		await expect( asyncPreload ).toHaveCSS( 'color', COLOR_ASYNC_PRELOAD );
		await expect( asyncPreloadLink ).toHaveCount( 1 );
	} );

	test( 'should reuse style sheets that the browser already mutated', async ( {
		page,
		interactivityUtils: utils,
	} ) => {
		// Full page load, so the inline handler of the print trick runs and
		// mutates the element before the router sees it.
		await page.goto( utils.getLink( 'red with links' ) );
		await expect( page.getByTestId( 'hydrated' ) ).toBeVisible();

		const csn = page.getByTestId( 'client-side navigation' );
		const asyncPrint = page.getByTestId( 'async-print' );
		const asyncPrintLink = page.locator(
			'link[href*="style-async-print.css"]'
		);

		await expect( asyncPrint ).toHaveCSS( 'color', COLOR_ASYNC_PRINT );
		await expect( asyncPrintLink ).toHaveCount( 1 );

		// The "all" page also contains the red block, so the mutated element
		// must match its markup and be kept, without inserting a copy.
		await page.getByTestId( 'link all' ).click();

		await expect( csn ).toBeHidden();
		await expect( csn ).toBeVisible();
		await expect( asyncPrint ).toHaveCSS( 'color', COLOR_ASYNC_PRINT );
		await expect( asyncPrintLink ).toHaveCount( 1 );

		await page.getByTestId( 'link green' ).click();

		await expect( csn ).toBeHidden();
		await expect( csn ).toBeVisible();
		await expect( asyncPrint ).toHaveCSS( 'color', COLOR_WRAPPER );

		await page.getByTestId( 'link all' ).click();

		await expect( csn ).toBeHidden();
		await expect( csn ).toBeVisible();
		await expect( asyncPrint ).toHaveCSS( 'color', COLOR_ASYNC_PRINT );
		await expect( asyncPrintLink ).toHaveCount( 1 );
	} );

	test( 'should reuse preloads that the browser already turned into style sheets', async ( {
		page,
		interactivityUtils: utils,
	} ) => {
		// Full page load, so the inline handler of the preload runs and turns
		// the element into a style sheet before the router sees it.
		await page.goto( utils.getLink( 'blue with links' ) );
		await expect( page.getByTestId( 'hydrated' ) ).toBeVisible();

		const csn = page.getByTestId( 'client-side navigation' );
		const asyncPreload = page.getByTestId( 'async-preload' );
		const asyncPreloadLink = page.locator(
			'link[href*="style-async-preload.css"]'
		);

		await expect( asyncPreload ).toHaveCSS( 'color', COLOR_ASYNC_PRELOAD );
		await expect( asyncPreloadLink ).toHaveCount( 1 );

		// The "all" page also contains the blue block, so the element must
		// remain enabled instead of being disabled and duplicated.
		await page.getByTestId( 'link all' ).click();

		await expect( csn ).toBeHidden();
		await expect( csn ).toBeVisible();
		await expect( asyncPreload ).toHaveCSS( 'color', COLOR_ASYNC_PRELOAD );
		await expect( asyncPreloadLink ).toHaveCount( 1 );

		await page.getByTestId( 'link red' ).click();

		await expect( csn ).toBeHidden();
		await expect( csn ).toBeVisible();
		await expect( asyncPreload ).toHaveCSS( 'color', COLOR_WRAPPER );
	} );

	test( 'should never disable style sheets marked as persistent', async ( {
		page,
	} ) => {
		const csn = page.getByTestId( 'client-side navigation' );
		const asyncPersist = page.getByTestId( 'async-persist' );
		const asyncPreload = page.getByTestId( 'async-preload' );

		// Both style sheets are only printed by the blue block.
		await expect( asyncPersist ).toHaveCSS( 'color', COLOR_WRAPPER );
		await expect( asyncPreload ).toHaveCSS( 'color', COLOR_WRAPPER );

		await page.getByTestId( 'link blue' ).click();

		await expect( csn ).toBeHidden();
		await expect( csn ).toBeVisible();
		await expect( asyncPersist ).toHaveCSS( 'color', COLOR_ASYNC_PERSIST );
		await expect( asyncPreload ).toHaveCSS( 'color', COLOR_ASYNC_PRELOAD );

		await page.getByTestId( 'link red' ).click();

		await expect( csn ).toBeHidden();
		await expect( csn ).toBeVisible();

		// The persistent style sheet is kept, the regular one is disabled.
		await expect( asyncPersist ).toHaveCSS( 'color', COLOR_ASYNC_PERSIST );
		await expect( asyncPreload ).toHaveCSS( 'color', COLOR_WRAPPER );

		await page.getByTestId( 'link green' ).click();

		await expect( csn ).toBeHidden();
		await expect( csn ).toBeVisible();
		await expect( asyncPersist ).toHaveCSS( 'color', COLOR_ASYNC_PERSIST );
		await expect( asyncPreload ).toHaveCSS( 'color', COLOR_WRAPPER );
	} );

	test( 'should not manage style sheets marked to be ignored', async ( {
		page,
	} ) => {
		const csn = page.getByTestId( 'client-side navigation' );
		const asyncIgnore = page.getByTestId( 'async-ignore' );
		const asyncIgnoreLink = page.locator(
			'link[href*="style-async-ignore.css"]'
		);

		// The inline handler applies the style sheet, and the router does not
		// interfere with it.
		await expect( asyncIgnore ).toHaveCSS( 'color', COLOR_ASYNC_IGNORE );
		await expect( asyncIgnoreLink ).toHaveAttribute( 'media', 'all' );

		// The pages the router fetches don't contain this style sheet, so a
		// managed element would be disabled after navigating.
		await page.getByTestId( 'link red' ).click();

		await expect( csn ).toBeHidden();
		await expect( csn ).toBeVisible();
		await expect( asyncIgnore ).toHaveCSS( 'color', COLOR_ASYNC_IGNORE );

		await page.getByTestId( 'link all' ).click();

		await expect( csn ).toBeHidden();
		await expect( csn ).toBeVisible();
		await expect( asyncIgnore ).toHaveCSS( 'color', COLOR_ASYNC_IGNORE );

		// The element is left untouched: it is not duplicated, its media is not
		// replaced with the router's sentinel, and its handler is not stripped.
		await expect( asyncIgnoreLink ).toHaveCount( 1 );
		await expect( asyncIgnoreLink ).toHaveAttribute( 'media', 'all' );
		await expect( asyncIgnoreLink ).toHaveAttribute(
			'onload',
			"this.onload=null;this.media='all'"
		);
		await expect( asyncIgnoreLink ).not.toHaveAttribute(
			'data-original-media'
		);
	} );
} );
