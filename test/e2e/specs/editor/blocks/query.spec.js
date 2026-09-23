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
		let parentCategoryIds = [];
		let nestedCategoryIds = [];

		test.beforeAll( async ( { requestUtils } ) => {
			const createCategory = ( data ) =>
				requestUtils.rest( {
					path: '/wp/v2/categories',
					method: 'POST',
					data,
				} );

			const categories = await Promise.all(
				[ 'Alpaca', 'Beluga', 'Capybara' ].map( ( name ) =>
					createCategory( { name } )
				)
			);
			categoryIds = categories.map( ( { id } ) => id );

			// Two terms sharing a name under different parents, which is only
			// possible in a hierarchical taxonomy.
			const parents = await Promise.all(
				[ 'Sports', 'Technology' ].map( ( name ) =>
					createCategory( { name } )
				)
			);
			parentCategoryIds = parents.map( ( { id } ) => id );
			const nested = await Promise.all(
				parentCategoryIds.map( ( parent ) =>
					createCategory( { name: 'News', parent } )
				)
			);
			nestedCategoryIds = nested.map( ( { id } ) => id );
		} );

		test.afterAll( async ( { requestUtils } ) => {
			// Nested terms first, so that deleting a parent does not move them
			// up to the top level instead.
			for ( const id of [
				...nestedCategoryIds,
				...parentCategoryIds,
				...categoryIds,
			] ) {
				await requestUtils.rest( {
					path: `/wp/v2/categories/${ id }`,
					method: 'DELETE',
					params: { force: true },
				} );
			}
		} );

		/**
		 * Inserts a Query Loop block, shows the taxonomy filters and returns
		 * the Categories control.
		 *
		 * @param {Object} utils
		 * @param {Object} utils.page
		 * @param {Object} utils.editor
		 *
		 * @return {Promise<Object>} The Categories combobox locator.
		 */
		async function addQueryWithTaxonomyFilters( { page, editor } ) {
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

			return settings.getByRole( 'combobox', {
				name: 'Categories',
				exact: true,
			} );
		}

		test( 'should list existing terms without typing a search', async ( {
			page,
			editor,
		} ) => {
			const categoriesControl = await addQueryWithTaxonomyFilters( {
				page,
				editor,
			} );

			// Opening the control lists the terms, with nothing typed.
			await categoriesControl.click();

			await expect(
				page.getByRole( 'option', { name: 'Alpaca' } )
			).toBeVisible();
			await expect(
				page.getByRole( 'option', { name: 'Beluga' } )
			).toBeVisible();

			// A live region reports what the list found, rather than leaving a
			// screen reader to work it out from the options alone. The empty
			// state is a live region of its own, hence the filter.
			await expect(
				page
					.getByRole( 'status' )
					.filter( { hasText: 'results found.' } )
			).toHaveText( /\d+ results found\./ );

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

		test( 'should keep both terms when two are selected in quick succession', async ( {
			page,
			editor,
		} ) => {
			// Hold back the request that resolves the selected terms, so the
			// second term is selected while it is still in flight. The control
			// has to reflect the first selection without waiting for it.
			await page.route(
				( url ) =>
					(
						url.searchParams.get( 'rest_route' ) ?? url.pathname
					).includes( '/wp/v2/categories' ) &&
					url.search.includes( 'include' ),
				async ( route ) => {
					await new Promise( ( resolve ) =>
						setTimeout( resolve, 2000 )
					);
					await route.continue();
				}
			);

			const categoriesControl = await addQueryWithTaxonomyFilters( {
				page,
				editor,
			} );
			await categoriesControl.click();

			await page.getByRole( 'option', { name: 'Alpaca' } ).click();
			await page.getByRole( 'option', { name: 'Capybara' } ).click();

			await expect.poll( editor.getBlocks ).toMatchObject( [
				{
					name: 'core/query',
					attributes: {
						query: {
							taxQuery: {
								include: {
									category: [
										categoryIds[ 0 ],
										categoryIds[ 2 ],
									],
								},
							},
						},
					},
				},
			] );
		} );

		test( 'should name a nested term after the term it sits under', async ( {
			page,
			editor,
		} ) => {
			const categoriesControl = await addQueryWithTaxonomyFilters( {
				page,
				editor,
			} );
			await categoriesControl.click();

			// Two terms share the name "News", so each is listed with the term
			// it sits under. The option's accessible name carries it too.
			await expect(
				page.getByRole( 'option', { name: 'News (Sports)' } )
			).toBeVisible();
			await expect(
				page.getByRole( 'option', { name: 'News (Technology)' } )
			).toBeVisible();

			// A term at the top level keeps its bare name.
			await expect(
				page.getByRole( 'option', { name: 'Alpaca', exact: true } )
			).toBeVisible();

			// A search only returns the terms that matched it, so the parents
			// have to be looked up separately for the context to survive.
			await categoriesControl.fill( 'News' );
			await expect(
				page.getByRole( 'option', { name: 'News (Sports)' } )
			).toBeVisible();
			await expect(
				page.getByRole( 'option', { name: 'News (Technology)' } )
			).toBeVisible();

			// The term behind the label is the one that gets stored.
			await page.getByRole( 'option', { name: 'News (Sports)' } ).click();

			await expect.poll( editor.getBlocks ).toMatchObject( [
				{
					name: 'core/query',
					attributes: {
						query: {
							taxQuery: {
								include: {
									category: [ nestedCategoryIds[ 0 ] ],
								},
							},
						},
					},
				},
			] );
		} );
	} );
} );
