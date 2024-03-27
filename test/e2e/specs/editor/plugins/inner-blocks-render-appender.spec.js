/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'RenderAppender prop of InnerBlocks', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin(
			'gutenberg-test-innerblocks-render-appender'
		);
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-innerblocks-render-appender'
		);
	} );

	test( 'Users can customize the appender and can still insert blocks using exposed components', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'test/inner-blocks-render-appender',
		} );

		const customAppender = page.locator( '.my-custom-awesome-appender' );

		// Verify if the custom block appender text is the expected one.
		await expect( customAppender ).toContainText(
			'My custom awesome appender'
		);

		// Open the inserter of our custom block appender.
		await customAppender
			.getByRole( 'button', { name: 'Add block' } )
			.click();

		// Verify if the blocks the custom inserter is rendering are the expected ones.
		const blockListBox = page.getByRole( 'listbox', { name: 'Blocks' } );
		await expect( blockListBox.getByRole( 'option' ) ).toHaveText( [
			'Quote',
			'Video',
		] );

		// Insert a quote block.
		await blockListBox.getByRole( 'option', { name: 'Quote' } ).click();

		// Verify if the post content is the expected one.
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'test/inner-blocks-render-appender',
				innerBlocks: [
					{
						name: 'core/quote',
					},
				],
			},
		] );
	} );

	test( 'Users can dynamically customize the appender', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'test/inner-blocks-render-appender-dynamic',
		} );

		const addBlockBtn = page
			.locator( '.my-dynamic-blocks-appender' )
			.getByRole( 'button', {
				name: 'Add block',
			} );

		// Verify if the custom block appender text is the expected one.
		await expect(
			page.locator( '.my-dynamic-blocks-appender' )
		).toContainText( 'Empty Blocks Appender' );

		// Open the inserter of our custom block appender.
		await addBlockBtn.click();

		// Verify if the blocks the custom inserter is rendering are the expected ones.
		await expect(
			page
				.getByRole( 'listbox', { name: 'Blocks' } )
				.getByRole( 'option' )
		).toHaveText( [ 'Quote', 'Video' ] );

		// Insert a quote block.
		await page
			.getByRole( 'listbox', { name: 'Blocks' } )
			.getByRole( 'option', { name: 'Quote' } )
			.click();

		// Verify if the custom block appender text changed as expected.
		await expect(
			page
				.locator( '.my-dynamic-blocks-appender' )
				.getByText( 'Single Blocks Appender' )
		).toBeVisible();

		// Insert a video block.
		await addBlockBtn.click();
		await page
			.getByRole( 'listbox', { name: 'Blocks' } )
			.getByRole( 'option', { name: 'Video' } )
			.click();

		// Verify if the custom block appender text changed as expected.
		await expect(
			page
				.locator( '.my-dynamic-blocks-appender' )
				.getByText( 'Multiple Blocks Appender' )
		).toBeVisible();

		// Verify that the custom appender button is now not being rendered.
		await expect( addBlockBtn ).toBeHidden();

		// Verify if the post content is the expected one.
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'test/inner-blocks-render-appender-dynamic',
				innerBlocks: [
					{
						name: 'core/quote',
					},
					{
						name: 'core/video',
					},
				],
			},
		] );
	} );
} );
