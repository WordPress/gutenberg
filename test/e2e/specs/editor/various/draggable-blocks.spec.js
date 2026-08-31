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

		// Select the first paragraph by clicking it. Focusing it
		// programmatically does not move focus while the second, editable
		// root paragraph is selected and its wrapper holds focus (a nested
		// editable element cannot take focus from an editing host ancestor).
		await editor.canvas
			.locator( 'role=document[name="Block: Paragraph"i] >> text=1' )
			.click();
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
		const testImagePath = `./assets/${ testImageName }`;

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
			).toHaveCSS(
				'background-color',
				/rgb\(0, 124, 186\)|rgb\(56, 88, 233\)/
			);

			const { width: rowWidth } = await rowBlock.boundingBox();
			await dragOver( rowBlock, { position: { x: rowWidth - 10 } } );
			// Expect to show the drop indicator blue background.
			// This is technically an implementation detail but easier to test in this case.
			await expect(
				rowAppender,
				'Dragging over the empty group block but outside the appender should still show the blue background'
			).toHaveCSS(
				'background-color',
				/rgb\(0, 124, 186\)|rgb\(56, 88, 233\)/
			);

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
				/rgb\(0, 124, 186\)|rgb\(56, 88, 233\)/
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

	test( 'renders the drag chip inside the wp compat overlay slot', async ( {
		editor,
		page,
	} ) => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2' );

		await editor.canvas
			.locator( 'role=document[name="Block: Paragraph"i] >> text=2' )
			.focus();
		await editor.showBlockToolbar();

		const dragHandle = page.locator(
			'role=toolbar[name="Block tools"i] >> role=button[name="Drag"i][include-hidden]'
		);
		await dragHandle.hover();
		await page.mouse.down();

		const firstParagraph = editor.canvas.locator(
			'role=document[name="Block: Paragraph"i] >> text=1'
		);
		const firstParagraphBound = await firstParagraph.boundingBox();
		await dragTo( page, firstParagraphBound.x, firstParagraphBound.y );

		const chip = page.locator(
			'data-testid=block-draggable-chip >> visible=true'
		);
		await expect( chip ).toBeVisible();

		// Living in the compat overlay slot is what keeps the chip above
		// any `@wordpress/components` overlays opened mid-drag.
		const chipIsInsideCompatSlot = await chip.evaluate(
			( el ) => el.closest( '[data-wp-compat-overlay-slot]' ) !== null
		);
		expect( chipIsInsideCompatSlot ).toBe( true );

		await page.mouse.up();
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

	test( 'can drag a multi-selection by dragging inside a selected block', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( { name: 'core/spacer' } );
		await editor.insertBlock( { name: 'core/separator' } );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'end' },
		} );

		// Confirm correct setup.
		await expect
			.poll( editor.getBlocks )
			.toMatchObject( [
				{ name: 'core/spacer' },
				{ name: 'core/separator' },
				{ name: 'core/paragraph', attributes: { content: 'end' } },
			] );

		// Select the spacer and the separator.
		const spacerBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Spacer',
		} );
		const separatorBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Separator',
		} );
		await spacerBlock.click();
		await separatorBlock.click( { modifiers: [ 'Shift' ] } );

		await expect
			.poll( () =>
				page.evaluate( () =>
					window.wp.data
						.select( 'core/block-editor' )
						.getSelectedBlockClientIds()
				)
			)
			.toHaveLength( 2 );

		// Start dragging on one of the selected blocks, not on a drag handle.
		await spacerBlock.hover();
		await page.mouse.down();

		// Move to and hover on the bottom half of the paragraph block to
		// trigger the indicator.
		const paragraph = editor.canvas.locator(
			'role=document[name="Block: Paragraph"i] >> text=end'
		);
		const paragraphBound = await paragraph.boundingBox();
		await dragTo(
			page,
			paragraphBound.x + 32,
			paragraphBound.y + paragraphBound.height * 0.75
		);

		// Both selected blocks follow the pointer as a pile, with the
		// count next to the pointer.
		await expect
			.poll( () => spacerBlock.evaluate( ( n ) => n.style.position ) )
			.toBe( 'relative' );
		await expect
			.poll( () => separatorBlock.evaluate( ( n ) => n.style.position ) )
			.toBe( 'relative' );
		await expect(
			editor.canvas.locator( '.block-editor-block-list__drag-count' )
		).toHaveText( '2' );

		const indicator = page.locator(
			'data-testid=block-list-insertion-point-indicator'
		);
		await expect( indicator ).toBeVisible();
		// Expect the indicator to be below the paragraph.
		await expect
			.poll( () =>
				indicator.boundingBox().then( ( { y, height } ) => y + height )
			)
			.toBeGreaterThan( paragraphBound.y + paragraphBound.height );

		// Drop both blocks after the paragraph.
		await page.mouse.up();

		// The blocks return to the flow when the drag ends.
		await expect
			.poll( () => spacerBlock.evaluate( ( n ) => n.style.position ) )
			.toBe( '' );
		await expect
			.poll( () => separatorBlock.evaluate( ( n ) => n.style.position ) )
			.toBe( '' );
		await expect(
			editor.canvas.locator( '.block-editor-block-list__drag-count' )
		).toHaveCount( 0 );

		await expect
			.poll( editor.getBlocks )
			.toMatchObject( [
				{ name: 'core/paragraph', attributes: { content: 'end' } },
				{ name: 'core/spacer' },
				{ name: 'core/separator' },
			] );
	} );

	test( 'starts a multi-selection drag only from the selected blocks', async ( {
		editor,
		page,
	} ) => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '3' );

		// Confirm correct setup.
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{ name: 'core/paragraph', attributes: { content: '1' } },
			{ name: 'core/paragraph', attributes: { content: '2' } },
			{ name: 'core/paragraph', attributes: { content: '3' } },
		] );

		// Select the first two paragraphs.
		await editor.canvas
			.locator( 'role=document[name="Block: Paragraph"i] >> text=1' )
			.click();
		await page.keyboard.press( 'Escape' );
		await page.keyboard.press( 'Shift+ArrowDown' );

		const selectedClientIds = await page.evaluate( () =>
			window.wp.data
				.select( 'core/block-editor' )
				.getSelectedBlockClientIds()
		);
		expect( selectedClientIds ).toHaveLength( 2 );
		const [ , , thirdClientId ] = await page.evaluate( () =>
			window.wp.data.select( 'core/block-editor' ).getBlockOrder()
		);

		// A drag that starts inside one of the selected blocks carries all
		// selected blocks.
		const selectedResult = await editor.canvas
			.locator( `[data-block="${ selectedClientIds[ 1 ] }"]` )
			.evaluate( ( node ) => {
				const dataTransfer = new DataTransfer();
				const event = new DragEvent( 'dragstart', {
					bubbles: true,
					cancelable: true,
					dataTransfer,
				} );
				const notPrevented = node.dispatchEvent( event );
				return {
					notPrevented,
					data: dataTransfer.getData( 'wp-blocks' ),
				};
			} );
		expect( selectedResult.notPrevented ).toBe( true );
		expect( JSON.parse( selectedResult.data ) ).toMatchObject( {
			type: 'block',
			srcClientIds: selectedClientIds,
			srcRootClientId: '',
		} );
		await expect
			.poll( () =>
				page.evaluate( () =>
					window.wp.data
						.select( 'core/block-editor' )
						.getDraggedBlockClientIds()
				)
			)
			.toEqual( selectedClientIds );

		// End the drag before testing the next case. The event is dispatched
		// on the body because the dragged block is cloned while dragging, so
		// its block selector would match two elements.
		await editor.canvas.locator( 'body' ).evaluate( ( body ) => {
			body.dispatchEvent( new DragEvent( 'dragend', { bubbles: true } ) );
		} );
		await expect
			.poll( () =>
				page.evaluate( () =>
					window.wp.data
						.select( 'core/block-editor' )
						.isDraggingBlocks()
				)
			)
			.toBe( false );

		// A drag that starts inside an unselected block does not carry the
		// multi-selection.
		const unselectedResult = await editor.canvas
			.locator( `[data-block="${ thirdClientId }"]` )
			.evaluate( ( node ) => {
				const dataTransfer = new DataTransfer();
				const event = new DragEvent( 'dragstart', {
					bubbles: true,
					cancelable: true,
					dataTransfer,
				} );
				node.dispatchEvent( event );
				return { data: dataTransfer.getData( 'wp-blocks' ) };
			} );
		expect( unselectedResult.data ).toBe( '' );
		await expect
			.poll( () =>
				page.evaluate( () =>
					window.wp.data
						.select( 'core/block-editor' )
						.isDraggingBlocks()
				)
			)
			.toBe( false );
	} );

	async function multiSelectTwoParagraphs( { editor, page } ) {
		for ( const content of [ 'First', 'Second', 'Landing' ] ) {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content },
			} );
		}
		const paragraphs = editor.canvas.getByRole( 'document', {
			name: 'Block: Paragraph',
		} );
		await paragraphs.nth( 0 ).click();
		await paragraphs.nth( 1 ).click( { modifiers: [ 'Shift' ] } );
		await expect
			.poll( () =>
				page.evaluate( () =>
					window.wp.data
						.select( 'core/block-editor' )
						.getSelectedBlockClientIds()
				)
			)
			.toHaveLength( 2 );
		return paragraphs;
	}

	// Presses to the right of the text of the first selected paragraph,
	// where there are no glyphs, and drags below the last paragraph. The
	// browser only starts a drag by itself when the press lands exactly on
	// selected text; this exercises the mouse event driven drag.
	async function dragSelectionBelowLanding( { page }, paragraphs ) {
		const box = await paragraphs.nth( 0 ).boundingBox();
		await page.mouse.move( box.x + box.width - 20, box.y + box.height / 2 );
		await page.mouse.down();
		const landingBox = await paragraphs.nth( 2 ).boundingBox();
		await page.mouse.move(
			landingBox.x + 40,
			landingBox.y + landingBox.height - 2,
			{ steps: 10 }
		);
		// The drop target computation is throttled; wait until the
		// insertion indicator reaches the drop position before releasing.
		const indicator = page.locator(
			'data-testid=block-list-insertion-point-indicator'
		);
		await expect( indicator ).toBeVisible();
		await expect
			.poll( async () => ( await indicator.boundingBox() ).y )
			.toBeGreaterThan( landingBox.y );
	}

	function isDraggingBlocks( page ) {
		return page.evaluate( () =>
			window.wp.data.select( 'core/block-editor' ).isDraggingBlocks()
		);
	}

	test( 'drags a multi-selection from anywhere inside it', async ( {
		editor,
		page,
	} ) => {
		const paragraphs = await multiSelectTwoParagraphs( { editor, page } );
		await dragSelectionBelowLanding( { page }, paragraphs );
		await expect.poll( () => isDraggingBlocks( page ) ).toBe( true );
		// The first selected block follows the pointer.
		await expect
			.poll( () =>
				paragraphs.nth( 0 ).evaluate( ( n ) => n.style.position )
			)
			.toBe( 'relative' );
		await page.mouse.up();

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{ name: 'core/paragraph', attributes: { content: 'Landing' } },
			{ name: 'core/paragraph', attributes: { content: 'First' } },
			{ name: 'core/paragraph', attributes: { content: 'Second' } },
		] );
	} );

	test( 'pressing Escape cancels a multi-selection drag', async ( {
		editor,
		page,
	} ) => {
		const paragraphs = await multiSelectTwoParagraphs( { editor, page } );
		await dragSelectionBelowLanding( { page }, paragraphs );
		await expect.poll( () => isDraggingBlocks( page ) ).toBe( true );
		await page.keyboard.press( 'Escape' );
		await expect.poll( () => isDraggingBlocks( page ) ).toBe( false );
		// The blocks return to the flow when the drag is canceled.
		await expect
			.poll( () =>
				paragraphs.nth( 0 ).evaluate( ( n ) => n.style.position )
			)
			.toBe( '' );
		await page.mouse.up();

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{ name: 'core/paragraph', attributes: { content: 'First' } },
			{ name: 'core/paragraph', attributes: { content: 'Second' } },
			{ name: 'core/paragraph', attributes: { content: 'Landing' } },
		] );
	} );

	test( 'keeps the blocks selected after dropping a multi-selection', async ( {
		editor,
		page,
	} ) => {
		const paragraphs = await multiSelectTwoParagraphs( { editor, page } );
		await dragSelectionBelowLanding( { page }, paragraphs );
		await page.mouse.up();

		await expect
			.poll( () =>
				page.evaluate( () =>
					window.wp.data
						.select( 'core/block-editor' )
						.getSelectedBlockClientIds()
				)
			)
			.toHaveLength( 2 );
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{ name: 'core/paragraph', attributes: { content: 'Landing' } },
			{ name: 'core/paragraph', attributes: { content: 'First' } },
			{ name: 'core/paragraph', attributes: { content: 'Second' } },
		] );
	} );
} );
