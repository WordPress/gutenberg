/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'block mover', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'should show block mover when more than one block exists', async ( {
		editor,
		page,
	} ) => {
		// Create a two blocks on the page.
		await page.click( '.block-editor-default-block-appender' );
		await page.keyboard.type( 'First Paragraph' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Second Paragraph' );

		// Select a block so the block mover is rendered.
		await page.focus( 'text=First Paragraph' );
		await editor.showBlockToolbar();

		const blockMover = await page.$$( '.block-editor-block-mover' );
		// There should be a block mover.
		expect( blockMover ).toHaveLength( 1 );
	} );

	test( 'should hide block mover when only one block exists', async ( {
		editor,
		page,
	} ) => {
		// Create a single block on the page.
		await page.click( '.block-editor-default-block-appender' );
		await page.keyboard.type( 'First Paragraph' );

		// Select a block so the block mover has the possibility of being rendered.
		await page.focus( 'text=First Paragraph' );

		await editor.showBlockToolbar();

		// Ensure no block mover exists when only one block exists on the page.
		const blockMover = await page.$$( '.block-editor-block-mover' );
		expect( blockMover ).toHaveLength( 0 );
	} );
} );
