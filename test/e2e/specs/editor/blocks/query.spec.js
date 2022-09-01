/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Query block', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin( 'gutenberg-test-query-block' );
	} );
	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts();
		await requestUtils.deactivatePlugin( 'gutenberg-test-query-block' );
	} );
	test.beforeEach( async ( { admin, editor } ) => {
		await admin.createNewPost( { postType: 'post', title: `Post 1` } );
		await editor.publishPost();
		await admin.createNewPost( { postType: 'page', title: `Query Page` } );
	} );

	test.describe( 'Query block insertion', () => {
		test( 'Carousel', async ( { page, editor } ) => {
			await editor.insertBlock( { name: 'core/query' } );
			// Wait for the choose pattern button
			await page.click( 'role=button[name="Choose"i]' );

			//  * Ensure that carousel is working by checking slider css classes
			//  * and navigating to the next pattern.
			//  */
			expect(
				page.locator(
					'li.pattern-slide.active-slide[aria-label="Query Test 1"]'
				)
			).toBeVisible();
			await page.click( 'role=button[name="Next pattern"i]' );
			expect(
				page.locator(
					'li.pattern-slide.active-slide[aria-label="Query Test 2"]'
				)
			).toBeVisible();

			// Choose the selected pattern.
			await page.click( 'role=button[name="Choose"i]' );

			// Wait for pattern setup to go away.
			await page.locator(
				'.block-editor-block-pattern-setup >> hidden=true'
			);

			/**
			 * We can't use `getEditedPostContent` easily for now because
			 * `query` makes used of `instanceId` so it's not very reliable.
			 * This should be revisited.
			 */
			expect(
				page
					.locator( '[aria-label="Block: Post Date"] >> nth=0' )
			).toBeVisible();
			expect(
				page.locator( '[aria-label="Block: Post Title"] >> nth=0' )
			).toBeVisible();
		} );

		test( 'Grid view', async ( { page, editor } ) => {
			await editor.insertBlock( { name: 'core/query' } );

			// Wait for the choose pattern button
			await page.click( 'role=button[name="Choose"i]' );

			// Wait for patterns setup to be loaded.
			expect(
				page.locator(
					'.block-editor-block-pattern-setup__display-controls'
				)
			).toBeVisible();

			// Click the Grid view button.
			await page.click( 'role=button[name="Grid view"i]' );

			// Wait for patterns to be loaded and click the wanted pattern.
			await page.click( '[aria-label= "Query Test 2" ]' );

			// Wait for pattern setup to go away.
			await page.locator(
				'.block-editor-block-pattern-setup >> hidden=true'
			);

			/**
			 * We can't use `getEditedPostContent` easily for now because
			 * `query` makes used of `instanceId` so it's not very reliable.
			 * This should be revisited.
			 */
			expect(
				page.locator( '[aria-label="Block: Post Date"] >> nth=0' )
			).toBeVisible();
			expect(
				page.locator( '[aria-label="Block: Post Title"] >> nth=0' )
			).toBeVisible();
		} );
	} );
} );
