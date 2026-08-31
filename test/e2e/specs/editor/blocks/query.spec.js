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
	test.describe( 'Query Loop - interactivity', () => {
		test( 'Insert interactive block', async ( { page, editor } ) => {
			await editor.insertBlock( { name: 'core/query' } );

			await editor.canvas
				.getByRole( 'document', { name: 'Block: Query Loop' } )
				.getByRole( 'button', { name: 'Choose' } )
				.click();

			await page
				.getByRole( 'dialog', { name: 'Choose a pattern' } )
				.getByRole( 'option', { name: 'Standard' } )
				.click();

			const queryBlock = editor.canvas.locator(
				'role=document[name="Block: Query Loop"i]'
			);

			await expect( queryBlock ).toBeVisible();

			await editor.openDocumentSettingsSidebar();

			await page.getByLabel( 'Force page reload' ).setChecked( false );

			await expect(
				page.getByLabel( 'Force page reload' )
			).not.toBeChecked();

			await queryBlock.focus();

			await editor.canvas
				.locator( 'role=button[name="Add block"i]' )
				.click();

			await page
				.getByRole( 'listbox', { name: 'Blocks' } )
				.getByRole( 'option', { name: 'Heading' } )
				.click();

			await editor.canvas
				.getByRole( 'document', { name: 'Block: Heading' } )
				.fill( 'Test Heading' );

			await queryBlock.focus();

			await editor.openDocumentSettingsSidebar();

			await expect(
				page.getByLabel( 'Force page reload' )
			).not.toBeChecked();
		} );

		test( 'Insert non-interactive block', async ( { page, editor } ) => {
			await editor.insertBlock( { name: 'core/query' } );

			await editor.canvas
				.getByRole( 'document', { name: 'Block: Query Loop' } )
				.getByRole( 'button', { name: 'Choose' } )
				.click();

			await page
				.getByRole( 'dialog', { name: 'Choose a pattern' } )
				.getByRole( 'option', { name: 'Standard' } )
				.click();

			const queryBlock = editor.canvas.locator(
				'role=document[name="Block: Query Loop"i]'
			);

			await expect( queryBlock ).toBeVisible();

			await editor.openDocumentSettingsSidebar();

			await page.getByLabel( 'Force page reload' ).setChecked( false );

			await expect(
				page.getByLabel( 'Force page reload' )
			).not.toBeChecked();

			await queryBlock.focus();

			await editor.canvas
				.locator( 'role=button[name="Add block"i]' )
				.click();

			await page
				.getByLabel( 'Search for blocks and patterns' )
				.fill( 'Shortcode' );

			await page
				.getByRole( 'listbox', { name: 'Blocks' } )
				.getByRole( 'option', { name: 'Shortcode' } )
				.click();

			await expect(
				page.getByRole( 'alertdialog', {
					name: 'Query block: Force page reload enabled',
				} )
			).toBeVisible();

			await page
				.getByRole( 'alertdialog', {
					name: 'Query block: Force page reload enabled',
				} )
				.getByRole( 'button', { name: 'OK' } )
				.click();

			await queryBlock.focus();

			await editor.openDocumentSettingsSidebar();

			await expect(
				page.getByLabel( 'Force page reload' )
			).toBeChecked();
		} );
	} );
} );
