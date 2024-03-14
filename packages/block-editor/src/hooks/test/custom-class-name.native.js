/**
 * External dependencies
 */
import {
	addBlock,
	fireEvent,
	changeTextOfTextInput,
	getEditorHtml,
	initializeEditor,
	openBlockSettings,
	screen,
	setupCoreBlocks,
} from 'test/helpers';

setupCoreBlocks( [ 'core/paragraph' ] );

describe( 'custom class name', () => {
	it( 'should set the HTML class attribute on the block', async () => {
		// Arrange
		await initializeEditor();
		const block = await addBlock( screen, 'Paragraph' );
		await openBlockSettings( screen, block );

		// Act
		await fireEvent.press(
			screen.getByLabelText( 'Additional CSS class(es). Empty' )
		);
		await changeTextOfTextInput(
			await screen.getByPlaceholderText( 'Add classes' ),
			'my-class-name another-class-name'
		);

		// Assert
		expect( getEditorHtml() ).toMatchSnapshot();
	} );
} );
