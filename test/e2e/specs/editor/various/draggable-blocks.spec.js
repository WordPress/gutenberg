/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Draggable block', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'can drag and drop to the top of a block list', async ( {
		editor,
		page,
	} ) => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2' );

		// Confirm correct setup.
		await expect.poll( editor.getEditedPostContent )
			.toBe( `<!-- wp:paragraph -->
<p>1</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>2</p>
<!-- /wp:paragraph -->` );

		await editor.showBlockToolbar();

		const dragHandle = page.locator(
			'role=toolbar[name="Block tools"i] >> role=button[name="Drag"i][include-hidden]'
		);
		// Hover to the center of the drag handle.
		await dragHandle.hover();
		// Start dragging.
		await page.mouse.down();
		await dragHandle.hover( {
			// Move the dragged handle a little bit (to the top left of the handle's
			// original location) to trigger the dragging chip to appear.
			position: { x: 0, y: 0 },
			// Bypass the "actionability" checks because the handle will disappear.
			force: true,
		} );

		await expect(
			page.locator( 'data-testid=block-draggable-chip >> visible=true' )
		).toBeVisible();

		// Hover on the upper half of the paragraph block to trigger the indicator.
		await page.hover( 'role=document[name="Paragraph block"i] >> text=1', {
			position: { x: 0, y: 0 },
		} );

		await expect(
			page.locator( 'data-testid=block-list-insertion-point-indicator' )
		).toBeVisible();

		// Drop the paragraph block.
		await page.mouse.up();

		await expect.poll( editor.getEditedPostContent )
			.toBe( `<!-- wp:paragraph -->
<p>2</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>1</p>
<!-- /wp:paragraph -->` );
	} );
} );
