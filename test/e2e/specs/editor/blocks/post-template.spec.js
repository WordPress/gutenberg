const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.use( {
	// Make the viewport large enough so that a scrollbar isn't displayed.
	// Otherwise, the page scrolling can interfere with the test runner's
	// ability to drop a block in the right location.
	viewport: {
		width: 960,
		height: 1024,
	},
} );

async function dragTo( page, x, y ) {
	// Call the move function twice to make sure the `dragOver` event is sent.
	// @see https://github.com/microsoft/playwright/issues/17153
	for ( let i = 0; i < 2; i += 1 ) {
		await page.mouse.move( x, y );
	}
}

test.describe( 'Post Template', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.deleteAllPosts(),
			requestUtils.deleteAllPages(),
		] );
		await requestUtils.createPost( {
			title: 'First post',
			content: 'Excerpt of the first post.',
			status: 'publish',
		} );
		await requestUtils.createPost( {
			title: 'Second post',
			content: 'Excerpt of the second post.',
			status: 'publish',
		} );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPages();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts();
	} );

	// Every post in the loop other than the active one is rendered as a live
	// block preview of the same blocks, so the canvas holds several elements
	// per client ID. Dropping used to be resolved against whichever of those
	// came first in the document, which is a preview whenever the post being
	// edited is not the first one in the loop.
	test( 'drops a block where it is dropped when the active post is not the first one', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost( { postType: 'page' } );

		await editor.insertBlock( {
			name: 'core/query',
			attributes: {
				query: {
					perPage: 2,
					offset: 0,
					postType: 'post',
					// Oldest first, so the loop lists the posts in the order
					// they are created above.
					order: 'asc',
					orderBy: 'date',
					inherit: false,
				},
			},
			innerBlocks: [
				{
					name: 'core/post-template',
					innerBlocks: [
						{ name: 'core/post-title' },
						{ name: 'core/post-excerpt' },
						{ name: 'core/post-date' },
					],
				},
			],
		} );

		const posts = editor.canvas.locator( 'li.wp-block-post' );
		await expect( posts ).toHaveCount( 3 );

		// Make the second post in the loop the editable one. The first post is
		// left behind as a preview above it.
		await posts.last().click();

		const activePost = editor.canvas.locator(
			'li.wp-block-post:not(.block-editor-block-preview__live-content)'
		);
		await expect( activePost ).toHaveText( /Second post/ );

		const title = activePost.getByRole( 'document', {
			name: 'Block: Title',
		} );
		const excerpt = activePost.getByRole( 'document', {
			name: 'Block: Excerpt',
		} );
		const date = activePost.getByRole( 'document', {
			name: 'Block: Date',
		} );

		await date.click();
		await editor.showBlockToolbar();
		await page
			.locator(
				'role=toolbar[name="Block tools"i] >> role=button[name="Drag"i][include-hidden]'
			)
			.hover();
		await page.mouse.down();

		// Hover over the top half of the excerpt, so the date is dropped
		// between the title and the excerpt.
		const excerptBox = await excerpt.boundingBox();
		await dragTo(
			page,
			excerptBox.x + excerptBox.width / 2,
			excerptBox.y + 1
		);

		const indicator = page.locator(
			'data-testid=block-list-insertion-point-indicator'
		);
		await expect( indicator ).toBeVisible();

		// The indicator sits between the title and the excerpt of the post
		// being edited, rather than being pushed past the last block because
		// the drop was resolved against the preview above.
		const titleBox = await title.boundingBox();
		await expect
			.poll( () => indicator.boundingBox().then( ( { y } ) => y ) )
			.toBeGreaterThan( titleBox.y );
		await expect
			.poll( () => indicator.boundingBox().then( ( { y } ) => y ) )
			.toBeLessThan( excerptBox.y + excerptBox.height / 2 );

		await page.mouse.up();

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/query',
				innerBlocks: [
					{
						name: 'core/post-template',
						innerBlocks: [
							{ name: 'core/post-title' },
							{ name: 'core/post-date' },
							{ name: 'core/post-excerpt' },
						],
					},
				],
			},
		] );
	} );
} );
