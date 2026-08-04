/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

test.describe( 'renderElement', () => {
	test.beforeAll( async ( { interactivityUtils: utils } ) => {
		await utils.activatePlugins();
		// Post B renders the same router region (`test/region`) with server
		// content; post A loads a fragment carrying that region via
		// `renderElement()`, then navigates to B to test the swap.
		const regionUrl = await utils.addPostWithBlock(
			'test/render-element-region',
			{ alias: 'render element - region' }
		);
		await utils.addPostWithBlock( 'test/render-element', {
			alias: 'render element - main',
			attributes: { next: regionUrl },
		} );
	} );

	test.beforeEach( async ( { interactivityUtils: utils, page } ) => {
		await page.goto( utils.getLink( 'render element - main' ) );
	} );

	test.afterAll( async ( { interactivityUtils: utils } ) => {
		await utils.deactivatePlugins();
		await utils.deleteAllPosts();
	} );

	test( 'inserted plain fragment is fully interactive and inherits the island context', async ( {
		page,
	} ) => {
		const counter = page.getByTestId( 'counter' );
		await expect( counter ).toHaveCount( 0 );

		await page.getByTestId( 'load' ).click();

		await expect( counter ).toBeVisible();
		await expect( counter ).toHaveText( '0' );

		// The fragment's counter reads the island's context.
		await counter.click();
		await expect( counter ).toHaveText( '1' );

		await counter.click();
		await expect( counter ).toHaveText( '2' );

		// The island's own element must react to the fragment's write-through.
		await expect( page.getByTestId( 'block-count' ) ).toHaveText( '2' );

		await expect( page.getByTestId( 'hydrated' ) ).toBeVisible();
	} );

	test( 'inserted self-contained island fragment is fully interactive', async ( {
		page,
	} ) => {
		const counter = page.getByTestId( 'island-counter' );
		await expect( counter ).toHaveCount( 0 );

		await page.getByTestId( 'load-island' ).click();

		await expect( counter ).toBeVisible();
		await expect( counter ).toHaveText( '0' );

		// The self-contained fragment has its own context, so it does not
		// affect the enclosing island's context.
		await counter.click();
		await expect( counter ).toHaveText( '1' );
		await expect( page.getByTestId( 'block-count' ) ).toHaveText( '0' );

		await expect( page.getByTestId( 'hydrated' ) ).toBeVisible();
	} );

	test( 'renders a data-wp-each list fragment', async ( { page } ) => {
		const items = page.getByTestId( 'item' );
		await expect( items ).toHaveCount( 0 );

		await page.getByTestId( 'load-list' ).click();

		// The template's items render from `state.items`.
		await expect( items ).toHaveCount( 3 );
		await expect( items.nth( 0 ) ).toHaveText( 'one' );
		await expect( items.nth( 1 ) ).toHaveText( 'two' );
		await expect( items.nth( 2 ) ).toHaveText( 'three' );

		await expect( page.getByTestId( 'hydrated' ) ).toBeVisible();
	} );

	test( 'runs lifecycle directives on inserted fragments', async ( {
		page,
	} ) => {
		await page.getByTestId( 'load-lifecycle' ).click();

		// `data-wp-init` fires on insertion and updates the text.
		await expect( page.getByTestId( 'lifecycle' ) ).toHaveText(
			'initialized'
		);

		await expect( page.getByTestId( 'hydrated' ) ).toBeVisible();
	} );

	test( 're-fetching with fresh server markup replaces the fragment', async ( {
		page,
	} ) => {
		await page.getByTestId( 'load' ).click();
		await expect( page.getByTestId( 'version' ) ).toHaveText( 'version 1' );

		// Reload fetches `?v=2` and replaces the fragment's nodes.
		await page.getByTestId( 'reload' ).click();
		await expect( page.getByTestId( 'version' ) ).toHaveText( 'version 2' );

		// The old fragment's nodes are gone.
		await expect( page.getByTestId( 'counter' ) ).toHaveCount( 0 );
	} );

	test( 'fragment carrying data-wp-router-region is swappable on navigation', async ( {
		page,
	} ) => {
		await page.getByTestId( 'load-region' ).click();
		await expect( page.getByTestId( 'region-fragment' ) ).toHaveText(
			'fragment content'
		);

		// Navigate to the page with the same region ID: the region's content
		// is swapped with the server content.
		await page.getByTestId( 'nav-region' ).click();
		await expect( page.getByTestId( 'region-server' ) ).toHaveText(
			'server content'
		);
		await expect( page.getByTestId( 'region-fragment' ) ).toHaveCount( 0 );
	} );
} );
