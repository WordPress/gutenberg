/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

const COLOR_RED = 'rgb(255, 0, 0)';
const COLOR_GREEN = 'rgb(0, 255, 0)';
const COLOR_BLUE = 'rgb(0, 0, 255)';
const COLOR_WRAPPER = 'rgb(160, 12, 60)';

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

		// Setup a route handler to make requests to the red stylesheet fail.
		// The route handler is removed after navigation to simulate a
		// temporary error.
		const linkPattern = '**/router-styles-red/style-from-link.css*';
		await page.route( linkPattern, async ( route ) => {
			await route.abort( 'failed' );
			await page.unrouteAll( { behavior: 'ignoreErrors' } );
		} );

		// Navigate to the page with the Red block
		await page.getByTestId( 'link red' ).click();

		await expect( csn ).toBeHidden();
		await expect( red ).toHaveCSS( 'color', COLOR_RED );
		await expect( redBlock ).toBeVisible();
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
} );
