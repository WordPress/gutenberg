/**
 * External dependencies
 */
import {
	addBlock,
	fireEvent,
	getBlock,
	getEditorHtml,
	initializeEditor,
	screen,
	typeInRichText,
	waitFor,
	within,
} from 'test/helpers';

/**
 * WordPress dependencies
 */
import { getBlockTypes, unregisterBlockType } from '@wordpress/blocks';
import { registerCoreBlocks } from '@wordpress/block-library';
import { BACKSPACE, ENTER } from '@wordpress/keycodes';

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
		await initializeEditor();

		// Add block
		await addBlock( screen, 'Heading' );

		// Get block
		const headingBlock = getBlock( screen, 'Heading' );
		fireEvent.press( headingBlock );
		expect( headingBlock ).toBeVisible();

		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'should set a text color', async () => {
		// Arrange
		await initializeEditor();
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
		// TODO(jest-console): Fix the warning and remove the expect below.
		expect( console ).toHaveWarnedWith(
			`Non-serializable values were found in the navigation state. Check:\n\nColor > params.onColorChange (Function)\n\nThis can break usage such as persisting and restoring state. This might happen if you passed non-serializable values such as function, class instances etc. in params. If you need to use components with callbacks in your options, you can use 'navigation.setOptions' instead. See https://reactnavigation.org/docs/troubleshooting#i-get-the-warning-non-serializable-values-were-found-in-the-navigation-state for more details.`
		);

		// Dismiss the Block Settings modal.
		fireEvent( blockSettingsModal, 'backdropPress' );

		// Assert
		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'should set a background color', async () => {
		// Arrange
		await initializeEditor();
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
		await initializeEditor();
		await addBlock( screen, 'Heading' );
		const headingBlock = getBlock( screen, 'Heading' );

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

	it( 'changes heading level', async () => {
		// Arrange
		await initializeEditor();
		await addBlock( screen, 'Heading' );

		// Act
		fireEvent.press( getBlock( screen, 'Heading' ) );
		fireEvent.press( screen.getByLabelText( 'Change level' ) );
		fireEvent.press( screen.getByLabelText( 'Heading 6' ) );

		// Assert
		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'should merge with an empty Paragraph block and keep being the Heading block', async () => {
		// Arrange
		await initializeEditor();
		await addBlock( screen, 'Paragraph' );

		// Act
		const paragraphBlock = getBlock( screen, 'Paragraph' );
		fireEvent.press( paragraphBlock );

		const paragraphTextInput =
			within( paragraphBlock ).getByPlaceholderText( 'Start writing…' );
		fireEvent( paragraphTextInput, 'onKeyDown', {
			nativeEvent: {},
			preventDefault() {},
			keyCode: ENTER,
		} );

		await addBlock( screen, 'Heading' );
		const headingBlock = getBlock( screen, 'Heading', { rowIndex: 2 } );
		fireEvent.press( headingBlock );

		const headingTextInput =
			within( headingBlock ).getByPlaceholderText( 'Heading' );
		typeInRichText(
			headingTextInput,
			'A quick brown fox jumps over the lazy dog.',
			{ finalSelectionStart: 0, finalSelectionEnd: 0 }
		);

		fireEvent( headingTextInput, 'onKeyDown', {
			nativeEvent: {},
			preventDefault() {},
			keyCode: BACKSPACE,
		} );

		// Assert
		expect( getEditorHtml() ).toMatchSnapshot();
	} );
} );
