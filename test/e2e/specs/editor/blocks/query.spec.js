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

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost( {
			postType: 'page',
			title: 'Query Page',
		} );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPages();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.deleteAllPosts(),
			requestUtils.deactivatePlugin( 'gutenberg-test-query-block' ),
		] );
	} );

	test.describe( 'Post Template block movers', () => {
		test( 'should show vertical movers for blocks inside a grid Post Template', async ( {
			page,
			editor,
		} ) => {
			await editor.insertBlock( {
				name: 'core/query',
				attributes: { query: { perPage: 3, postType: 'post' } },
				innerBlocks: [
					{
						name: 'core/post-template',
						attributes: {
							layout: { type: 'grid', columnCount: 3 },
						},
						innerBlocks: [
							{ name: 'core/post-title' },
							{ name: 'core/post-date' },
						],
					},
				],
			} );

			// Select a block inside the first post item.
			await editor.canvas
				.getByRole( 'document', { name: 'Block: Title' } )
				.click();
			await editor.showBlockToolbar();

			// The blocks inside the Post Template stack vertically within
			// each post item, so the movers should be vertical even when the
			// post items are arranged in a grid.
			const blockToolbar = page.getByRole( 'toolbar', {
				name: 'Block tools',
			} );
			await expect(
				blockToolbar.getByRole( 'button', { name: 'Move up' } )
			).toBeVisible();
			await expect(
				blockToolbar.getByRole( 'button', { name: 'Move down' } )
			).toBeVisible();
		} );
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

	test.describe( 'Taxonomy filters', () => {
		let categoryIds = [];

		test.beforeAll( async ( { requestUtils } ) => {
			const categories = await Promise.all(
				[ 'Alpaca', 'Beluga', 'Capybara' ].map( ( name ) =>
					requestUtils.rest( {
						path: '/wp/v2/categories',
						method: 'POST',
						data: { name },
					} )
				)
			);
			categoryIds = categories.map( ( { id } ) => id );
		} );

		test.afterAll( async ( { requestUtils } ) => {
			await Promise.all(
				categoryIds.map( ( id ) =>
					requestUtils.rest( {
						path: `/wp/v2/categories/${ id }`,
						method: 'DELETE',
						params: { force: true },
					} )
				)
			);
		} );

		test( 'should list existing terms without typing a search', async ( {
			page,
			editor,
		} ) => {
			await editor.insertBlock( {
				name: 'core/query',
				attributes: { query: { perPage: 3, postType: 'post' } },
				innerBlocks: [
					{
						name: 'core/post-template',
						innerBlocks: [ { name: 'core/post-title' } ],
					},
				],
			} );
			await editor.selectBlocks(
				editor.canvas.getByRole( 'document', {
					name: 'Block: Query Loop',
				} )
			);
			await editor.openDocumentSettingsSidebar();

			const settings = page.getByRole( 'region', {
				name: 'Editor settings',
			} );

			// The taxonomies control is an optional tools panel item.
			await settings
				.getByRole( 'button', { name: 'Filters options' } )
				.click();
			await page
				.getByRole( 'menuitemcheckbox', { name: 'Show Taxonomies' } )
				.click();
			await page.keyboard.press( 'Escape' );

			// Opening the control lists the terms, with nothing typed.
			await settings
				.getByRole( 'combobox', { name: 'Categories', exact: true } )
				.click();

			await expect(
				page.getByRole( 'option', { name: 'Alpaca' } )
			).toBeVisible();
			await expect(
				page.getByRole( 'option', { name: 'Beluga' } )
			).toBeVisible();

			// Selecting from that list filters the query by the term.
			await page.getByRole( 'option', { name: 'Beluga' } ).click();

			await expect.poll( editor.getBlocks ).toMatchObject( [
				{
					name: 'core/query',
					attributes: {
						query: {
							taxQuery: {
								include: { category: [ categoryIds[ 1 ] ] },
							},
						},
					},
				},
			] );
		} );
	} );
} );
