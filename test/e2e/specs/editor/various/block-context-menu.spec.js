const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'block context menu', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'opens the options of the block that was right-clicked', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/group',
			attributes: {
				style: { spacing: { padding: { top: '60px', left: '60px' } } },
			},
			innerBlocks: [
				{
					name: 'core/paragraph',
					attributes: { content: 'Inside a group' },
				},
			],
		} );
		// Without a selected block no block toolbar floats over the canvas,
		// so the padding stays clickable.
		await page.evaluate( () =>
			window.wp.data.dispatch( 'core/block-editor' ).clearSelectedBlock()
		);

		// The group's own padding, rather than the paragraph within it.
		await editor.canvas
			.locator( '[data-type="core/group"]' )
			.click( { button: 'right', position: { x: 20, y: 20 } } );

		const menu = page.getByRole( 'menu', { name: 'Options' } );
		await expect( menu ).toBeVisible();
		await menu.getByRole( 'menuitem', { name: 'Duplicate' } ).click();

		await expect
			.poll( () => editor.getBlocks() )
			.toMatchObject( [
				{ name: 'core/group' },
				{ name: 'core/group' },
			] );
	} );

	test( 'leaves the browser its own menu for text', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'A paragraph' },
		} );

		await editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.click( { button: 'right' } );

		await expect(
			page.getByRole( 'menu', { name: 'Options' } )
		).toBeHidden();
	} );

	test( 'leaves the browser its own menu for an image', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/image',
			attributes: {
				url: 'https://cldup.com/cXyG__fTLN.jpg',
				alt: 'Mountain',
			},
		} );

		await editor.canvas
			.getByRole( 'document', { name: 'Block: Image' } )
			.getByRole( 'img', { name: 'Mountain' } )
			.click( { button: 'right' } );

		await expect(
			page.getByRole( 'menu', { name: 'Options' } )
		).toBeHidden();
	} );

	test( 'leaves the browser its own menu for a text selection reaching into another block', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Alpha bravo charlie delta echo' },
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Foxtrot golf hotel india juliet' },
		} );

		// Without a selected block no block toolbar floats over the canvas,
		// so the paragraphs stay clickable.
		await page.evaluate( () =>
			window.wp.data.dispatch( 'core/block-editor' ).clearSelectedBlock()
		);

		const paragraphs = editor.canvas.getByRole( 'document', {
			name: 'Block: Paragraph',
		} );
		await paragraphs.first().click( { position: { x: 60, y: 10 } } );
		await paragraphs
			.last()
			.click( { modifiers: [ 'Shift' ], position: { x: 60, y: 10 } } );

		// Such a selection reports as a multi-selection, but it is still a
		// text selection, so the browser's menu is the useful one.
		await expect
			.poll( () =>
				page.evaluate( () =>
					window.wp.data
						.select( 'core/block-editor' )
						.hasMultiSelection()
				)
			)
			.toBe( true );

		await paragraphs
			.last()
			.click( { button: 'right', position: { x: 60, y: 10 } } );

		await expect(
			page.getByRole( 'menu', { name: 'Options' } )
		).toBeHidden();
	} );

	test( 'acts on the whole selection when right-clicked within it', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'First' },
		} );
		await editor.insertBlock( { name: 'core/spacer' } );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Second' },
		} );

		const paragraphs = editor.canvas.getByRole( 'document', {
			name: 'Block: Paragraph',
		} );
		await editor.selectBlocks( paragraphs.first(), paragraphs.last() );

		// The secondary button would otherwise place a caret in the clicked
		// paragraph, collapsing the selection the menu is for.
		await paragraphs.last().click( { button: 'right' } );

		await expect
			.poll( () =>
				page.evaluate(
					() =>
						window.wp.data
							.select( 'core/block-editor' )
							.getSelectedBlockClientIds().length
				)
			)
			.toBe( 3 );

		await page
			.getByRole( 'menu', { name: 'Options' } )
			.getByRole( 'menuitem', { name: 'Delete' } )
			.click();

		await expect.poll( () => editor.getBlocks() ).toMatchObject( [] );
	} );

	test( 'is off when right-click overrides are disabled', async ( {
		editor,
		page,
	} ) => {
		await editor.setPreferences( 'core', {
			allowRightClickOverrides: false,
		} );
		await editor.insertBlock( { name: 'core/separator' } );

		await editor.canvas
			.locator( '[data-type="core/separator"]' )
			.click( { button: 'right' } );

		await expect(
			page.getByRole( 'menu', { name: 'Options' } )
		).toBeHidden();
	} );
} );
