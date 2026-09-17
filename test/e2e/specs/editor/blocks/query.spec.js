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

	test.describe( 'With Results block', () => {
		test( 'shows content next to Post Template only when the query has matching posts', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( {
				name: 'core/query',
				attributes: { query: { postType: 'post', inherit: false } },
				innerBlocks: [
					{
						name: 'core/query-with-results',
						innerBlocks: [
							{
								name: 'core/heading',
								attributes: { content: 'Related posts' },
							},
							{ name: 'core/post-template' },
						],
					},
					{
						name: 'core/query-no-results',
						innerBlocks: [
							{
								name: 'core/paragraph',
								attributes: { content: 'Nothing found' },
							},
						],
					},
				],
			} );

			const postId = await editor.publishPost();
			await page.goto( `/?p=${ postId }` );

			await expect(
				page.getByRole( 'heading', { name: 'Related posts' } )
			).toBeVisible();
			await expect( page.getByText( 'Nothing found' ) ).toBeHidden();
		} );

		test( 'hides content next to Post Template, and shows No Results, when the query has no matching posts', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( {
				name: 'core/query',
				attributes: {
					query: {
						postType: 'post',
						search: 'no-post-should-match-this-search-term',
						inherit: false,
					},
				},
				innerBlocks: [
					{
						name: 'core/query-with-results',
						innerBlocks: [
							{
								name: 'core/heading',
								attributes: { content: 'Related posts' },
							},
							{ name: 'core/post-template' },
						],
					},
					{
						name: 'core/query-no-results',
						innerBlocks: [
							{
								name: 'core/paragraph',
								attributes: { content: 'Nothing found' },
							},
						],
					},
				],
			} );

			const postId = await editor.publishPost();
			await page.goto( `/?p=${ postId }` );

			await expect(
				page.getByRole( 'heading', { name: 'Related posts' } )
			).toBeHidden();
			await expect( page.getByText( 'Nothing found' ) ).toBeVisible();
		} );
	} );
} );
