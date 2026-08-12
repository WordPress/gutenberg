import { type Page } from '@playwright/test';
import { test, expect } from './fixtures';

const COLOR_RED = 'rgb(255, 0, 0)';
const COLOR_GREEN = 'rgb(0, 255, 0)';
const COLOR_WRAPPER = 'rgb(160, 12, 60)';
const COLOR_FROM_LINK = 'rgb(0, 128, 128)';
const COLOR_FROM_INLINE = 'rgb(128, 0, 128)';
const COLOR_INJECTED = 'rgb(12, 34, 56)';
const COLOR_INJECTED_FROM_LINK = 'rgb(0, 100, 200)';

/**
 * Style sheet rendered by the `test/router-styles-managed` block in every page
 * containing it. As it is marked as router-managed, the router is allowed to
 * disable and enable it during client-side navigations.
 */
const MANAGED_LINK_SELECTOR =
	'link[rel="stylesheet"][href*="router-styles-managed/style-from-link.css"]';

/**
 * Injects a `<style>` element in the document, like a script unaware of the
 * router would do.
 *
 * @param page             Playwright page.
 * @param css              Content of the style element.
 * @param options          Injection options.
 * @param options.disabled Whether the associated style sheet should be
 *                         disabled right after the injection.
 */
async function injectStyle(
	page: Page,
	css: string,
	{ disabled = false }: { disabled?: boolean } = {}
) {
	await page.evaluate(
		( { content, isDisabled } ) => {
			const style = window.document.createElement( 'style' );
			style.textContent = content;
			window.document.head.appendChild( style );

			if ( isDisabled ) {
				const { sheet } = style;
				if ( ! sheet ) {
					throw new Error(
						'The injected style element has no style sheet'
					);
				}
				// Disabling the style sheet instead of the element keeps the
				// `sheet` property populated, just like the router does.
				sheet.disabled = true;
			}
		},
		{ content: css, isDisabled: disabled }
	);
}

