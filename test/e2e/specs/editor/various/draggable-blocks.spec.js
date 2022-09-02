/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Draggable block', () => {
	test.beforeEach( async ( { admin, page } ) => {
		await admin.createNewPost();
		await page.setViewportSize( {
			width: 960,
			height: 1024,
		} );
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

		// The role selector doesn't work for drag handle.
		const dragHandle = page.locator(
			'.block-editor-block-mover__drag-handle'
		);
		const firstParagraph = page.locator(
			'role=document[name="Paragraph block"i]',
			{
				hasText: '1',
			}
		);
		const dragHandleRect = await dragHandle.boundingBox();
		const targetRect = await firstParagraph.boundingBox();

		await page.mouse.move(
			dragHandleRect.x + dragHandleRect.width / 2,
			dragHandleRect.y + dragHandleRect.height / 2
		);
		await page.mouse.down();

		// Everything works up until now.
		await page.mouse.move(
			targetRect.x,
			// Drag to the top half.
			targetRect.y - targetRect.height * 0.25
		);

		// Wait for the insertion point to be visible.
		await expect(
			page.locator( '.block-editor-block-list__insertion-point' )
		).toBeVisible();

		await page.mouse.up();
	} );

	test.fixme(
		'can drag and drop to the bottom of a block list',
		async () => {}
	);
} );
