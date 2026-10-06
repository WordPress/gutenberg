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

		test( 'should describe a nested term with the terms it sits under', async ( {
			page,
			editor,
		} ) => {
			const categoriesControl = await addQueryWithTaxonomyFilters( {
				page,
				editor,
			} );
			await categoriesControl.click();
			const getNestedOption = ( name, path ) =>
				page
					.getByRole( 'option', { name, exact: true } )
					.filter( { has: page.getByText( path, { exact: true } ) } );

			// Two terms share the name "News", so each is described by the term
			// it sits under. The option's accessible description carries it too.
			await expect( getNestedOption( 'News', 'Sports' ) ).toBeVisible();
			await expect(
				getNestedOption( 'News', 'Sports' )
			).toHaveAccessibleDescription( 'Sports' );
			await expect(
				getNestedOption( 'News', 'Technology' )
			).toBeVisible();

			// A term is described by all the terms it sits under, so that terms
			// whose parents share a name can be told apart too.
			await expect(
				getNestedOption( 'News', '2023 › Sports' )
			).toBeVisible();
			await expect(
				getNestedOption( 'News', '2024 › Sports' )
			).toBeVisible();

			// A term at the top level has no description.
			await expect(
				page.getByRole( 'option', { name: 'Alpaca', exact: true } )
			).toHaveAccessibleDescription( '' );

			// The context survives narrowing the list down.
			await categoriesControl.fill( 'News' );
			await expect( getNestedOption( 'News', 'Sports' ) ).toBeVisible();
			await expect(
				getNestedOption( 'News', 'Technology' )
			).toBeVisible();
			await expect(
				getNestedOption( 'News', '2024 › Sports' )
			).toBeVisible();

			// The term behind the option is the one that gets stored.
			await getNestedOption( 'News', 'Sports' ).click();

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

			// The chip is named after the term and the terms it sits under.
			await expect(
				page.getByRole( 'button', { name: 'Remove', exact: true } )
			).toHaveAccessibleDescription( /News \(Sports\)/ );
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

		test( "should leave the other control's terms out of the list on the server", async ( {
			page,
			editor,
		} ) => {
			await addQueryWithTaxonomyFilters( { page, editor } );
			await page
				.getByRole( 'combobox', { name: 'Tags', exact: true } )
				.click();
			await page.getByRole( 'option', { name: 'Alpaca' } ).click();
			await page.keyboard.press( 'Escape' );

			const listRequest = page.waitForRequest( ( request ) => {
				const url = new URL( request.url() );
				return (
					(
						url.searchParams.get( 'rest_route' ) ?? url.pathname
					).includes( '/wp/v2/tags' ) &&
					! url.search.includes( 'include' )
				);
			} );
			await page
				.getByRole( 'combobox', { name: 'Exclude: Tags', exact: true } )
				.click();

			const excluded = [
				...new URL( ( await listRequest ).url() ).searchParams,
			]
				.filter( ( [ key ] ) => key.startsWith( 'exclude' ) )
				.map( ( [ , id ] ) => Number( id ) );
			expect( excluded ).toEqual( [ tagIds[ 0 ] ] );
			await expect(
				page.getByRole( 'option', { name: 'Capybara' } )
			).toBeVisible();
			await expect(
				page.getByRole( 'option', { name: 'Alpaca' } )
			).toBeHidden();
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

		test.describe( 'With more tags than a search returns', () => {
			let manyTagIds = [];

			test.beforeAll( async ( { requestUtils } ) => {
				// 25 tags match "Zebra", more than the 20 a search returns.
				const tags = await Promise.all(
					Array.from( { length: 25 }, ( _, index ) =>
						requestUtils.rest( {
							path: '/wp/v2/tags',
							method: 'POST',
							data: {
								name: `Zebra ${ String( index + 1 ).padStart(
									2,
									'0'
								) }`,
							},
						} )
					)
				);
				manyTagIds = tags.map( ( { id } ) => id );
			} );

			test.afterAll( async ( { requestUtils } ) => {
				for ( const id of manyTagIds ) {
					await requestUtils.rest( {
						path: `/wp/v2/tags/${ id }`,
						method: 'DELETE',
						params: { force: true },
					} );
				}
			} );

			test( 'should say when only some of the matching tags are listed', async ( {
				page,
				editor,
			} ) => {
				await addQueryWithTaxonomyFilters( { page, editor } );
				const tagsControl = page.getByRole( 'combobox', {
					name: 'Tags',
					exact: true,
				} );
				await tagsControl.fill( 'Zebra' );
				await expect( page.getByRole( 'option' ) ).toHaveCount( 20 );
				await expect(
					page.getByText(
						'Showing 20 of 25 results. Refine your search to see more.'
					)
				).toBeVisible();

				// When every match is listed, the count is not shown.
				await tagsControl.fill( 'Zebra 25' );
				await expect(
					page.getByRole( 'option', { name: 'Zebra 25' } )
				).toBeVisible();
				await expect( page.getByRole( 'option' ) ).toHaveCount( 1 );
				await expect( page.getByText( /^Showing/ ) ).toBeHidden();
			} );

			test( "should still list the matching tags when the other control's tags are hidden", async ( {
				page,
				editor,
			} ) => {
				await addQueryWithTaxonomyFilters( { page, editor } );
				const tagsControl = page.getByRole( 'combobox', {
					name: 'Tags',
					exact: true,
				} );
				await tagsControl.fill( 'Zebra 01' );
				await page
					.getByRole( 'option', { name: 'Zebra 01', exact: true } )
					.click();
				await expect.poll( editor.getBlocks ).toMatchObject( [
					{
						name: 'core/query',
						attributes: {
							query: {
								taxQuery: {
									include: { post_tag: [ manyTagIds[ 0 ] ] },
								},
							},
						},
					},
				] );

				// "Zebra 01" is among the first 20 matches, but it is hidden
				// here, so a 21st match takes its place.
				await page
					.getByRole( 'combobox', {
						name: 'Exclude: Tags',
						exact: true,
					} )
					.fill( 'Zebra' );
				await expect(
					page.getByText(
						'Showing 20 of 24 results. Refine your search to see more.'
					)
				).toBeVisible();
				await expect( page.getByRole( 'option' ) ).toHaveCount( 20 );
				await expect(
					page.getByRole( 'option', { name: 'Zebra 21' } )
				).toBeVisible();
				await expect(
					page.getByRole( 'option', { name: 'Zebra 01' } )
				).toBeHidden();
			} );
		} );
	} );
} );
