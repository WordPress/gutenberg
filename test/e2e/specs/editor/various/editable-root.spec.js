const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'editableRoot host mode', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'wrapper becomes the editing host for a paragraph with siblings', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'a' },
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'b' },
		} );
		await page.keyboard.press( 'ArrowUp' );

		// Host mode: the selected block has a contentEditable ancestor above it
		// (the canvas wrapper), which does not happen when the block is edited
		// on its own element.
		await expect
			.poll( () =>
				editor.canvas
					.locator( ':root' )
					.evaluate(
						( root ) =>
							!! root.ownerDocument.querySelector(
								'[contenteditable="true"] [data-block]'
							)
					)
			)
			.toBe( true );
	} );

	test( 'wrapper becomes the editing host for a list item with siblings', async ( {
		editor,
	} ) => {
		await editor.insertBlock( {
			name: 'core/list',
			innerBlocks: [
				{ name: 'core/list-item', attributes: { content: 'a' } },
				{ name: 'core/list-item', attributes: { content: 'b' } },
			],
		} );
		await editor.selectBlocks(
			editor.canvas
				.getByRole( 'document', { name: 'Block: List item' } )
				.first()
		);

		await expect
			.poll( () =>
				editor.canvas
					.locator( ':root' )
					.evaluate(
						( root ) =>
							!! root.ownerDocument.querySelector(
								'[contenteditable="true"] [data-block]'
							)
					)
			)
			.toBe( true );
	} );

	test( 'wrapper becomes the editing host for a heading with siblings', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/heading',
			attributes: { content: 'a' },
		} );
		await editor.insertBlock( {
			name: 'core/heading',
			attributes: { content: 'b' },
		} );
		await page.keyboard.press( 'ArrowUp' );

		await expect
			.poll( () =>
				editor.canvas
					.locator( ':root' )
					.evaluate(
						( root ) =>
							!! root.ownerDocument.querySelector(
								'[contenteditable="true"] [data-block]'
							)
					)
			)
			.toBe( true );
	} );
} );

test.describe( 'Click into a block edited on its own element (@firefox, @webkit)', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'places the caret in a quote paragraph clicked from a heading', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/heading',
			attributes: { content: 'Heading' },
		} );
		await editor.insertBlock( {
			name: 'core/quote',
			innerBlocks: [
				{
					name: 'core/paragraph',
					attributes: { content: 'Quote here' },
				},
			],
		} );
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Heading' } )
			.click();
		const [ heading, quote ] = await editor.getBlocks( { full: true } );
		const quoteParagraph = quote.innerBlocks[ 0 ];
		const getSelectedBlockClientId = () =>
			page.evaluate( () =>
				window.wp.data
					.select( 'core/block-editor' )
					.getSelectedBlockClientId()
			);
		await expect.poll( getSelectedBlockClientId ).toBe( heading.clientId );

		// The paragraph is wider than its text: the caret goes to the end.
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.click();
		await expect
			.poll( getSelectedBlockClientId )
			.toBe( quoteParagraph.clientId );
		await page.keyboard.type( 'X' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{ name: 'core/heading', attributes: { content: 'Heading' } },
			{
				name: 'core/quote',
				innerBlocks: [
					{
						name: 'core/paragraph',
						attributes: { content: 'Quote hereX' },
					},
				],
			},
		] );
	} );

	test( 'selects the heading and the quote on Shift-click into the quote', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/heading',
			attributes: { content: 'Heading' },
		} );
		await editor.insertBlock( {
			name: 'core/quote',
			innerBlocks: [
				{
					name: 'core/paragraph',
					attributes: { content: 'Quote here' },
				},
			],
		} );
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Heading' } )
			.click();
		const [ heading, quote ] = await editor.getBlocks( { full: true } );
		const getSelectedBlockClientIds = () =>
			page.evaluate( () =>
				window.wp.data
					.select( 'core/block-editor' )
					.getSelectedBlockClientIds()
			);
		await expect
			.poll( getSelectedBlockClientIds )
			.toEqual( [ heading.clientId ] );

		await editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.click( { modifiers: [ 'Shift' ] } );

		await expect
			.poll( getSelectedBlockClientIds )
			.toEqual( [ heading.clientId, quote.clientId ] );
	} );

	test( 'places the caret in an image caption clicked from a heading', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/heading',
			attributes: { content: 'Heading' },
		} );
		await editor.insertBlock( {
			name: 'core/image',
			attributes: {
				url: 'https://cldup.com/cXyG__fTLN.jpg',
				caption: 'Caption',
			},
		} );
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Heading' } )
			.click();
		const [ heading, image ] = await editor.getBlocks( { full: true } );
		const getSelectedBlockClientId = () =>
			page.evaluate( () =>
				window.wp.data
					.select( 'core/block-editor' )
					.getSelectedBlockClientId()
			);
		await expect.poll( getSelectedBlockClientId ).toBe( heading.clientId );

		// Click at the right edge: the caption text is centered.
		const caption = editor.canvas.getByRole( 'textbox', {
			name: 'Image caption text',
			exact: true,
		} );
		const { width, height } = await caption.boundingBox();
		await caption.click( { position: { x: width - 1, y: height / 2 } } );
		await expect.poll( getSelectedBlockClientId ).toBe( image.clientId );
		await page.keyboard.type( 'X' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{ name: 'core/heading', attributes: { content: 'Heading' } },
			{ name: 'core/image', attributes: { caption: 'CaptionX' } },
		] );
	} );
} );
