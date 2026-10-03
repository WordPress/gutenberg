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
		let deepCategoryIds = [];
		let tagIds = [];

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

			// Terms sharing a name under parents that share a name too.
			const years = await Promise.all(
				[ '2023', '2024' ].map( ( name ) => createCategory( { name } ) )
			);
			const yearSports = await Promise.all(
				years.map( ( { id: parent } ) =>
					createCategory( { name: 'Sports', parent } )
				)
			);
			const yearNews = await Promise.all(
				yearSports.map( ( { id: parent } ) =>
					createCategory( { name: 'News', parent } )
				)
			);
			deepCategoryIds = [ ...yearNews, ...yearSports, ...years ].map(
				( { id } ) => id
			);

			const tags = await Promise.all(
				[ 'Alpaca', 'Capybara' ].map( ( name ) =>
					requestUtils.rest( {
						path: '/wp/v2/tags',
						method: 'POST',
						data: { name },
					} )
				)
			);
			tagIds = tags.map( ( { id } ) => id );
		} );

		test.afterAll( async ( { requestUtils } ) => {
			// Nested terms first, so that deleting a parent does not move them
			// up to the top level instead.
			for ( const id of [
				...deepCategoryIds,
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
			for ( const id of tagIds ) {
				await requestUtils.rest( {
					path: `/wp/v2/tags/${ id }`,
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
					).includes( '/wp/v2/tags' ) &&
					url.search.includes( 'include' ),
				async ( route ) => {
					await new Promise( ( resolve ) =>
						setTimeout( resolve, 2000 )
					);
					await route.continue();
				}
			);

			await addQueryWithTaxonomyFilters( { page, editor } );
			await page
				.getByRole( 'combobox', { name: 'Tags', exact: true } )
				.click();

			await page.getByRole( 'option', { name: 'Alpaca' } ).click();
			await page.getByRole( 'option', { name: 'Capybara' } ).click();

			await expect.poll( editor.getBlocks ).toMatchObject( [
				{
					name: 'core/query',
					attributes: {
						query: {
							taxQuery: {
								include: { post_tag: tagIds },
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
				page.getByRole( 'option', {
					name: 'News (Sports)',
					exact: true,
				} )
			).toBeVisible();
			await expect(
				page.getByRole( 'option', {
					name: 'News (Technology)',
					exact: true,
				} )
			).toBeVisible();

			// A term is named after all the terms it sits under, so that terms
			// whose parents share a name can be told apart too.
			await expect(
				page.getByRole( 'option', {
					name: 'News (2023 › Sports)',
					exact: true,
				} )
			).toBeVisible();
			await expect(
				page.getByRole( 'option', {
					name: 'News (2024 › Sports)',
					exact: true,
				} )
			).toBeVisible();

			// A term at the top level keeps its bare name.
			await expect(
				page.getByRole( 'option', { name: 'Alpaca', exact: true } )
			).toBeVisible();

			// The context survives narrowing the list down.
			await categoriesControl.fill( 'News' );
			await expect(
				page.getByRole( 'option', {
					name: 'News (Sports)',
					exact: true,
				} )
			).toBeVisible();
			await expect(
				page.getByRole( 'option', {
					name: 'News (Technology)',
					exact: true,
				} )
			).toBeVisible();

			await expect(
				page.getByRole( 'option', {
					name: 'News (2024 › Sports)',
					exact: true,
				} )
			).toBeVisible();

			// The term behind the label is the one that gets stored.
			await page
				.getByRole( 'option', { name: 'News (Sports)', exact: true } )
				.click();

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

		test( 'should select the first matching term on Enter', async ( {
			page,
			editor,
		} ) => {
			const categoriesControl = await addQueryWithTaxonomyFilters( {
				page,
				editor,
			} );
			await categoriesControl.click();
			await expect(
				page.getByRole( 'option', { name: 'Alpaca' } )
			).toBeVisible();
			await categoriesControl.fill( 'Capy' );
			await page.keyboard.press( 'Enter' );

			await expect.poll( editor.getBlocks ).toMatchObject( [
				{
					name: 'core/query',
					attributes: {
						query: {
							taxQuery: {
								include: { category: [ categoryIds[ 2 ] ] },
							},
						},
					},
				},
			] );
		} );

		test( 'should not select a stale tag on Enter before the search runs', async ( {
			page,
			editor,
		} ) => {
			await addQueryWithTaxonomyFilters( { page, editor } );
			const tagsControl = page.getByRole( 'combobox', {
				name: 'Tags',
				exact: true,
			} );
			await tagsControl.click();
			await expect(
				page.getByRole( 'option', { name: 'Alpaca' } )
			).toBeVisible();

			// Enter is pressed well within the search debounce, while the list
			// still holds the terms listed before typing.
			await tagsControl.pressSequentially( 'Capy' );
			await page.keyboard.press( 'Enter' );

			await expect.poll( editor.getBlocks ).toMatchObject( [
				{
					name: 'core/query',
					attributes: {
						query: {
							taxQuery: {
								include: { post_tag: [ tagIds[ 1 ] ] },
							},
						},
					},
				},
			] );
		} );

		test( 'should announce when a term is added or removed', async ( {
			page,
			editor,
		} ) => {
			const categoriesControl = await addQueryWithTaxonomyFilters( {
				page,
				editor,
			} );
			await categoriesControl.click();
			await page.getByRole( 'option', { name: 'Beluga' } ).click();

			const announcement = page.locator( '#a11y-speak-assertive' );
			await expect( announcement ).toContainText( 'Category added' );

			const removeButton = page.getByRole( 'button', {
				name: 'Remove',
				exact: true,
			} );
			await expect( removeButton ).toHaveAccessibleDescription(
				/Beluga/
			);
			await removeButton.click();
			await expect( announcement ).toContainText( 'Category removed' );
		} );

		test( 'should keep the typed text when Enter is pressed while terms load', async ( {
			page,
			editor,
		} ) => {
			await page.route(
				( url ) =>
					(
						url.searchParams.get( 'rest_route' ) ?? url.pathname
					).includes( '/wp/v2/categories' ),
				async ( route ) => {
					await new Promise( ( resolve ) =>
						setTimeout( resolve, 1000 )
					);
					await route.continue();
				}
			);

			const categoriesControl = await addQueryWithTaxonomyFilters( {
				page,
				editor,
			} );
			await categoriesControl.click();
			await categoriesControl.pressSequentially( 'Capy' );
			await page.keyboard.press( 'Enter' );
			await expect( categoriesControl ).toHaveValue( 'Capy' );

			await expect(
				page.getByRole( 'option', { name: 'Capybara' } )
			).toBeVisible();
			await page.keyboard.press( 'Enter' );

			await expect.poll( editor.getBlocks ).toMatchObject( [
				{
					name: 'core/query',
					attributes: {
						query: {
							taxQuery: {
								include: { category: [ categoryIds[ 2 ] ] },
							},
						},
					},
				},
			] );
		} );

		test( "should hide the other control's terms without refetching the list", async ( {
			page,
			editor,
		} ) => {
			await addQueryWithTaxonomyFilters( { page, editor } );
			await page
				.getByRole( 'combobox', { name: 'Tags', exact: true } )
				.click();
			await page.getByRole( 'option', { name: 'Alpaca' } ).click();
			await page.keyboard.press( 'Escape' );

			const listRequests = [];
			page.on( 'request', ( request ) => {
				const url = decodeURIComponent( request.url() );
				if (
					url.includes( '/wp/v2/tags' ) &&
					! url.includes( 'include' )
				) {
					listRequests.push( url );
				}
			} );

			await page
				.getByRole( 'combobox', { name: 'Exclude: Tags', exact: true } )
				.click();
			await expect(
				page.getByRole( 'option', { name: 'Capybara' } )
			).toBeVisible();
			await expect(
				page.getByRole( 'option', { name: 'Alpaca' } )
			).toBeHidden();
			expect( listRequests ).toEqual( [] );
		} );

		test( 'should keep the matching tags listed while a search loads', async ( {
			page,
			editor,
		} ) => {
			await page.route(
				( url ) =>
					(
						url.searchParams.get( 'rest_route' ) ?? url.pathname
					).includes( '/wp/v2/tags' ) &&
					url.search.includes( 'search' ),
				async ( route ) => {
					await new Promise( ( resolve ) =>
						setTimeout( resolve, 3000 )
					);
					await route.continue();
				}
			);

			await addQueryWithTaxonomyFilters( { page, editor } );
			const tagsControl = page.getByRole( 'combobox', {
				name: 'Tags',
				exact: true,
			} );
			await tagsControl.click();
			await expect(
				page.getByRole( 'option', { name: 'Alpaca' } )
			).toBeVisible();

			const searchRequest = page.waitForRequest( ( request ) =>
				decodeURIComponent( request.url() ).includes( 'search=Capy' )
			);
			await tagsControl.pressSequentially( 'Capy' );
			await searchRequest;

			await expect( page.getByText( 'Loading…' ) ).toBeVisible();
			await expect(
				page.getByRole( 'option', { name: 'Capybara' } )
			).toBeVisible( { timeout: 1000 } );
			await expect(
				page.getByRole( 'option', { name: 'Alpaca' } )
			).toBeHidden( { timeout: 1000 } );
		} );
	} );
} );
