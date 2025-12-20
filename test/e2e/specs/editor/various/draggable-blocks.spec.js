/**
 * External dependencies
 */
const path = require( 'path' );

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

async function dragTo( page, x, y ) {
	// Call the move function twice to make sure the `dragOver` event is sent.
	// @see https://github.com/microsoft/playwright/issues/17153
	for ( let i = 0; i < 2; i += 1 ) {
		await page.mouse.move( x, y );
	}
}

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

		await editor.canvas
			.locator( 'role=document[name="Block: Paragraph"i] >> text=2' )
			.focus();
		await editor.showBlockToolbar();

		const dragHandle = page.locator(
			'role=toolbar[name="Block tools"i] >> role=button[name="Drag"i][include-hidden]'
		);
		// Hover to the center of the drag handle.
		await dragHandle.hover();
		// Start dragging.
		await page.mouse.down();

		// Move to and hover on the upper half of the paragraph block to trigger the indicator.
		const firstParagraph = editor.canvas.locator(
			'role=document[name="Block: Paragraph"i] >> text=1'
		);
		const firstParagraphBound = await firstParagraph.boundingBox();
		await dragTo( page, firstParagraphBound.x, firstParagraphBound.y );

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

		await editor.canvas
			.locator( 'role=document[name="Block: Paragraph"i] >> text=1' )
			.focus();
		await editor.showBlockToolbar();

		const dragHandle = page.locator(
			'role=toolbar[name="Block tools"i] >> role=button[name="Drag"i][include-hidden]'
		);
		// Hover to the center of the drag handle.
		await dragHandle.hover();
		// Start dragging.
		await page.mouse.down();

		// Move to and hover on the bottom half of the paragraph block to trigger the indicator.
		const secondParagraph = editor.canvas.locator(
			'role=document[name="Block: Paragraph"i] >> text=2'
		);
		const secondParagraphBound = await secondParagraph.boundingBox();
		await dragTo(
			page,
			secondParagraphBound.x + 32,
			secondParagraphBound.y + secondParagraphBound.height * 0.75
		);

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

		await editor.canvas
			.locator( 'role=document[name="Block: Paragraph"i] >> text=2' )
			.focus();
		await editor.showBlockToolbar();

		const dragHandle = page.locator(
			'role=toolbar[name="Block tools"i] >> role=button[name="Drag"i][include-hidden]'
		);
		// Hover to the center of the drag handle.
		await dragHandle.hover();
		// Start dragging.
		await page.mouse.down();

		// Move to and hover on the left half of the paragraph block to trigger the indicator.
		const firstParagraph = editor.canvas.locator(
			'role=document[name="Block: Paragraph"i] >> text=1'
		);
		const firstParagraphBound = await firstParagraph.boundingBox();
		await dragTo(
			page,
			firstParagraphBound.x + firstParagraphBound.width * 0.25,
			firstParagraphBound.y
		);

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

		await editor.canvas
			.locator( 'role=document[name="Block: Paragraph"i] >> text=1' )
			.focus();
		await editor.showBlockToolbar();

		const dragHandle = page.locator(
			'role=toolbar[name="Block tools"i] >> role=button[name="Drag"i][include-hidden]'
		);
		// Hover to the center of the drag handle.
		await dragHandle.hover();
		// Start dragging.
		await page.mouse.down();

		// Move to and hover on the right half of the paragraph block to trigger the indicator.
		const secondParagraph = editor.canvas.locator(
			'role=document[name="Block: Paragraph"i] >> text=2'
		);
		const secondParagraphBound = await secondParagraph.boundingBox();
		await dragTo(
			page,
			secondParagraphBound.x + secondParagraphBound.width * 0.75,
			secondParagraphBound.y
		);

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

	test( 'can drag and drop to an empty parent block like Group or Columns', async ( {
		page,
		editor,
		pageUtils,
	} ) => {
		// Insert a row.
		await editor.insertBlock( {
			name: 'core/group',
			attributes: {
				layout: { type: 'flex', flexWrap: 'nowrap' },
			},
		} );
		await editor.insertBlock( {
			name: 'core/columns',
			innerBlocks: [
				{
					name: 'core/column',
					innerBlocks: [
						{
							name: 'core/paragraph',
							attributes: { content: '1' },
						},
					],
				},
				{ name: 'core/column' },
				{
					name: 'core/column',
					innerBlocks: [
						{
							name: 'core/paragraph',
							attributes: { content: '3' },
						},
					],
				},
			],
		} );

		// Deselect the block to hide the block toolbar.
		await page.evaluate( () =>
			window.wp.data.dispatch( 'core/block-editor' ).clearSelectedBlock()
		);

		const testImageName = '10x10_e2e_test_image_z9T8jK.png';
		const testImagePath = path.join(
			__dirname,
			'../../../assets',
			testImageName
		);

		{
			const { dragOver, drop } =
				await pageUtils.dragFiles( testImagePath );

			const rowBlock = editor.canvas.getByRole( 'document', {
				name: 'Block: Row',
			} );
			const rowAppender = rowBlock.getByRole( 'button', {
				name: 'Add block',
			} );

			await dragOver( rowAppender );
			// Expect to show the drop indicator blue background.
			// This is technically an implementation detail but easier to test in this case.
			await expect(
				rowAppender,
				'Dragging over the button block appender should show the blue background'
			).toHaveCSS( 'background-color', 'rgb(0, 124, 186)' );

			const { width: rowWidth } = await rowBlock.boundingBox();
			await dragOver( rowBlock, { position: { x: rowWidth - 10 } } );
			// Expect to show the drop indicator blue background.
			// This is technically an implementation detail but easier to test in this case.
			await expect(
				rowAppender,
				'Dragging over the empty group block but outside the appender should still show the blue background'
			).toHaveCSS( 'background-color', 'rgb(0, 124, 186)' );

			await drop();
			await expect( rowAppender ).toBeHidden();
			await expect.poll( editor.getBlocks ).toMatchObject( [
				{
					name: 'core/group',
					innerBlocks: [ { name: 'core/image' } ],
				},
				{ name: 'core/columns' },
			] );
		}

		{
			const { dragOver, drop } =
				await pageUtils.dragFiles( testImagePath );

			const columnAppender = editor.canvas
				.getByRole( 'document', {
					name: 'Block: Column',
				} )
				.getByRole( 'button', {
					name: 'Add block',
					includeHidden: true,
				} );

			await dragOver( columnAppender );
			// Expect to show the drop indicator blue background.
			// This is technically an implementation detail but easier to test in this case.
			await expect( columnAppender ).toHaveCSS(
				'background-color',
				'rgb(0, 124, 186)'
			);

			await drop();
			await expect( columnAppender ).toBeHidden();
			await expect.poll( editor.getBlocks ).toMatchObject( [
				{ name: 'core/group' },
				{
					name: 'core/columns',
					innerBlocks: [
						{ name: 'core/column' },
						{
							name: 'core/column',
							innerBlocks: [ { name: 'core/image' } ],
						},
						{ name: 'core/column' },
					],
				},
			] );
		}
	} );

	test( 'can directly drag an image', async ( { page, editor } ) => {
		await editor.insertBlock( { name: 'core/image' } );
		await editor.insertBlock( {
			name: 'core/group',
			attributes: { layout: { type: 'constrained' } },
			innerBlocks: [ { name: 'core/paragraph' } ],
		} );

		const imageBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Image',
		} );

		const groupBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Group',
		} );

		await imageBlock.hover();
		await page.mouse.down();
		const groupBlockBox = await groupBlock.boundingBox();
		await dragTo(
			page,
			groupBlockBox.x + groupBlockBox.width * 0.5,
			groupBlockBox.y + groupBlockBox.height * 0.5
		);
		await page.mouse.up();

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/group',
				attributes: {
					tagName: 'div',
					layout: { type: 'constrained' },
				},
				innerBlocks: [
					{
						name: 'core/image',
						attributes: { alt: '', caption: '' },
					},
				],
			},
		] );
	} );
} );
