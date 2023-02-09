/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'List view', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'allows a user to drag a block to a new sibling position', async ( {
		editor,
		page,
	} ) => {
		// Insert a couple of blocks of different types.
		await editor.insertBlock( { name: 'core/heading' } );
		await editor.insertBlock( { name: 'core/image' } );
		await editor.insertBlock( { name: 'core/paragraph' } );
		await expect
			.poll( editor.getBlocks )
			.toMatchObject( [
				{ name: 'core/heading' },
				{ name: 'core/image' },
				{ name: 'core/paragraph' },
			] );

		// Bring up the paragraph block selection menu.
		await page.keyboard.press( 'Escape' );

		// Drag the paragraph above the heading.
		const paragraphBlockDragButton = page.locator(
			'button[draggable="true"][aria-label="Drag"]'
		);
		const headingBlock = page.getByRole( 'document', {
			name: 'Block: Heading',
		} );
		await paragraphBlockDragButton.dragTo( headingBlock, { x: 0, y: 0 } );
		await expect
			.poll( editor.getBlocks )
			.toMatchObject( [
				{ name: 'core/paragraph' },
				{ name: 'core/heading' },
				{ name: 'core/image' },
			] );
	} );

	// Check for regressions of https://github.com/WordPress/gutenberg/issues/38763.
	test( 'shows the correct amount of blocks after a block is removed in the canvas', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Insert a couple of blocks of different types.
		await editor.insertBlock( { name: 'core/image' } );
		await editor.insertBlock( { name: 'core/heading' } );
		await editor.insertBlock( { name: 'core/paragraph' } );

		// Open list view.
		await pageUtils.pressKeyWithModifier( 'access', 'o' );
		const blockList = page.getByRole( 'treegrid', {
			name: 'Block navigation structure',
		} );

		// The last inserted paragraph block should be selected.
		await blockList
			.getByRole( 'gridcell', {
				name: 'Paragraph link',
				selected: true,
			} )
			.waitFor();

		// Go to the image block in list view.
		await pageUtils.pressKeyTimes( 'ArrowUp', 2 );
		await expect(
			blockList
				.getByRole( 'gridcell', {
					name: 'Image link',
				} )
				.locator( 'a' )
		).toBeFocused();

		// Select the image block in the canvas.
		await page.keyboard.press( 'Enter' );
		const imageBlock = page.getByRole( 'document', {
			name: 'Block: Image',
		} );
		await expect(
			imageBlock.getByRole( 'button', { name: 'Upload' } )
		).toBeFocused();
		await page.keyboard.press( 'ArrowUp' );
		await expect( imageBlock ).toBeFocused();

		// Start listeninig to console errors.
		let hasThrownConsoleError = false;
		page.on( 'console', ( msg ) => {
			if ( msg.type() === 'error' ) {
				hasThrownConsoleError = true;
			}
		} );

		// Delete the image block in the canvas.
		await page.keyboard.press( 'Backspace' );

		// List view should have two rows.
		await expect(
			blockList.getByRole( 'gridcell', { name: /link/i } )
		).toHaveCount( 2 );

		// Ensure console didn't throw an error as reported in
		// https://github.com/WordPress/gutenberg/issues/38763.
		await expect( hasThrownConsoleError ).toBeFalsy();
	} );

	// Check for regression of https://github.com/WordPress/gutenberg/issues/39026
	test( 'should select previous block after removing selected one', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Insert a couple of blocks of different types.
		await editor.insertBlock( { name: 'core/image' } );
		await editor.insertBlock( { name: 'core/heading' } );
		await editor.insertBlock( { name: 'core/paragraph' } );

		// Open list view.
		await pageUtils.pressKeyWithModifier( 'access', 'o' );
		const blockList = page.getByRole( 'treegrid', {
			name: 'Block navigation structure',
		} );

		// The last inserted paragraph block should be selected.
		await blockList
			.getByRole( 'gridcell', {
				name: 'Paragraph link',
				selected: true,
			} )
			.waitFor();

		// Remove the Paragraph block via its options menu in list view.
		await blockList
			.getByRole( 'button', { name: 'Options for Paragraph block' } )
			.click();
		await page
			.getByRole( 'menuitem', { name: /Remove Paragraph/i } )
			.click();

		// Heading block should be selected as previous block.
		await expect(
			page.getByRole( 'document', {
				name: 'Block: Heading',
			} )
		).toBeFocused();
	} );
} );
