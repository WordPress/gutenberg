/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Search', () => {
	test.beforeEach( async ( { admin, requestUtils } ) => {
		await requestUtils.deleteAllMenus();
		await admin.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMenus();
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.deleteAllPosts(),
			requestUtils.deleteAllMenus(),
		] );
	} );

	test( 'should auto-configure itself to sensible defaults when inserted into a Navigation block', async ( {
		page,
		editor,
		requestUtils,
	} ) => {
		const createdMenu = await requestUtils.createNavigationMenu( {
			title: 'Test Menu',
			content: `<!-- wp:spacer -->
<div style="height:100px" aria-hidden="true" class="wp-block-spacer"></div>
<!-- /wp:spacer -->`,
		} );

		await editor.insertBlock( {
			name: 'core/navigation',
			attributes: {
				ref: createdMenu?.id,
			},
		} );

		const navBlockInserter = editor.canvas.getByRole( 'button', {
			name: 'Add block',
		} );
		await navBlockInserter.click();

		// Expect to see the block inserter.
		await expect(
			page.getByRole( 'searchbox', {
				name: 'Search for blocks and patterns',
			} )
		).toBeFocused();

		// Search for the Search block.
		await page.keyboard.type( 'Search' );

		const blockResults = page.getByRole( 'listbox', {
			name: 'Blocks',
		} );

		await expect( blockResults ).toBeVisible();

		const searchBlockResult = blockResults.getByRole( 'option', {
			name: 'Search',
		} );

		// Select the Search block.
		await searchBlockResult.click();

		// Expect to see the Search block.
		const searchBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Search',
		} );

		await expect( searchBlock ).toBeVisible();

		const navBlockInEditor = await page.evaluate( () => {
			const allBlocks = window.wp.data
				.select( 'core/block-editor' )
				.getBlocks();

			const block = window.wp.data
				.select( 'core/block-editor' )
				.getBlock( allBlocks[ 0 ].clientId );
			return block;
		} );

		await expect.poll( navBlockInEditor ).toMatchObject( [
			{
				name: 'core/search',
				attributes: {
					showLabel: false,
					buttonUseIcon: true,
					buttonPosition: 'button-inside',
				},
			},
		] );
	} );
} );
