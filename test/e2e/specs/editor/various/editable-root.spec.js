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

	test.describe( 'Return that replaces a wrapper block', () => {
		// Records focus moving inside the canvas from now on.
		async function recordFocusMoves( editor ) {
			await editor.canvas.locator( ':root' ).evaluate( ( root ) => {
				const doc = root.ownerDocument;
				doc.defaultView.focusMoves = [];
				for ( const type of [ 'focusout', 'focusin' ] ) {
					doc.addEventListener(
						type,
						( event ) =>
							doc.defaultView.focusMoves.push(
								`${ type } ${ event.target.tagName }`
							),
						true
					);
				}
			} );
		}

		function getFocusMoves( editor ) {
			return editor.canvas
				.locator( ':root' )
				.evaluate(
					( root ) => root.ownerDocument.defaultView.focusMoves
				);
		}

		test( 'puts the caret in the paragraph after a list without moving focus', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( { name: 'core/list' } );
			await page.keyboard.type( 'one' );
			await page.keyboard.press( 'Enter' );
			await expect.poll( editor.getBlocks ).toMatchObject( [
				{
					name: 'core/list',
					innerBlocks: [
						{ attributes: { content: 'one' } },
						{ attributes: { content: '' } },
					],
				},
			] );

			await recordFocusMoves( editor );
			await page.keyboard.press( 'Enter' );
			await page.keyboard.type( '‸' );

			await expect.poll( editor.getBlocks ).toMatchObject( [
				{
					name: 'core/list',
					innerBlocks: [ { attributes: { content: 'one' } } ],
				},
				{ name: 'core/paragraph', attributes: { content: '‸' } },
			] );
			expect( await getFocusMoves( editor ) ).toEqual( [] );
		} );

		test( 'puts the caret in the paragraph between split quotes without moving focus', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( {
				name: 'core/quote',
				innerBlocks: [
					{ name: 'core/paragraph', attributes: { content: 'a' } },
					{ name: 'core/paragraph' },
					{ name: 'core/paragraph', attributes: { content: 'b' } },
				],
			} );
			await editor.canvas
				.getByRole( 'document', { name: /^Empty block/ } )
				.click();

			await recordFocusMoves( editor );
			await page.keyboard.press( 'Enter' );
			await page.keyboard.type( '‸' );

			await expect.poll( editor.getBlocks ).toMatchObject( [
				{
					name: 'core/quote',
					innerBlocks: [ { attributes: { content: 'a' } } ],
				},
				{ name: 'core/paragraph', attributes: { content: '‸' } },
				{
					name: 'core/quote',
					innerBlocks: [ { attributes: { content: 'b' } } ],
				},
			] );
			expect( await getFocusMoves( editor ) ).toEqual( [] );
		} );
	} );
} );
