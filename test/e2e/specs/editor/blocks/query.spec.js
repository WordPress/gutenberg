/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Query block', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.activatePlugin( 'gutenberg-test-query-block' ),
			requestUtils.deleteAllPosts(),
			requestUtils.deleteAllPages(),
		] );
		await requestUtils.createPost( { title: 'Post 1', status: 'publish' } );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.deleteAllPosts(),
			requestUtils.deactivatePlugin( 'gutenberg-test-query-block' ),
		] );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost( {
			postType: 'page',
			title: 'Query Page',
		} );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPages();
	} );

	test.describe( 'Query block insertion', () => {
		test( 'List', async ( { page, editor } ) => {
			await editor.insertBlock( { name: 'core/query' } );

			await editor.canvas
				.getByRole( 'document', { name: 'Block: Query Loop' } )
				.getByRole( 'button', { name: 'Choose' } )
				.click();

			await page
				.getByRole( 'dialog', { name: 'Choose a pattern' } )
				.getByRole( 'option', { name: 'Standard' } )
				.click();

			await expect.poll( editor.getBlocks ).toMatchObject( [
				{
					name: 'core/query',
					innerBlocks: [
						{
							name: 'core/post-template',
							innerBlocks: [
								{ name: 'core/post-title' },
								{ name: 'core/post-featured-image' },
								{ name: 'core/post-excerpt' },
								{ name: 'core/separator' },
								{ name: 'core/post-date' },
							],
						},
					],
				},
			] );
		} );
	} );
} );
