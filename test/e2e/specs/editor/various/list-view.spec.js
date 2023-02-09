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
		// Insert some blocks of different types.
		await editor.insertBlock( { name: 'core/heading' } );
		await editor.insertBlock( { name: 'core/image' } );
		await editor.insertBlock( { name: 'core/paragraph' } );

		// Bring up the paragraph block selection menu.
		await page.keyboard.press( 'Escape' );

		// Define the drag source and target.
		const paragraphBlockDragButton = page.locator(
			'button[draggable="true"][aria-label="Drag"]'
		);
		const headingBlock = page.getByRole( 'document', {
			name: 'Block: Heading',
		} );

		// Drag the paragraph above the heading.
		await paragraphBlockDragButton.dragTo( headingBlock, { x: 0, y: 0 } );

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );
} );
