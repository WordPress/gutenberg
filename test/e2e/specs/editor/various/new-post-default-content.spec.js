const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );
const { openPostSummary } = require( './post-summary/utils' );

test.describe( 'new editor filtered state', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin(
			'gutenberg-test-plugin-default-post-content'
		);
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-plugin-default-post-content'
		);
		await requestUtils.deleteAllPosts();
	} );

	test( 'should respect default content', async ( { editor, page } ) => {
		const summary = await openPostSummary( { editor, page } );
		// Assert they match what the plugin set.
		await expect(
			editor.canvas.locator( 'role=textbox[name="Add title"i]' )
		).toHaveText( 'My default title' );
		await expect
			.poll( editor.getEditedPostContent )
			.toBe( 'My default content' );
		await summary.getByRole( 'button', { name: 'Edit Excerpt' } ).click();
		await expect(
			page.getByRole( 'textbox', { name: 'Excerpt' } )
		).toHaveValue( 'My default excerpt' );
	} );

	test( 'should show the filtered placeholder in an empty post only', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const { id } = await requestUtils.createPost( {
			title: 'Empty post',
			status: 'draft',
		} );
		await admin.editPost( id );
		await expect(
			editor.canvas
				.getByRole( 'document', {
					name: 'Add default block',
					exact: true,
				} )
				.locator( '[data-rich-text-placeholder]' )
		).toHaveAttribute(
			'data-rich-text-placeholder',
			'My default placeholder'
		);

		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title', exact: true } )
			.click();
		await page.keyboard.press( 'End' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Hello' );
		await page.keyboard.press( 'Enter' );

		// A new paragraph keeps the default placeholder.
		await expect(
			editor.canvas
				.getByRole( 'document', {
					name: 'Empty block; start writing or type forward slash to choose a block',
					exact: true,
				} )
				.locator( '[data-rich-text-placeholder]' )
		).toHaveAttribute(
			'data-rich-text-placeholder',
			'Type / to choose a block'
		);
		// The placeholder is not saved.
		await expect.poll( editor.getBlocks ).toEqual( [
			{
				name: 'core/paragraph',
				attributes: { content: 'Hello', dropCap: false },
				innerBlocks: [],
			},
			{
				name: 'core/paragraph',
				attributes: { content: '', dropCap: false },
				innerBlocks: [],
			},
		] );
		await expect
			.poll( editor.getEditedPostContent )
			.toBe(
				'<!-- wp:paragraph -->\n<p>Hello</p>\n<!-- /wp:paragraph -->\n\n<!-- wp:paragraph -->\n<p></p>\n<!-- /wp:paragraph -->'
			);
	} );
} );