test.describe( 'Router styles - router-managed style assets', () => {
	test.beforeAll( async ( { interactivityUtils: utils } ) => {
		await utils.activatePlugins();

		const red = await utils.addPostWithBlock(
			'test/router-styles-managed',
			{
				alias: 'managed-red',
				innerBlocks: [ [ 'test/router-styles-red' ] ],
			}
		);
		const green = await utils.addPostWithBlock(
			'test/router-styles-managed',
			{
				alias: 'managed-green',
				innerBlocks: [ [ 'test/router-styles-green' ] ],
			}
		);

		// This post uses the wrapper that doesn't mark its style assets, so
		// mixed navigations can be tested.
		const unmarked = await utils.addPostWithBlock(
			'test/router-styles-wrapper',
			{
				alias: 'unmarked',
				attributes: { links: {} },
			}
		);

		await utils.addPostWithBlock( 'test/router-styles-managed', {
			alias: 'managed-none',
			attributes: { links: { red, green, unmarked } },
		} );
	} );

	test.beforeEach( async ( { page, interactivityUtils: utils } ) => {
		await page.goto( utils.getLink( 'managed-none' ) );
		await expect( page.getByTestId( 'hydrated' ) ).toBeVisible();
	} );

	test.afterAll( async ( { interactivityUtils: utils } ) => {
		await utils.deactivatePlugins();
		await utils.deleteAllPosts();
	} );

	test( 'should mark all the server-rendered style assets', async ( {
		page,
	} ) => {
		/*
		 * This test guards the rest of the suite: if the server-side marking
		 * simulated by the test plugin stops working, all the assertions about
		 * client-injected styles would silently pass for the wrong reasons.
		 *
		 * These assertions run before any client-side navigation, so they only
		 * observe what the server rendered. The rest of the suite asserts on
		 * computed styles instead, as the presence of the attribute in the DOM
		 * after a navigation depends on which elements the router reuses.
		 */
		const marked = page.locator(
			'style[data-wp-router-managed], link[rel="stylesheet"][data-wp-router-managed]'
		);
		const unmarked = page.locator(
			'style:not([data-wp-router-managed]), link[rel="stylesheet"]:not([data-wp-router-managed])'
		);

		await expect( marked ).not.toHaveCount( 0 );
		await expect( unmarked ).toHaveCount( 0 );

		// The style assets of the block under test are marked as well.
		await expect( page.locator( MANAGED_LINK_SELECTOR ) ).toHaveAttribute(
			'data-wp-router-managed',
			''
		);
	} );

	test( 'should add and remove marked styles during navigation', async ( {
		page,
	} ) => {
		const csn = page.getByTestId( 'client-side navigation' );
		const red = page.getByTestId( 'red' );
		const green = page.getByTestId( 'green' );
		const fromLink = page.getByTestId( 'managed-from-link' );
		const fromInline = page.getByTestId( 'managed-from-inline' );

		await expect( red ).toHaveCSS( 'color', COLOR_WRAPPER );
		await expect( green ).toHaveCSS( 'color', COLOR_WRAPPER );
		await expect( fromLink ).toHaveCSS( 'color', COLOR_FROM_LINK );
		await expect( fromInline ).toHaveCSS( 'color', COLOR_FROM_INLINE );

		await page.getByTestId( 'link red' ).click();

		// This element disappears when a navigation starts.
		// It should be visible again after a successful navigation.
		await expect( csn ).toBeHidden();
		await expect( csn ).toBeVisible();
		await expect( red ).toHaveCSS( 'color', COLOR_RED );
		await expect( green ).toHaveCSS( 'color', COLOR_WRAPPER );

		await page.getByTestId( 'link green' ).click();

		await expect( csn ).toBeHidden();
		await expect( csn ).toBeVisible();
		await expect( red ).toHaveCSS( 'color', COLOR_WRAPPER );
		await expect( green ).toHaveCSS( 'color', COLOR_GREEN );

		// The styles of the block itself are present in all the pages, so they
		// should remain applied.
		await expect( fromLink ).toHaveCSS( 'color', COLOR_FROM_LINK );
		await expect( fromInline ).toHaveCSS( 'color', COLOR_FROM_INLINE );
	} );

	test( 'should preserve styles injected by the client', async ( {
		page,
	} ) => {
		const csn = page.getByTestId( 'client-side navigation' );
		const injected = page.getByTestId( 'injected' );
		const injectedFromLink = page.getByTestId( 'injected-from-link' );

		await expect( injected ).toHaveCSS( 'color', COLOR_WRAPPER );
		await expect( injectedFromLink ).toHaveCSS( 'color', COLOR_WRAPPER );

		// Inject a style element and a referenced style sheet, as a script
		// unaware of the router would do.
		await injectStyle(
			page,
			`.injected-target { color: ${ COLOR_INJECTED }; }`
		);

		const href = await page
			.getByTestId( 'injected-style-sheet' )
			.getAttribute( 'data-url' );

		await page.evaluate( ( url ) => {
			const link = window.document.createElement( 'link' );
			link.rel = 'stylesheet';
			link.href = url;
			window.document.head.appendChild( link );
		}, href as string );

		await expect( injected ).toHaveCSS( 'color', COLOR_INJECTED );
		await expect( injectedFromLink ).toHaveCSS(
			'color',
			COLOR_INJECTED_FROM_LINK
		);

		await page.getByTestId( 'link red' ).click();

		await expect( csn ).toBeHidden();
		await expect( csn ).toBeVisible();

		// The injected styles are not managed by the router, so they should
		// remain applied.
		await expect( injected ).toHaveCSS( 'color', COLOR_INJECTED );
		await expect( injectedFromLink ).toHaveCSS(
			'color',
			COLOR_INJECTED_FROM_LINK
		);

		// Navigate back to a page without the red block.
		await page.getByTestId( 'link green' ).click();

		await expect( csn ).toBeHidden();
		await expect( csn ).toBeVisible();

		await expect( injected ).toHaveCSS( 'color', COLOR_INJECTED );
		await expect( injectedFromLink ).toHaveCSS(
			'color',
			COLOR_INJECTED_FROM_LINK
		);
	} );

	test( 'should not enable disabled styles injected by the client', async ( {
		page,
	} ) => {
		const csn = page.getByTestId( 'client-side navigation' );
		const injected = page.getByTestId( 'injected' );

		await injectStyle(
			page,
			`.injected-target { color: ${ COLOR_INJECTED }; }`,
			{ disabled: true }
		);

		await expect( injected ).toHaveCSS( 'color', COLOR_WRAPPER );

		await page.getByTestId( 'link red' ).click();

		await expect( csn ).toBeHidden();
		await expect( csn ).toBeVisible();

		// The injected style is still disabled, so it should not be applied.
		await expect( injected ).toHaveCSS( 'color', COLOR_WRAPPER );
	} );

	test( 'should not enable marked styles disabled by the client', async ( {
		page,
	} ) => {
		const csn = page.getByTestId( 'client-side navigation' );
		const fromLink = page.getByTestId( 'managed-from-link' );

		// Ensure the style sheet is loaded and applied before disabling it.
		await expect( fromLink ).toHaveCSS( 'color', COLOR_FROM_LINK );

		await page.evaluate( ( selector ) => {
			const link =
				window.document.querySelector< HTMLLinkElement >( selector );
			const sheet = link?.sheet;
			if ( ! sheet ) {
				throw new Error(
					`No loaded style sheet found for '${ selector }'`
				);
			}
			// Disabling the style sheet instead of the element keeps the
			// `sheet` property populated, just like the router does.
			sheet.disabled = true;
		}, MANAGED_LINK_SELECTOR );

		await expect( fromLink ).toHaveCSS( 'color', COLOR_WRAPPER );

		/*
		 * The target pages also contain this style sheet, so the router
		 * considers it part of the styles that should be applied. It should
		 * not be enabled, though, because it was not the router who disabled
		 * it.
		 */
		await page.getByTestId( 'link red' ).click();

		await expect( csn ).toBeHidden();
		await expect( csn ).toBeVisible();
		await expect( fromLink ).toHaveCSS( 'color', COLOR_WRAPPER );

		await page.getByTestId( 'link green' ).click();

		await expect( csn ).toBeHidden();
		await expect( csn ).toBeVisible();
		await expect( fromLink ).toHaveCSS( 'color', COLOR_WRAPPER );
	} );

	test( 'should preserve injected styles when navigating to unmarked pages', async ( {
		page,
	} ) => {
		const csn = page.getByTestId( 'client-side navigation' );
		const injected = page.getByTestId( 'injected' );
		const fromLink = page.getByTestId( 'managed-from-link' );

		await injectStyle(
			page,
			`.injected-target { color: ${ COLOR_INJECTED }; }`
		);

		await expect( injected ).toHaveCSS( 'color', COLOR_INJECTED );
		await expect( fromLink ).toHaveCSS( 'color', COLOR_FROM_LINK );

		// This page is rendered by a block that doesn't mark its style assets.
		// The mode is fixed at initialization, so the injected style should
		// still be preserved.
		await page.getByTestId( 'link unmarked' ).click();

		await expect( csn ).toBeHidden();
		await expect( csn ).toBeVisible();
		await expect( injected ).toHaveCSS( 'color', COLOR_INJECTED );

		/*
		 * The target page doesn't contain the style assets of the marked
		 * block, so the router should have disabled them. Only the styles
		 * injected by the client are preserved.
		 */
		await expect( fromLink ).not.toHaveCSS( 'color', COLOR_FROM_LINK );
	} );
} );
