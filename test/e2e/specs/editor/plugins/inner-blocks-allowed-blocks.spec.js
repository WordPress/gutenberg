/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Allowed Blocks Setting on InnerBlocks', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin(
			'gutenberg-test-innerblocks-allowed-blocks'
		);
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-innerblocks-allowed-blocks'
		);
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'allows all blocks if the allowed blocks setting was not set', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/group',
			attributes: {
				layout: { type: 'constrained' },
			},
			innerBlocks: [
				{
					name: 'core/paragraph',
					attributes: { placeholder: 'Add a description' },
				},
			],
		} );

		await editor.canvas
			.getByRole( 'document', {
				name: 'Empty block',
			} )
			.click();

		const blockInserter = page
			.getByRole( 'toolbar', { name: 'Document tools' } )
			.getByRole( 'button', { name: 'Block Inserter', exact: true } );
		const blockLibrary = page
			.getByRole( 'region', {
				name: 'Block Library',
			} )
			.locator(
				'.block-editor-inserter__insertable-blocks-at-selection'
			);

		await blockInserter.click();
		await expect( blockLibrary ).toBeVisible();
		expect(
			await blockLibrary.getByRole( 'option' ).count()
		).toBeGreaterThan( 10 );
	} );

	test( 'limits the blocks if the allowed blocks setting was set', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/group',
			attributes: {
				layout: { type: 'constrained' },
				allowedBlocks: [
					'core/paragraph',
					'core/heading',
					'core/image',
				],
			},
			innerBlocks: [
				{
					name: 'core/paragraph',
					attributes: { placeholder: 'Add a description' },
				},
			],
		} );

		// Select inner block.
		await editor.canvas
			.getByRole( 'document', {
				name: 'Empty block',
			} )
			.click();

		const blockInserter = page
			.getByRole( 'toolbar', { name: 'Document tools' } )
			.getByRole( 'button', { name: 'Block Inserter', exact: true } );
		const blockLibrary = page
			.getByRole( 'region', {
				name: 'Block Library',
			} )
			.locator(
				'.block-editor-inserter__insertable-blocks-at-selection'
			);

		await blockInserter.click();
		await expect( blockLibrary ).toBeVisible();
		await expect( blockLibrary.getByRole( 'option' ) ).toHaveText( [
			'Paragraph',
			'Heading',
			'Image',
		] );
	} );

	// Note: This behavior isn't fully supported. See https://github.com/WordPress/gutenberg/issues/14515.
	test( 'correctly applies dynamic allowed blocks restrictions', async ( {
		editor,
		page,
	} ) => {
		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();
		await page.keyboard.type( '/Allowed Blocks Dynamic' );
		await page.keyboard.press( 'Enter' );

		const blockAppender = editor.canvas.getByRole( 'button', {
			name: 'Add block',
		} );
		await expect( blockAppender ).toBeVisible();
		await blockAppender.click();

		const blockListBox = page.getByRole( 'listbox', { name: 'Blocks' } );
		await expect( blockListBox ).toBeVisible();
		await expect( blockListBox.getByRole( 'option' ) ).toHaveText( [
			'Image',
			'List',
		] );

		// Insert list block.
		await blockListBox.getByRole( 'option', { name: 'List' } ).click();
		// Select the list wrapper and then parent block.
		await page.keyboard.press( 'ArrowUp' );
		await editor.clickBlockToolbarButton(
			'Select parent block: Allowed Blocks Dynamic'
		);

		// Insert the image.
		await blockAppender.click();
		await blockListBox.getByRole( 'option', { name: 'Image' } ).click();

		await editor.clickBlockToolbarButton(
			'Select parent block: Allowed Blocks Dynamic'
		);
		await blockAppender.click();

		// It should display a different allowed block list.
		await expect( blockListBox.getByRole( 'option' ) ).toHaveText( [
			'Gallery',
			'Video',
		] );

		await blockListBox.getByRole( 'option', { name: 'Gallery' } ).click();

		await editor.clickBlockToolbarButton(
			'Select parent block: Allowed Blocks Dynamic'
		);
		await blockAppender.click();

		// It should display a different allowed block list.
		await expect( blockListBox.getByRole( 'option' ) ).toHaveText( [
			'Gallery',
			'List',
			'Video',
		] );
	} );
} );
