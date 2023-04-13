/**
 * WordPress dependencies
 */
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

test.describe( 'Draggable block', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'can drag and drop to the top of a vertical block list', async ( {
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

		await page.focus( 'role=document[name="Paragraph block"i] >> text=2' );
		await editor.showBlockToolbar();

		const dragHandle = page.locator(
			'role=toolbar[name="Block tools"i] >> role=button[name="Drag"i][include-hidden]'
		);
		// Hover to the center of the drag handle.
		await dragHandle.hover();
		// Start dragging.
		await page.mouse.down();

		// Move to and hover on the upper half of the paragraph block to trigger the indicator.
		const firstParagraph = page.locator(
			'role=document[name="Paragraph block"i] >> text=1'
		);
		const firstParagraphBound = await firstParagraph.boundingBox();
		// Call the move function twice to make sure the `dragOver` event is sent.
		// @see https://github.com/microsoft/playwright/issues/17153
		for ( let i = 0; i < 2; i += 1 ) {
			await page.mouse.move(
				firstParagraphBound.x,
				firstParagraphBound.y
			);
		}

		await expect(
			page.locator( 'data-testid=block-draggable-chip >> visible=true' )
		).toBeVisible();

		const indicator = page.locator(
			'data-testid=block-list-insertion-point-indicator'
		);
		await expect( indicator ).toBeVisible();
		// Expect the indicator to be above the first paragraph.
		await expect
			.poll( () => indicator.boundingBox().then( ( { y } ) => y ) )
			.toBeLessThan( firstParagraphBound.y );

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

	test( 'can drag and drop to the bottom of a vertical block list', async ( {
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

		await page.focus( 'role=document[name="Paragraph block"i] >> text=1' );
		await editor.showBlockToolbar();

		const dragHandle = page.locator(
			'role=toolbar[name="Block tools"i] >> role=button[name="Drag"i][include-hidden]'
		);
		// Hover to the center of the drag handle.
		await dragHandle.hover();
		// Start dragging.
		await page.mouse.down();

		// Move to and hover on the bottom half of the paragraph block to trigger the indicator.
		const secondParagraph = page.locator(
			'role=document[name="Paragraph block"i] >> text=2'
		);
		const secondParagraphBound = await secondParagraph.boundingBox();
		// Call the move function twice to make sure the `dragOver` event is sent.
		// @see https://github.com/microsoft/playwright/issues/17153
		for ( let i = 0; i < 2; i += 1 ) {
			await page.mouse.move(
				secondParagraphBound.x,
				secondParagraphBound.y + secondParagraphBound.height * 0.75
			);
		}

		await expect(
			page.locator( 'data-testid=block-draggable-chip >> visible=true' )
		).toBeVisible();

		const indicator = page.locator(
			'data-testid=block-list-insertion-point-indicator'
		);
		await expect( indicator ).toBeVisible();
		// Expect the indicator to be below the second paragraph.
		await expect
			.poll( () =>
				indicator.boundingBox().then( ( { y, height } ) => y + height )
			)
			.toBeGreaterThan(
				secondParagraphBound.y + secondParagraphBound.height
			);

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

	test( 'can drag and drop to the start of a horizontal block list', async ( {
		editor,
		page,
	} ) => {
		// Insert a row.
		await editor.insertBlock( {
			name: 'core/group',
			attributes: {
				layout: { type: 'flex', flexWrap: 'nowrap' },
			},
			innerBlocks: [
				{
					name: 'core/paragraph',
					attributes: {
						content: '1',
					},
				},
				{
					name: 'core/paragraph',
					attributes: {
						content: '2',
					},
				},
			],
		} );

		await page.focus( 'role=document[name="Paragraph block"i] >> text=2' );
		await editor.showBlockToolbar();

		const dragHandle = page.locator(
			'role=toolbar[name="Block tools"i] >> role=button[name="Drag"i][include-hidden]'
		);
		// Hover to the center of the drag handle.
		await dragHandle.hover();
		// Start dragging.
		await page.mouse.down();

		// Move to and hover on the left half of the paragraph block to trigger the indicator.
		const firstParagraph = page.locator(
			'role=document[name="Paragraph block"i] >> text=1'
		);
		const firstParagraphBound = await firstParagraph.boundingBox();
		// Call the move function twice to make sure the `dragOver` event is sent.
		// @see https://github.com/microsoft/playwright/issues/17153
		for ( let i = 0; i < 2; i += 1 ) {
			await page.mouse.move(
				firstParagraphBound.x + firstParagraphBound.width * 0.25,
				firstParagraphBound.y
			);
		}

		await expect(
			page.locator( 'data-testid=block-draggable-chip >> visible=true' )
		).toBeVisible();

		const indicator = page.locator(
			'data-testid=block-list-insertion-point-indicator'
		);
		await expect( indicator ).toBeVisible();
		// Expect the indicator to be to the left of the first paragraph.
		await expect
			.poll( () => indicator.boundingBox().then( ( { x } ) => x ) )
			.toBeLessThan( firstParagraphBound.x );

		// Drop the paragraph block.
		await page.mouse.up();

		await expect.poll( editor.getEditedPostContent )
			.toBe( `<!-- wp:group {"layout":{"type":"flex","flexWrap":"nowrap"}} -->
<div class="wp-block-group"><!-- wp:paragraph -->
<p>2</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>1</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->` );
	} );

	test( 'can drag and drop to the end of a horizontal block list', async ( {
		editor,
		page,
	} ) => {
		// Insert a row.
		await editor.insertBlock( {
			name: 'core/group',
			attributes: {
				layout: { type: 'flex', flexWrap: 'nowrap' },
			},
			innerBlocks: [
				{
					name: 'core/paragraph',
					attributes: {
						content: '1',
					},
				},
				{
					name: 'core/paragraph',
					attributes: {
						content: '2',
					},
				},
			],
		} );

		await page.focus( 'role=document[name="Paragraph block"i] >> text=1' );
		await editor.showBlockToolbar();

		const dragHandle = page.locator(
			'role=toolbar[name="Block tools"i] >> role=button[name="Drag"i][include-hidden]'
		);
		// Hover to the center of the drag handle.
		await dragHandle.hover();
		// Start dragging.
		await page.mouse.down();

		// Move to and hover on the right half of the paragraph block to trigger the indicator.
		const secondParagraph = page.locator(
			'role=document[name="Paragraph block"i] >> text=2'
		);
		const secondParagraphBound = await secondParagraph.boundingBox();
		// Call the move function twice to make sure the `dragOver` event is sent.
		// @see https://github.com/microsoft/playwright/issues/17153
		for ( let i = 0; i < 2; i += 1 ) {
			await page.mouse.move(
				secondParagraphBound.x + secondParagraphBound.width * 0.75,
				secondParagraphBound.y
			);
		}

		await expect(
			page.locator( 'data-testid=block-draggable-chip >> visible=true' )
		).toBeVisible();

		const indicator = page.locator(
			'data-testid=block-list-insertion-point-indicator'
		);
		await expect( indicator ).toBeVisible();
		// Expect the indicator to be to the right of the second paragraph.
		await expect
			.poll( () =>
				indicator.boundingBox().then( ( { x, width } ) => x + width )
			)
			.toBeGreaterThan(
				secondParagraphBound.x + secondParagraphBound.width
			);

		// Drop the paragraph block.
		await page.mouse.up();

		await expect.poll( editor.getEditedPostContent )
			.toBe( `<!-- wp:group {"layout":{"type":"flex","flexWrap":"nowrap"}} -->
<div class="wp-block-group"><!-- wp:paragraph -->
<p>2</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>1</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->` );
	} );
} );
