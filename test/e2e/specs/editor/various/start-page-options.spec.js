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
		const categoryTabs = modal.getByRole( 'tab' );
		await expect( categoryTabs ).toHaveText( [
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
		await modal.getByRole( 'tab', { name: 'Test About' } ).click();
		await expect( patterns ).toHaveText( [ 'About page' ] );

		// "Uncategorized" lists the patterns without a registered category.
		await modal.getByRole( 'tab', { name: 'Uncategorized' } ).click();
		await expect( patterns ).toHaveText( [ 'Plain page' ] );

		// Search filters the patterns.
		await modal.getByRole( 'tab', { name: 'All' } ).click();
		const searchBox = modal.getByRole( 'searchbox', { name: 'Search' } );
		await searchBox.fill( 'Services' );
		await expect( patterns ).toHaveText( [ 'Services page' ] );

		// A message is displayed when the search matches no patterns.
		await searchBox.fill( 'Nonexistent' );
		await expect( modal.getByText( 'No results found.' ) ).toBeVisible();
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

		await expect( modal.getByRole( 'tab' ) ).toHaveText( [
			'All',
			'Test Post Only',
		] );
		await expect( modal.getByRole( 'option' ) ).toHaveText( [
			'Post call to action',
		] );
	} );
} );
