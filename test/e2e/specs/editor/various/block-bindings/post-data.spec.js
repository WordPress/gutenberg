/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Post Data source', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme(
			'gutenberg-test-themes/block-bindings'
		);
		await requestUtils.activatePlugin( 'gutenberg-test-block-bindings' );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost( { title: 'Test bindings' } );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts();
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
		await requestUtils.deactivatePlugin( 'gutenberg-test-block-bindings' );
	} );
	test.describe( 'Post Data bindings UI.', () => {
		test( 'should not include post data fields in UI to connect attributes on non date blocks', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: {
					content: 'fallback content',
					metadata: {
						bindings: {
							content: {
								source: 'core/post-data',
								args: {
									field: 'modified',
								},
							},
						},
					},
				},
			} );
			await page
				.getByRole( 'button', {
					name: 'content',
				} )
				.click();
			const postDataMenuItem = page.getByRole( 'menuitem', {
				name: 'Post Data',
			} );
			await expect( postDataMenuItem ).toBeHidden();
			// Check the fields registered by other sources are there.
		} );

		test( 'should include post data fields in UI to connect attributes on date blocks', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( {
				name: 'core/post-date',
				attributes: {
					metadata: {
						bindings: {
							datetime: {
								source: 'core/post-data',
								args: { field: 'date' },
							},
						},
					},
				},
			} );
			await page
				.getByRole( 'button', {
					name: 'datetime',
				} )
				.click();
			const postDataMenuItem = page.getByRole( 'menuitem', {
				name: 'Post Data',
			} );
			await expect( postDataMenuItem ).toBeVisible();
		} );
	} );
} );
