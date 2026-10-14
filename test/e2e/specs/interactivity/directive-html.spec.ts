import { test, expect } from './fixtures';

test.describe( 'data-wp-html', () => {
	test.beforeAll( async ( { interactivityUtils: utils } ) => {
		await utils.activatePlugins();
		await utils.addPostWithBlock( 'test/directive-html' );
	} );

	test.beforeEach( async ( { interactivityUtils: utils, page } ) => {
		await page.goto( utils.getLink( 'test/directive-html' ) );
	} );

	test.afterAll( async ( { interactivityUtils: utils } ) => {
		await utils.deactivatePlugins();
		await utils.deleteAllPosts();
	} );

	test( 'shows the server-rendered fallback before any HTML is set', async ( {
		page,
	} ) => {
		const el = page.getByTestId( 'show state html' );
		await expect( el.getByTestId( 'fallback' ) ).toBeVisible();
	} );

	test( 'renders trusted HTML from asDangerousHTML()', async ( { page } ) => {
		const el = page.getByTestId( 'show state html' );
		await page.getByTestId( 'set html' ).click();
		await expect( el.getByTestId( 'rendered-strong' ) ).toHaveText(
			'Rendered HTML'
		);
	} );

	test( 'keeps the last rendered HTML when the value becomes untrusted again', async ( {
		page,
	} ) => {
		const el = page.getByTestId( 'show state html' );
		await page.getByTestId( 'set html' ).click();
		await expect( el.getByTestId( 'rendered-strong' ) ).toBeVisible();
		await page.getByTestId( 'set loading' ).click();
		// The previously rendered HTML should still be there.
		await expect( el.getByTestId( 'rendered-strong' ) ).toBeVisible();
	} );

	test( 'does not render a plain string as HTML', async ( { page } ) => {
		const el = page.getByTestId( 'show state html' );
		await page.getByTestId( 'set plain string' ).click();
		await expect( el ).not.toContainText( 'Not rendered' );
		// The fallback should still be visible since a plain string never
		// resolved to trusted HTML.
		await expect( el.getByTestId( 'fallback' ) ).toBeVisible();
	} );

	test( 'should ignore suffixes and unique-ids in the html directive', async ( {
		page,
	} ) => {
		await page.getByTestId( 'set html' ).click();
		await expect(
			page
				.getByTestId( 'ignores suffixes' )
				.getByTestId( 'suffix-fallback' )
		).toBeVisible();
		await expect(
			page
				.getByTestId( 'ignores unique-ids' )
				.getByTestId( 'unique-id-fallback' )
		).toBeVisible();
	} );
} );
