/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';
/**
 * External dependencies
 */
import type { Page } from '@playwright/test';

/**
 * Go to the next page of the query.
 * @param page       - The page object.
 * @param pageNumber - The page number to navigate to.
 * @param className  - The class name of the query.
 * @param queryId    - The query ID.
 */
async function goToNextPage(
	page: Page,
	pageNumber: number,
	className: string,
	queryId: number
) {
	await page
		.locator( className )
		.getByRole( 'link', { name: 'Next Page' } )
		.click();

	// Wait for the response
	return page.waitForResponse( ( response ) =>
		response.url().includes( `query-${ queryId }-page=${ pageNumber }` )
	);
}

test.describe( 'Instant Search', () => {
	let originalPostsPerPage: number;
	test.beforeAll( async ( { requestUtils } ) => {
		originalPostsPerPage = ( await requestUtils.getSiteSettings() )
			.posts_per_page;
		await requestUtils.activateTheme( 'emptytheme' );
		await requestUtils.deleteAllPosts();

		// Create test posts
		// Make sure to create them last-to-first to avoid flakiness
		const posts = [
			{ title: 'Unique Post', days: 5 },
			{ title: 'Fourth Test Post', days: 4 },
			{ title: 'Third Test Post', days: 3 },
			{ title: 'Second Test Post', days: 2 },
			{ title: 'First Test Post', days: 1 },
		];

		await Promise.all(
			posts.map( async ( post ) => {
				await requestUtils.createPost( {
					...post,
					status: 'publish',
					date_gmt: new Date(
						new Date().getTime() - 1000 * 60 * 60 * 24 * post.days
					).toISOString(),
				} );
			} )
		);

		// Set the Blog pages show at most 2 posts
		await requestUtils.updateSiteSettings( {
			posts_per_page: 2,
		} );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts();
		await requestUtils.activateTheme( 'twentytwentyone' );
		await requestUtils.updateSiteSettings( {
			posts_per_page: originalPostsPerPage,
		} );
	} );

	test.describe( 'Basic Instant Search', () => {
		let pageId: number | null;
		const queryId = 123;

		test.beforeEach( async ( { editor, admin } ) => {
			// Create page with custom query
			await admin.createNewPost( {
				postType: 'page',
				title: 'Custom Query',
			} );
			await editor.insertBlock( {
				name: 'core/query',
				attributes: {
					enhancedPagination: true,
					queryId,
					query: { inherit: false },
					className: 'custom-query',
				},
				innerBlocks: [
					{ name: 'core/search' },
					{
						name: 'core/post-template',
						innerBlocks: [ { name: 'core/post-title' } ],
					},
					{
						name: 'core/query-pagination',
						innerBlocks: [
							{ name: 'core/query-pagination-previous' },
							{ name: 'core/query-pagination-numbers' },
							{ name: 'core/query-pagination-next' },
						],
					},
					{
						name: 'core/query-no-results',
						innerBlocks: [
							{
								name: 'core/paragraph',
								attributes: {
									content: 'No results found.',
								},
							},
						],
					},
				],
			} );

			pageId = await editor.publishPost();
		} );

		test.beforeEach( async ( { page } ) => {
			await page.goto( `/?p=${ pageId }` );
		} );

		test( 'should update search results without page reload', async ( {
			page,
		} ) => {
			// Check that the first post is shown initially
			await expect(
				page.getByText( 'First Test Post', { exact: true } )
			).toBeVisible();

			// Type in search input and verify results update
			await page.getByRole( 'searchbox' ).fill( 'Unique' );
			await page.waitForResponse( ( response ) =>
				response.url().includes( `instant-search-${ queryId }=Unique` )
			);

			// Verify only the unique post is shown
			await expect(
				page.getByText( 'Unique Post', { exact: true } )
			).toBeVisible();

			// Check that there is only one post
			const posts = page
				.locator( '.custom-query' )
				.getByRole( 'heading' );
			await expect( posts ).toHaveCount( 1 );

			// Verify that the other posts are hidden
			await expect(
				page.getByText( 'First Test Post', { exact: true } )
			).toBeHidden();
		} );

		test( 'should update URL with search parameter', async ( { page } ) => {
			// Test global query search parameter
			await page.getByRole( 'searchbox' ).fill( 'Test' );
			await expect( page ).toHaveURL(
				new RegExp( `instant-search-${ queryId }=Test` )
			);

			// Clear search and verify parameter is removed
			await page.getByRole( 'searchbox' ).fill( '' );
			await expect( page ).not.toHaveURL(
				new RegExp( `instant-search-${ queryId }=` )
			);
		} );

		test( 'should handle search debouncing', async ( { page } ) => {
			let responseCount = 0;

			// Monitor the number of requests
			page.on( 'response', ( res ) => {
				if ( res.url().includes( `instant-search-${ queryId }=` ) ) {
					responseCount++;
				}
			} );

			// Type quickly and wait for the response
			let responsePromise = page.waitForResponse( ( response ) => {
				return (
					response
						.url()
						.includes( `instant-search-${ queryId }=Test` ) &&
					response.status() === 200
				);
			} );
			await page
				.getByRole( 'searchbox' )
				.pressSequentially( 'Test', { delay: 100 } );
			await responsePromise;

			// Check that only one request was made
			expect( responseCount ).toBe( 1 );

			// Verify URL is updated after debounce
			await expect( page ).toHaveURL(
				new RegExp( `instant-search-${ queryId }=Test` )
			);

			responsePromise = page.waitForResponse( ( response ) => {
				return response
					.url()
					.includes( `instant-search-${ queryId }=Test1234` );
			} );
			// Type again with a large delay and verify that a request is made
			// for each character
			await page
				.getByRole( 'searchbox' )
				.pressSequentially( '1234', { delay: 500 } );
			await responsePromise;

			// Check that five requests were made (Test, Test1, Test12, Test123, Test1234)
			expect( responseCount ).toBe( 5 );
		} );

		test( 'should reset pagination when searching', async ( { page } ) => {
			// Navigate to second page
			await page.click( 'a.wp-block-query-pagination-next' );

			await expect( page ).toHaveURL(
				new RegExp( `query-${ queryId }-page=2` )
			);

			// Search and verify we're back to first page
			await page.getByRole( 'searchbox' ).fill( 'Test' );
			await expect( page ).not.toHaveURL(
				new RegExp( `query-${ queryId }-page=2` )
			);

			// The url should now contain `?paged=1` because we're on the first page
			// We cannot remove the `paged` param completely because the pathname
			// might contain the `/page/2` suffix so we need to set `paged` to `1` to
			// override it.
			await expect( page ).toHaveURL(
				new RegExp( `query-${ queryId }-page=1` )
			);
		} );

		test( 'should show no-results block when search has no matches', async ( {
			page,
		} ) => {
			await page.getByRole( 'searchbox' ).fill( 'NonexistentContent' );
			await page.waitForResponse( ( response ) =>
				response
					.url()
					.includes(
						`instant-search-${ queryId }=NonexistentContent`
					)
			);

			// Verify no-results block is shown
			await expect( page.getByText( 'No results found.' ) ).toBeVisible();
		} );

		test( 'should update pagination numbers based on search results', async ( {
			page,
		} ) => {
			// Initially should show pagination numbers for 3 pages
			await expect(
				page.locator( '.wp-block-query-pagination-numbers' )
			).toBeVisible();
			await expect(
				page.getByRole( 'link', { name: '2' } )
			).toBeVisible();
			await expect(
				page.getByRole( 'link', { name: '3' } )
			).toBeVisible();

			// Search for unique post
			await page.getByRole( 'searchbox' ).fill( 'Unique' );
			await page.waitForResponse( ( response ) =>
				response.url().includes( `instant-search-${ queryId }=Unique` )
			);

			// Pagination numbers should not be visible with single result
			await expect(
				page.locator( '.wp-block-query-pagination-numbers' )
			).toBeHidden();
		} );
	} );

	test.describe( 'Custom Search', () => {
		const queryId = 123;

		test( 'should handle pre-defined search from query attributes', async ( {
			admin,
			editor,
			page,
		} ) => {
			// Create page with custom query that includes a search parameter
			await admin.createNewPost( {
				postType: 'page',
				title: 'Query with Search',
			} );
			await editor.insertBlock( {
				name: 'core/query',
				attributes: {
					enhancedPagination: true,
					queryId,
					query: {
						inherit: false,
						search: 'Unique',
					},
					className: 'query-with-search',
				},
				innerBlocks: [
					{ name: 'core/search' },
					{
						name: 'core/post-template',
						innerBlocks: [ { name: 'core/post-title' } ],
					},
				],
			} );

			const id = await editor.publishPost();

			// Navigate to the page
			await page.goto( `/?p=${ id }` );

			// Verify the search input has the initial value
			await expect( page.getByRole( 'searchbox' ) ).toHaveValue(
				'Unique'
			);

			// Verify only the unique post is shown
			await expect(
				page.getByText( 'Unique Post', { exact: true } )
			).toBeVisible();
			const posts = page
				.locator( '.query-with-search' )
				.getByRole( 'heading' );
			await expect( posts ).toHaveCount( 1 );

			// Verify URL does not contain the instant-search parameter
			await expect( page ).not.toHaveURL(
				new RegExp( `instant-search-${ queryId }=` )
			);

			// Type new search term and verify normal instant search behavior
			await page.getByRole( 'searchbox' ).fill( 'Test' );
			await page.waitForResponse( ( response ) =>
				response.url().includes( `instant-search-${ queryId }=Test` )
			);

			// Verify URL now contains the instant-search parameter
			await expect( page ).toHaveURL(
				new RegExp( `instant-search-${ queryId }=Test` )
			);

			// Verify search results update
			await expect(
				page.getByText( 'First Test Post', { exact: true } )
			).toBeVisible();
		} );
	} );

	test.describe( 'Multiple Queries', () => {
		let pageId: number | null;

		const firstQueryId = 1234;
		const secondQueryId = 5678;

		const queryLoobBlockSettings = [
			{ className: 'first-query', queryId: firstQueryId },
			{ className: 'second-query', queryId: secondQueryId },
		];
		test.beforeEach( async ( { admin, editor, page } ) => {
			const queryLoobBlocks = queryLoobBlockSettings.map(
				( { className, queryId } ) => ( {
					name: 'core/query',
					attributes: {
						enhancedPagination: true,
						queryId,
						query: { inherit: false },
						className,
					},
					innerBlocks: [
						{ name: 'core/search' },
						{
							name: 'core/post-template',
							innerBlocks: [ { name: 'core/post-title' } ],
						},
						{
							name: 'core/query-pagination',
							innerBlocks: [
								{ name: 'core/query-pagination-previous' },
								{ name: 'core/query-pagination-next' },
							],
						},
					],
				} )
			);
			// Edit the Home template to include two custom queries
			await admin.createNewPost( { postType: 'page' } );
			await editor.insertBlock( queryLoobBlocks[ 0 ] );
			await editor.insertBlock( queryLoobBlocks[ 1 ] );

			const id = await editor.publishPost();

			pageId = id;
			await page.goto( `/?p=${ pageId }` );
		} );

		test( 'should handle searches independently', async ( { page } ) => {
			const firstQuery = page.locator( '.first-query' );
			const secondQuery = page.locator( '.second-query' );

			// Search in first query
			await firstQuery.getByRole( 'searchbox' ).fill( 'Unique' );
			await page.waitForResponse( ( response ) =>
				response
					.url()
					.includes( `instant-search-${ firstQueryId }=Unique` )
			);

			// Verify first query ONLY shows the unique post
			await expect(
				page
					.locator( '.first-query' )
					.getByText( 'Unique Post', { exact: true } )
			).toBeVisible();

			// Verify that the second query shows exactly 2 posts: First Test Post and Second Test Post
			const posts = secondQuery.getByRole( 'heading' );
			await expect( posts ).toHaveCount( 2 );
			await expect( posts ).toContainText( [
				'First Test Post',
				'Second Test Post',
			] );

			// Search in second query
			await secondQuery.getByRole( 'searchbox' ).fill( 'Third' );
			await page.waitForResponse( ( response ) =>
				response
					.url()
					.includes( `instant-search-${ secondQueryId }=Third` )
			);

			// Verify URL contains both search parameters
			await expect( page ).toHaveURL(
				new RegExp( `instant-search-${ firstQueryId }=Unique` )
			);
			await expect( page ).toHaveURL(
				new RegExp( `instant-search-${ secondQueryId }=Third` )
			);

			// Verify that the first query has only one post which is the "Unique" post
			const firstQueryPosts = firstQuery.getByRole( 'heading' );
			await expect( firstQueryPosts ).toHaveCount( 1 );
			await expect( firstQueryPosts ).toContainText( 'Unique Post' );

			// Verify that the second query has only one post which is the "Third Test Post"
			const secondQueryPosts = secondQuery.getByRole( 'heading' );
			await expect( secondQueryPosts ).toHaveCount( 1 );
			await expect( secondQueryPosts ).toContainText( 'Third Test Post' );

			// Clear first query search
			await firstQuery.getByRole( 'searchbox' ).fill( '' );
			await expect( page ).not.toHaveURL(
				new RegExp( `instant-search-${ firstQueryId }=` )
			);
			await expect( page ).toHaveURL(
				new RegExp( `instant-search-${ secondQueryId }=Third` )
			);

			// Clear second query search
			await secondQuery.getByRole( 'searchbox' ).fill( '' );
			await expect( page ).not.toHaveURL(
				new RegExp( `instant-search-${ secondQueryId }=` )
			);
		} );

		test( 'should handle pagination independently', async ( { page } ) => {
			const firstQuery = page.locator( '.first-query' );
			const secondQuery = page.locator( '.second-query' );

			// Navigate to second page in first query
			await goToNextPage( page, 2, '.first-query', firstQueryId );

			// Navigate to second page in second query
			await goToNextPage( page, 2, '.second-query', secondQueryId );

			// Navigate to third page in second query
			await goToNextPage( page, 3, '.second-query', secondQueryId );

			// Verify URL contains both pagination parameters
			await expect( page ).toHaveURL(
				new RegExp( `query-${ firstQueryId }-page=2` )
			);
			await expect( page ).toHaveURL(
				new RegExp( `query-${ secondQueryId }-page=3` )
			);

			// Search in first query and verify only its pagination resets
			await firstQuery.getByRole( 'searchbox' ).fill( 'Test' );
			await expect( page ).toHaveURL(
				new RegExp( `query-${ firstQueryId }-page=1` )
			);
			await expect( page ).toHaveURL(
				new RegExp( `query-${ secondQueryId }-page=3` )
			);

			// Search in second query and verify only its pagination resets
			await secondQuery.getByRole( 'searchbox' ).fill( 'Test' );
			await expect( page ).toHaveURL(
				new RegExp( `query-${ firstQueryId }-page=1` )
			);
			await expect( page ).toHaveURL(
				new RegExp( `query-${ secondQueryId }-page=1` )
			);
		} );
	} );

	test.describe( 'Editor', () => {
		test.beforeEach( async ( { admin } ) => {
			await admin.createNewPost( {
				postType: 'post',
				title: 'Instant Search Test',
			} );
		} );

		test.afterAll( async ( { requestUtils } ) => {
			await requestUtils.deleteAllPosts();
		} );

		test( 'should hide specific toolbar buttons when Search block is inside Query block with enhanced pagination', async ( {
			editor,
			page,
		} ) => {
			// Insert Query block with enhanced pagination enabled
			await editor.insertBlock( {
				name: 'core/query',
				attributes: { enhancedPagination: true },
				innerBlocks: [ { name: 'core/search' } ],
			} );

			// Select the Search block
			const searchBlock = editor.canvas.getByRole( 'document', {
				name: 'Block: Search',
			} );
			await editor.selectBlocks( searchBlock );

			// Verify that the specific toolbar buttons are hidden
			const toolbar = page.getByRole( 'toolbar', {
				name: 'Block tools',
			} );
			await expect(
				page.getByRole( 'checkbox', {
					name: 'Use button with icon',
				} )
			).toBeHidden();
			await expect(
				toolbar.getByRole( 'button', { name: 'Use button with icon' } )
			).toBeHidden();

			// Select the Query Loop block and disable enhanced pagination
			await editor.selectBlocks(
				editor.canvas.getByRole( 'document', {
					name: 'Block: Query Loop',
				} )
			);
			await editor.openDocumentSettingsSidebar();
			const editorSettings = page.getByRole( 'region', {
				name: 'Editor settings',
			} );
			await editorSettings
				.getByRole( 'button', { name: 'Advanced' } )
				.click();
			await editorSettings
				.getByRole( 'checkbox', { name: 'Reload full page' } )
				.click();

			// Select the Search block again
			await editor.selectBlocks( searchBlock );
			// Verify that the toolbar buttons are now visible
			await expect(
				page.getByRole( 'combobox', { name: 'Button position' } )
			).toBeVisible();
			await expect(
				page.getByRole( 'checkbox', {
					name: 'Use button with icon',
				} )
			).toBeVisible();
		} );

		test( 'should update List View label when Search block becomes Instant Search', async ( {
			editor,
			page,
		} ) => {
			// Insert Query block with enhanced pagination enabled
			await editor.insertBlock( {
				name: 'core/query',
				attributes: { enhancedPagination: true },
				innerBlocks: [ { name: 'core/search' } ],
			} );

			// Select the Search block
			const searchBlock = editor.canvas.getByRole( 'document', {
				name: 'Block: Search',
			} );
			await editor.selectBlocks( searchBlock );

			// Open List View
			await page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'Document Overview' } )
				.click();
			const listView = page.getByRole( 'region', {
				name: 'Document Overview',
			} );
			await expect( listView ).toBeVisible();

			// Verify that the Search block label includes "Instant search enabled"
			await expect(
				listView.getByText( 'Search (Instant search enabled)' )
			).toBeVisible();

			// Select the Query Loop block and disable enhanced pagination
			await editor.selectBlocks(
				editor.canvas.getByRole( 'document', {
					name: 'Block: Query Loop',
				} )
			);
			await editor.openDocumentSettingsSidebar();
			const editorSettings = page.getByRole( 'region', {
				name: 'Editor settings',
			} );
			await editorSettings
				.getByRole( 'button', { name: 'Advanced' } )
				.click();
			await editorSettings
				.getByRole( 'checkbox', { name: 'Reload full page' } )
				.click();

			// Verify that the Search block label is back to normal
			await expect( listView.getByText( 'Search' ) ).toBeVisible();
			await expect(
				listView.getByText( 'Search (Instant search enabled)' )
			).toBeHidden();
		} );
	} );
} );
