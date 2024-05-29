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

		await page.getByRole( 'button', { name: 'Add block' } ).click();

		// Click on the Search block option.
		await page.getByRole( 'option', { name: 'Search' } ).click();

		// Expect to see the Search block.
		const searchBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Search',
		} );

		await expect( searchBlock ).toBeVisible();

		// The only way to access the inner controlled blocks of the Navigation block
		// is to access the edited entity record for the associated Navigation Menu record.
		const editedMenuRecord = await page.evaluate( ( menuId ) => {
			return window.wp.data
				.select( 'core' )
				.getEditedEntityRecord( 'postType', 'wp_navigation', menuId );
		}, createdMenu?.id );

		// The 2nd block in the Navigation block is the Search block.
		const searchBlockAttributes = editedMenuRecord.blocks[ 1 ].attributes;

		expect( searchBlockAttributes ).toMatchObject( {
			showLabel: false,
			buttonUseIcon: true,
			buttonPosition: 'button-inside',
		} );
	} );
} );
