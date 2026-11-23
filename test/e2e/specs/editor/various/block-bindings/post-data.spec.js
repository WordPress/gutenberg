const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const getDatetimeType = ( page ) =>
	page.evaluate(
		() =>
			window.wp.blocks.getBlockType( 'core/post-date' ).attributes
				.datetime.type
	);

test.describe( 'Post Data source', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin( 'gutenberg-test-block-bindings' );
	} );

	test.beforeEach( async ( { admin, editor } ) => {
		await admin.createNewPost( { title: 'Test bindings' } );
		await editor.openDocumentSettingsSidebar();
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts();
	} );

	test.afterAll( async ( { requestUtils } ) => {
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

		test( 'should not render Attributes panel for date blocks before WordPress 7.3', async ( {
			editor,
			page,
		} ) => {
			// eslint-disable-next-line playwright/no-skipped-test
			test.skip(
				( await getDatetimeType( page ) ) !== 'string',
				'WordPress 7.3 validates the datetime type.'
			);
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
			await expect(
				page.getByLabel( 'Attributes options' )
			).toBeHidden();
		} );

		test( 'should only include date fields in UI to connect the date block', async ( {
			editor,
			page,
		} ) => {
			// eslint-disable-next-line playwright/no-skipped-test
			test.skip(
				( await getDatetimeType( page ) ) === 'string',
				'Needs WordPress 7.3 to validate the datetime type.'
			);
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
			await page.getByRole( 'menuitem', { name: 'Post Data' } ).click();
			await expect(
				page.getByRole( 'menuitemcheckbox', { name: 'Post Date' } )
			).toBeVisible();
			await expect(
				page.getByRole( 'menuitemcheckbox', {
					name: 'Post Modified Date',
				} )
			).toBeVisible();
			await expect(
				page.getByRole( 'menuitemcheckbox', { name: 'Post Link' } )
			).toBeHidden();
		} );

		test( 'should render the post date on the frontend', async ( {
			editor,
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
			const previewPage = await editor.openPreviewPage();
			await expect(
				previewPage.locator( '.wp-block-post-date time' )
			).toHaveAttribute( 'datetime', /^\d{4}-\d{2}-\d{2}T/ );
		} );
	} );
} );
