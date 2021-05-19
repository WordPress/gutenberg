/**
 * WordPress dependencies
 */
import { createNewPost, showBlockToolbar } from '@wordpress/e2e-test-utils';

describe( 'block mover', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'should show block mover when more than one block exists', async () => {
		// Create a two blocks on the page.
		await page.click( '.block-editor-default-block-appender' );
		await page.keyboard.type( 'First Paragraph' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Second Paragraph' );

		// Select a block so the block mover is rendered.
		await page.focus( '.block-editor-block-list__block' );

		await showBlockToolbar();

		const blockMover = await page.$$( '.block-editor-block-mover' );
		// There should be a block mover.
		expect( blockMover ).toHaveLength( 1 );
	} );

	it( 'should hide block mover when only one block exists', async () => {
		// Create a single block on the page.
		await page.click( '.block-editor-default-block-appender' );
		await page.keyboard.type( 'First Paragraph' );

		// Select a block so the block mover has the possibility of being rendered.
		await page.focus( '.block-editor-block-list__block' );

		await showBlockToolbar();

		// Ensure no block mover exists when only one block exists on the page.
		const blockMover = await page.$$( '.block-editor-block-mover' );
		expect( blockMover ).toHaveLength( 0 );
	} );
} );
