/**
 * External dependencies
 */
import {
	addBlock,
	fireEvent,
	getBlock,
	initializeEditor,
	setupCoreBlocks,
} from 'test/helpers';

setupCoreBlocks();

describe( 'Block Toolbar', () => {
	it( "doesn't render the block settings button if there aren't any settings for the current selected block", async () => {
		// Arrange
		const screen = await initializeEditor();
		await addBlock( screen, 'Shortcode' );

		// Assert
		expect( screen.queryByLabelText( 'Open Settings' ) ).toBeNull();
	} );

	it( 'renders the block settings button for the current selected block', async () => {
		// Arrange
		const screen = await initializeEditor();
		await addBlock( screen, 'Paragraph' );

		// Act
		const paragraphBlock = await getBlock( screen, 'Paragraph' );
		fireEvent.press( paragraphBlock );

		// Assert
		expect( screen.queryByLabelText( 'Open Settings' ) ).toBeVisible();
	} );
} );
