/**
 * External dependencies
 */
import {
	fireEvent,
	getEditorHtml,
	initializeEditor,
	addBlock,
	getBlock,
	typeInRichText,
	waitFor,
	within,
} from 'test/helpers';

/**
 * WordPress dependencies
 */
import { getBlockTypes, unregisterBlockType } from '@wordpress/blocks';
import { registerCoreBlocks } from '@wordpress/block-library';

beforeAll( () => {
	// Register all core blocks
	registerCoreBlocks();
} );

afterAll( () => {
	// Clean up registered blocks
	getBlockTypes().forEach( ( block ) => {
		unregisterBlockType( block.name );
	} );
} );

describe( 'Heading block', () => {
	it( 'inserts block', async () => {
		const screen = await initializeEditor();

		// Add block
		await addBlock( screen, 'Heading' );

		// Get block
		const headingBlock = await getBlock( screen, 'Heading' );
		fireEvent.press( headingBlock );
		expect( headingBlock ).toBeVisible();

		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'should set a text color', async () => {
		// Arrange
		const screen = await initializeEditor();
		await addBlock( screen, 'Heading' );

		// Act
		const headingBlock = getBlock( screen, 'Heading' );
		fireEvent.press( headingBlock );
		const headingTextInput =
			within( headingBlock ).getByPlaceholderText( 'Heading' );
		typeInRichText(
			headingTextInput,
			'A quick brown fox jumps over the lazy dog.'
		);
		// Open Block Settings.
		fireEvent.press( screen.getByLabelText( 'Open Settings' ) );

		// Wait for Block Settings to be visible.
		const blockSettingsModal = screen.getByTestId( 'block-settings-modal' );
		await waitFor( () => blockSettingsModal.props.isVisible );

		// Open Text color settings
		fireEvent.press( screen.getByLabelText( 'Text, Default' ) );

		// Tap one color
		fireEvent.press( screen.getByLabelText( 'Pale pink' ) );

		// Dismiss the Block Settings modal.
		fireEvent( blockSettingsModal, 'backdropPress' );

		// Assert
		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'should set a background color', async () => {
		// Arrange
		const screen = await initializeEditor();
		await addBlock( screen, 'Heading' );

		// Act
		const headingBlock = getBlock( screen, 'Heading' );
		fireEvent.press( headingBlock );
		const headingTextInput =
			within( headingBlock ).getByPlaceholderText( 'Heading' );
		typeInRichText(
			headingTextInput,
			'A quick brown fox jumps over the lazy dog.'
		);
		// Open Block Settings.
		fireEvent.press( screen.getByLabelText( 'Open Settings' ) );

		// Wait for Block Settings to be visible.
		const blockSettingsModal = screen.getByTestId( 'block-settings-modal' );
		await waitFor( () => blockSettingsModal.props.isVisible );

		// Open Background color settings
		fireEvent.press( screen.getByLabelText( 'Background, Default' ) );

		// Tap one color
		fireEvent.press( screen.getByLabelText( 'Luminous vivid orange' ) );

		// Dismiss the Block Settings modal.
		fireEvent( blockSettingsModal, 'backdropPress' );

		// Assert
		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'change level dropdown displays active selection', async () => {
		// Arrange
		const screen = await initializeEditor();
		await addBlock( screen, 'Heading' );
		const headingBlock = await getBlock( screen, 'Heading' );

		// Act
		fireEvent.press( headingBlock );
		fireEvent.press( screen.getByLabelText( 'Change level' ) );

		// Assert
		expect(
			within( screen.getByLabelText( 'Heading 2' ) ).getByTestId(
				'bottom-sheet-cell-selected-icon'
			)
		).toBeVisible();
	} );
} );
