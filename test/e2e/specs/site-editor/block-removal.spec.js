/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Site editor block removal prompt', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test.beforeEach( async ( { admin, editor } ) => {
		await admin.visitSiteEditor( {
			postId: 'emptytheme//index',
			postType: 'wp_template',
		} );
		await editor.canvas.click( 'body' );
	} );

	test( 'should appear when attempting to remove Query Block', async ( {
		page,
	} ) => {
		// Open and focus List View
		await page.getByRole( 'button', { name: 'List View' } ).click();

		// Select and try to remove Query Loop
		await page.getByRole( 'link', { name: 'Query Loop' } ).click();
		await page.keyboard.press( 'Backspace' );

		// Expect the block removal prompt to have appeared
		await expect(
			page.getByText( 'Query Loop displays a list of posts or pages.' )
		).toBeVisible();
	} );

	test( 'should not appear when attempting to remove something else', async ( {
		editor,
		page,
	} ) => {
		// Open and focus List View
		await page.getByRole( 'button', { name: 'List View' } ).click();

		// Select Query Loop list item
		await page.getByRole( 'link', { name: 'Query Loop' } ).click();

		// Reveal its inner blocks in the list view
		await page.keyboard.press( 'ArrowRight' );

		// Select its Post Template inner block
		await page.getByRole( 'link', { name: 'Post Template' } ).click();

		// Expect to remove the Post Template with no prompts
		expect( await getQueryBlockInnerBlocks( editor ) ).toHaveLength( 1 );
		await page.keyboard.press( 'Backspace' );
		expect( await getQueryBlockInnerBlocks( editor ) ).toHaveLength( 0 );
	} );
} );

async function getQueryBlockInnerBlocks( editor ) {
	const block = await editor.getBlocks();
	const query = block.find( ( { name } ) => name === 'core/query' );
	return query.innerBlocks;
}
