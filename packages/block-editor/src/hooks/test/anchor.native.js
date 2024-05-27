/**
 * External dependencies
 */
import {
	addBlock,
	changeTextOfTextInput,
	getEditorHtml,
	initializeEditor,
	openBlockSettings,
	screen,
	setupCoreBlocks,
} from 'test/helpers';

setupCoreBlocks( [ 'core/paragraph' ] );

describe( 'anchor', () => {
	it( 'should set the ID attribute on the block', async () => {
		// Arrange
		await initializeEditor();
		const block = await addBlock( screen, 'Paragraph' );
		await openBlockSettings( screen, block );

		// Act
		await changeTextOfTextInput(
			await screen.getByPlaceholderText( 'Add an anchor' ),
			'my-anchor'
		);

		// Assert
		expect( getEditorHtml() ).toMatchSnapshot();
	} );
} );
