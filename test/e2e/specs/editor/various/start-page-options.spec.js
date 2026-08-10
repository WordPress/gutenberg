const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Start page options', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin(
			'gutenberg-test-starter-page-patterns'
		);
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-starter-page-patterns'
		);
	} );

	test( 'shows only the categories with page start patterns and filters the patterns by them', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost( { postType: 'page' } );

		const modal = page.getByRole( 'dialog', { name: 'Choose a pattern' } );
		await expect( modal ).toBeVisible();

		// Only the categories containing page start patterns are listed,
		// together with the synthetic "All" and "Uncategorized" entries. The
		// category of the pattern restricted to posts is not.
		const categoryButtons = modal.locator(
			'.block-editor-block-patterns-explorer__sidebar__categories-list__item'
		);
		await expect( categoryButtons ).toHaveText( [
			'All',
			'Test About',
			'Test Services',
			'Uncategorized',
		] );

		// All page start patterns are shown; the post-only pattern is not.
		const patterns = modal.getByRole( 'option' );
		await expect( patterns ).toHaveText( [
			'About page',
			'Services page',
			'Plain page',
		] );

		// Filter by a category.
		await modal.getByRole( 'button', { name: 'Test About' } ).click();
		await expect( patterns ).toHaveText( [ 'About page' ] );

		// "Uncategorized" lists the patterns without a registered category.
		await modal.getByRole( 'button', { name: 'Uncategorized' } ).click();
		await expect( patterns ).toHaveText( [ 'Plain page' ] );

		// Search filters the patterns.
		await modal.getByRole( 'button', { name: 'All' } ).click();
		const searchBox = modal.getByRole( 'searchbox', { name: 'Search' } );
		await searchBox.fill( 'Services' );
		await expect( patterns ).toHaveText( [ 'Services page' ] );
		await searchBox.clear();

		// Choosing a pattern applies it to the page content.
		await modal.getByRole( 'option', { name: 'About page' } ).click();
		await expect( modal ).toBeHidden();
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{ name: 'core/heading', attributes: { content: 'About us' } },
			{
				name: 'core/paragraph',
				attributes: { content: 'We build websites.' },
			},
		] );
	} );

	test( 'only offers the patterns and categories matching the post type', async ( {
		admin,
		page,
	} ) => {
		await admin.createNewPost();

		const modal = page.getByRole( 'dialog', { name: 'Choose a pattern' } );
		await expect( modal ).toBeVisible();

		await expect(
			modal.locator(
				'.block-editor-block-patterns-explorer__sidebar__categories-list__item'
			)
		).toHaveText( [ 'All', 'Test Post Only' ] );
		await expect( modal.getByRole( 'option' ) ).toHaveText( [
			'Post call to action',
		] );
	} );
} );
