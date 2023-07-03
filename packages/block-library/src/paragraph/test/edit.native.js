/**
 * External dependencies
 */
import {
	act,
	addBlock,
	getBlock,
	typeInRichText,
	fireEvent,
	getEditorHtml,
	initializeEditor,
	render,
	setupCoreBlocks,
	waitFor,
	within,
} from 'test/helpers';
import Clipboard from '@react-native-clipboard/clipboard';

/**
 * WordPress dependencies
 */
import { ENTER } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import Paragraph from '../edit';

setupCoreBlocks();

const getTestComponentWithContent = ( content ) => {
	return render(
		<Paragraph
			attributes={ { content } }
			setAttributes={ jest.fn() }
			onReplace={ jest.fn() }
			insertBlocksAfter={ jest.fn() }
		/>
	);
};

describe( 'Paragraph block', () => {
	it( 'should render without crashing and match snapshot', () => {
		const screen = getTestComponentWithContent( '' );
		expect( screen.toJSON() ).toMatchSnapshot();
	} );

	it( 'should bold text', async () => {
		// Arrange
		const screen = await initializeEditor();
		await addBlock( screen, 'Paragraph' );

		// Act
		const paragraphBlock = getBlock( screen, 'Paragraph' );
		fireEvent.press( paragraphBlock );
		const paragraphTextInput =
			within( paragraphBlock ).getByPlaceholderText( 'Start writing…' );
		typeInRichText(
			paragraphTextInput,
			'A quick brown fox jumps over the lazy dog.',
			{ finalSelectionStart: 2, finalSelectionEnd: 7 }
		);
		fireEvent.press( screen.getByLabelText( 'Bold' ) );

		// Assert
		expect( getEditorHtml() ).toMatchInlineSnapshot( `
		"<!-- wp:paragraph -->
		<p>A <strong>quick</strong> brown fox jumps over the lazy dog.</p>
		<!-- /wp:paragraph -->"
	` );
	} );

	it( 'should italicize text', async () => {
		// Arrange
		const screen = await initializeEditor();
		await addBlock( screen, 'Paragraph' );

		// Act
		const paragraphBlock = getBlock( screen, 'Paragraph' );
		fireEvent.press( paragraphBlock );
		const paragraphTextInput =
			within( paragraphBlock ).getByPlaceholderText( 'Start writing…' );
		typeInRichText(
			paragraphTextInput,
			'A quick brown fox jumps over the lazy dog.',
			{ finalSelectionStart: 2, finalSelectionEnd: 7 }
		);
		fireEvent.press( screen.getByLabelText( 'Italic' ) );

		// Assert
		expect( getEditorHtml() ).toMatchInlineSnapshot( `
		"<!-- wp:paragraph -->
		<p>A <em>quick</em> brown fox jumps over the lazy dog.</p>
		<!-- /wp:paragraph -->"
	` );
	} );

	it( 'should strikethrough text', async () => {
		// Arrange
		const screen = await initializeEditor();
		await addBlock( screen, 'Paragraph' );

		// Act
		const paragraphBlock = getBlock( screen, 'Paragraph' );
		fireEvent.press( paragraphBlock );
		const paragraphTextInput =
			within( paragraphBlock ).getByPlaceholderText( 'Start writing…' );
		typeInRichText(
			paragraphTextInput,
			'A quick brown fox jumps over the lazy dog.',
			{ finalSelectionStart: 2, finalSelectionEnd: 7 }
		);
		fireEvent.press( screen.getByLabelText( 'Strikethrough' ) );

		// Assert
		expect( getEditorHtml() ).toMatchInlineSnapshot( `
		"<!-- wp:paragraph -->
		<p>A <s>quick</s> brown fox jumps over the lazy dog.</p>
		<!-- /wp:paragraph -->"
	` );
	} );

	it( 'should left align text', async () => {
		// Arrange
		const screen = await initializeEditor();
		await addBlock( screen, 'Paragraph' );

		// Act
		const paragraphBlock = getBlock( screen, 'Paragraph' );
		fireEvent.press( paragraphBlock );
		const paragraphTextInput =
			within( paragraphBlock ).getByPlaceholderText( 'Start writing…' );
		typeInRichText(
			paragraphTextInput,
			'A quick brown fox jumps over the lazy dog.'
		);
		fireEvent.press( screen.getByLabelText( 'Align text' ) );
		fireEvent.press( screen.getByLabelText( 'Align text left' ) );

		// Assert
		expect( getEditorHtml() ).toMatchInlineSnapshot( `
		"<!-- wp:paragraph {"align":"left"} -->
		<p class="has-text-align-left">A quick brown fox jumps over the lazy dog.</p>
		<!-- /wp:paragraph -->"
	` );
	} );

	it( 'should center align text', async () => {
		// Arrange
		const screen = await initializeEditor();
		await addBlock( screen, 'Paragraph' );

		// Act
		const paragraphBlock = getBlock( screen, 'Paragraph' );
		fireEvent.press( paragraphBlock );
		const paragraphTextInput =
			within( paragraphBlock ).getByPlaceholderText( 'Start writing…' );
		typeInRichText(
			paragraphTextInput,
			'A quick brown fox jumps over the lazy dog.'
		);
		fireEvent.press( screen.getByLabelText( 'Align text' ) );
		fireEvent.press( screen.getByLabelText( 'Align text center' ) );

		// Assert
		expect( getEditorHtml() ).toMatchInlineSnapshot( `
		"<!-- wp:paragraph {"align":"center"} -->
		<p class="has-text-align-center">A quick brown fox jumps over the lazy dog.</p>
		<!-- /wp:paragraph -->"
	` );
	} );

	it( 'should right align text', async () => {
		// Arrange
		const screen = await initializeEditor();
		await addBlock( screen, 'Paragraph' );

		// Act
		const paragraphBlock = getBlock( screen, 'Paragraph' );
		fireEvent.press( paragraphBlock );
		const paragraphTextInput =
			within( paragraphBlock ).getByPlaceholderText( 'Start writing…' );
		typeInRichText(
			paragraphTextInput,
			'A quick brown fox jumps over the lazy dog.'
		);
		fireEvent.press( screen.getByLabelText( 'Align text' ) );
		fireEvent.press( screen.getByLabelText( 'Align text right' ) );

		// Assert
		expect( getEditorHtml() ).toMatchInlineSnapshot( `
		"<!-- wp:paragraph {"align":"right"} -->
		<p class="has-text-align-right">A quick brown fox jumps over the lazy dog.</p>
		<!-- /wp:paragraph -->"
	` );
	} );

	it( 'should preserve alignment when split', async () => {
		// Arrange
		const screen = await initializeEditor();
		await addBlock( screen, 'Paragraph' );

		// Act
		const paragraphBlock = getBlock( screen, 'Paragraph' );
		fireEvent.press( paragraphBlock );
		fireEvent.press( screen.getByLabelText( 'Align text' ) );
		fireEvent.press( screen.getByLabelText( 'Align text center' ) );
		const paragraphTextInput =
			within( paragraphBlock ).getByPlaceholderText( 'Start writing…' );
		const string = 'A quick brown fox jumps over the lazy dog.';
		typeInRichText( paragraphTextInput, string, {
			finalSelectionStart: string.length / 2,
			finalSelectionEnd: string.length / 2,
		} );
		fireEvent( paragraphTextInput, 'onKeyDown', {
			nativeEvent: {},
			preventDefault() {},
			keyCode: ENTER,
		} );

		// Assert
		expect( getEditorHtml() ).toMatchInlineSnapshot( `
		"<!-- wp:paragraph {"align":"center"} -->
		<p class="has-text-align-center">A quick brown fox jum</p>
		<!-- /wp:paragraph -->

		<!-- wp:paragraph {"align":"center"} -->
		<p class="has-text-align-center">ps over the lazy dog.</p>
		<!-- /wp:paragraph -->"
	` );
	} );

	it( 'should link text without selection', async () => {
		// Arrange
		const screen = await initializeEditor();
		await addBlock( screen, 'Paragraph' );

		// Act
		const paragraphBlock = getBlock( screen, 'Paragraph' );
		fireEvent.press( paragraphBlock );
		// Await React Navigation: https://github.com/WordPress/gutenberg/issues/35685#issuecomment-961919931
		await act( () => fireEvent.press( screen.getByLabelText( 'Link' ) ) );
		// Await React Navigation: https://github.com/WordPress/gutenberg/issues/35685#issuecomment-961919931
		await act( () =>
			fireEvent.press(
				screen.getByLabelText( 'Link to, Search or type URL' )
			)
		);
		fireEvent.changeText(
			screen.getByPlaceholderText( 'Search or type URL' ),
			'wordpress.org'
		);
		fireEvent.changeText(
			screen.getByPlaceholderText( 'Add link text', { hidden: true } ),
			'WordPress'
		);
		jest.useFakeTimers();
		fireEvent.press( screen.getByLabelText( 'Apply' ) );
		// Await link picker navigation delay
		act( () => jest.runOnlyPendingTimers() );

		// Assert
		expect( getEditorHtml() ).toMatchInlineSnapshot( `
		"<!-- wp:paragraph -->
		<p><a href="http://wordpress.org">WordPress</a></p>
		<!-- /wp:paragraph -->"
	` );

		jest.useRealTimers();
	} );

	it( 'should link text with selection', async () => {
		// Arrange
		const screen = await initializeEditor();
		await addBlock( screen, 'Paragraph' );

		// Act
		const paragraphBlock = getBlock( screen, 'Paragraph' );
		fireEvent.press( paragraphBlock );
		const paragraphTextInput =
			within( paragraphBlock ).getByPlaceholderText( 'Start writing…' );
		typeInRichText(
			paragraphTextInput,
			'A quick brown fox jumps over the lazy dog.',
			{
				finalSelectionStart: 2,
				finalSelectionEnd: 7,
			}
		);
		// Await React Navigation: https://github.com/WordPress/gutenberg/issues/35685#issuecomment-961919931
		await act( () => fireEvent.press( screen.getByLabelText( 'Link' ) ) );
		// Await React Navigation: https://github.com/WordPress/gutenberg/issues/35685#issuecomment-961919931
		await act( () =>
			fireEvent.press(
				screen.getByLabelText( 'Link to, Search or type URL' )
			)
		);
		fireEvent.changeText(
			screen.getByPlaceholderText( 'Search or type URL' ),
			'wordpress.org'
		);
		jest.useFakeTimers();
		fireEvent.press( screen.getByLabelText( 'Apply' ) );
		// Await link picker navigation delay
		act( () => jest.runOnlyPendingTimers() );

		// Assert
		expect( getEditorHtml() ).toMatchInlineSnapshot( `
		"<!-- wp:paragraph -->
		<p>A <a href="http://wordpress.org">quick</a> brown fox jumps over the lazy dog.</p>
		<!-- /wp:paragraph -->"
	` );

		jest.useRealTimers();
	} );

	it( 'should link text with clipboard contents', async () => {
		// Arrange
		Clipboard.getString.mockResolvedValue( 'https://wordpress.org' );
		const screen = await initializeEditor();
		await addBlock( screen, 'Paragraph' );

		// Act
		const paragraphBlock = getBlock( screen, 'Paragraph' );
		fireEvent.press( paragraphBlock );
		const paragraphTextInput =
			within( paragraphBlock ).getByPlaceholderText( 'Start writing…' );
		typeInRichText(
			paragraphTextInput,
			'A quick brown fox jumps over the lazy dog.',
			{
				finalSelectionStart: 2,
				finalSelectionEnd: 7,
			}
		);
		// Await React Navigation: https://github.com/WordPress/gutenberg/issues/35685#issuecomment-961919931
		await act( () => fireEvent.press( screen.getByLabelText( 'Link' ) ) );
		// Await React Navigation: https://github.com/WordPress/gutenberg/issues/35685#issuecomment-961919931
		await act( () =>
			fireEvent.press(
				screen.getByLabelText( 'Link to, Search or type URL' )
			)
		);

		// Assert
		expect( getEditorHtml() ).toMatchInlineSnapshot( `
		"<!-- wp:paragraph -->
		<p>A <a href="https://wordpress.org">quick</a> brown fox jumps over the lazy dog.</p>
		<!-- /wp:paragraph -->"
	` );

		Clipboard.getString.mockReset();
	} );

	it( 'should not remove leading or trailing whitespace when formatting', async () => {
		// Arrange
		const screen = await initializeEditor();
		await addBlock( screen, 'Paragraph' );

		// Act
		const paragraphBlock = getBlock( screen, 'Paragraph' );
		fireEvent.press( paragraphBlock );
		const paragraphTextInput =
			within( paragraphBlock ).getByPlaceholderText( 'Start writing…' );
		typeInRichText( paragraphTextInput, '     some text      ', {
			finalSelectionStart: 5,
			finalSelectionEnd: 14,
		} );
		fireEvent.press( screen.getByLabelText( 'Italic' ) );

		// Assert
		expect( getEditorHtml() ).toMatchInlineSnapshot( `
		"<!-- wp:paragraph -->
		<p>     <em>some text</em>      </p>
		<!-- /wp:paragraph -->"
	` );
	} );

	it( 'should set a text color', async () => {
		// Arrange
		const screen = await initializeEditor();
		await addBlock( screen, 'Paragraph' );

		// Act
		const paragraphBlock = getBlock( screen, 'Paragraph' );
		fireEvent.press( paragraphBlock );
		const paragraphTextInput =
			within( paragraphBlock ).getByPlaceholderText( 'Start writing…' );
		typeInRichText(
			paragraphTextInput,
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
		expect( getEditorHtml() ).toMatchInlineSnapshot( `
		"<!-- wp:paragraph {"textColor":"pale-pink"} -->
		<p class="has-pale-pink-color has-text-color">A quick brown fox jumps over the lazy dog.</p>
		<!-- /wp:paragraph -->"
		` );
	} );

	it( 'should set a background color', async () => {
		// Arrange
		const screen = await initializeEditor();
		await addBlock( screen, 'Paragraph' );

		// Act
		const paragraphBlock = getBlock( screen, 'Paragraph' );
		fireEvent.press( paragraphBlock );
		const paragraphTextInput =
			within( paragraphBlock ).getByPlaceholderText( 'Start writing…' );
		typeInRichText(
			paragraphTextInput,
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
		expect( getEditorHtml() ).toMatchInlineSnapshot( `
		"<!-- wp:paragraph {"backgroundColor":"luminous-vivid-orange"} -->
		<p class="has-luminous-vivid-orange-background-color has-background">A quick brown fox jumps over the lazy dog.</p>
		<!-- /wp:paragraph -->"
		` );
	} );

	it( 'should set a text and background color', async () => {
		// Arrange
		const screen = await initializeEditor();
		await addBlock( screen, 'Paragraph' );

		// Act
		const paragraphBlock = getBlock( screen, 'Paragraph' );
		fireEvent.press( paragraphBlock );
		const paragraphTextInput =
			within( paragraphBlock ).getByPlaceholderText( 'Start writing…' );
		typeInRichText(
			paragraphTextInput,
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
		fireEvent.press( screen.getByLabelText( 'White' ) );

		// Go back to the settings menu
		fireEvent.press( screen.getByLabelText( 'Go back' ) );

		// Open Background color settings
		fireEvent.press( screen.getByLabelText( 'Background, Default' ) );

		// Tap one color
		fireEvent.press( screen.getByLabelText( 'Luminous vivid orange' ) );

		// Dismiss the Block Settings modal.
		fireEvent( blockSettingsModal, 'backdropPress' );

		// Assert
		expect( getEditorHtml() ).toMatchInlineSnapshot( `
		"<!-- wp:paragraph {"backgroundColor":"luminous-vivid-orange","textColor":"white"} -->
		<p class="has-white-color has-luminous-vivid-orange-background-color has-text-color has-background">A quick brown fox jumps over the lazy dog.</p>
		<!-- /wp:paragraph -->"
		` );
	} );

	it( 'should remove text and background colors', async () => {
		// Arrange
		const screen = await initializeEditor( {
			initialHtml: `<!-- wp:paragraph {"backgroundColor":"luminous-vivid-orange","textColor":"white"} -->
			<p class="has-white-color has-luminous-vivid-orange-background-color has-text-color has-background">A quick brown fox jumps over the lazy dog.</p>
			<!-- /wp:paragraph -->`,
		} );

		// Act
		const paragraphBlock = getBlock( screen, 'Paragraph' );
		fireEvent.press( paragraphBlock );

		// Open Block Settings.
		fireEvent.press( screen.getByLabelText( 'Open Settings' ) );

		// Wait for Block Settings to be visible.
		const blockSettingsModal = screen.getByTestId( 'block-settings-modal' );
		await waitFor( () => blockSettingsModal.props.isVisible );

		// Open Text color settings
		fireEvent.press( screen.getByLabelText( 'Text. Empty' ) );

		// Reset color
		fireEvent.press( await screen.findByText( 'Reset' ) );

		// Go back to the settings menu
		fireEvent.press( screen.getByLabelText( 'Go back' ) );

		// Open Background color settings
		fireEvent.press( screen.getByLabelText( 'Background. Empty' ) );

		// Reset color
		fireEvent.press( await screen.findByText( 'Reset' ) );

		// Dismiss the Block Settings modal.
		fireEvent( blockSettingsModal, 'backdropPress' );

		// Assert
		expect( getEditorHtml() ).toMatchInlineSnapshot( `
		"<!-- wp:paragraph -->
		<p>A quick brown fox jumps over the lazy dog.</p>
		<!-- /wp:paragraph -->"
		` );
	} );

	it( 'should not have a gradient background color option', async () => {
		// Arrange
		const screen = await initializeEditor();
		await addBlock( screen, 'Paragraph' );

		// Act
		const paragraphBlock = getBlock( screen, 'Paragraph' );
		fireEvent.press( paragraphBlock );
		const paragraphTextInput =
			within( paragraphBlock ).getByPlaceholderText( 'Start writing…' );
		typeInRichText(
			paragraphTextInput,
			'A quick brown fox jumps over the lazy dog.'
		);
		// Open Block Settings.
		fireEvent.press( screen.getByLabelText( 'Open Settings' ) );

		// Wait for Block Settings to be visible.
		const blockSettingsModal = screen.getByTestId( 'block-settings-modal' );
		await waitFor( () => blockSettingsModal.props.isVisible );

		// Open Background color settings
		fireEvent.press( screen.getByLabelText( 'Background, Default' ) );

		// Assert
		const colorButton = screen.getByLabelText( 'Luminous vivid orange' );
		expect( colorButton ).toBeDefined();

		const gradientButton = screen.queryByLabelText( 'Gradient' );
		expect( gradientButton ).toBeNull();
	} );

	it( 'should set a theme text color', async () => {
		// Arrange
		const screen = await initializeEditor( { withGlobalStyles: true } );
		await addBlock( screen, 'Paragraph' );

		// Act
		const paragraphBlock = getBlock( screen, 'Paragraph' );
		fireEvent.press( paragraphBlock );
		const paragraphTextInput =
			within( paragraphBlock ).getByPlaceholderText( 'Start writing…' );
		typeInRichText(
			paragraphTextInput,
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
		fireEvent.press( screen.getByLabelText( 'Tertiary' ) );

		// Dismiss the Block Settings modal.
		fireEvent( blockSettingsModal, 'backdropPress' );

		// Assert
		expect( getEditorHtml() ).toMatchInlineSnapshot( `
		"<!-- wp:paragraph {"textColor":"tertiary"} -->
		<p class="has-tertiary-color has-text-color">A quick brown fox jumps over the lazy dog.</p>
		<!-- /wp:paragraph -->"
		` );
	} );

	it( 'should show the contrast check warning', async () => {
		// Arrange
		const screen = await initializeEditor( {
			initialHtml: `<!-- wp:paragraph {"backgroundColor":"white","textColor":"white"} -->
			<p class="has-white-color has-white-background-color has-text-color has-background">A quick brown fox jumps over the lazy dog.</p>
			<!-- /wp:paragraph -->`,
		} );

		// Act
		const paragraphBlock = getBlock( screen, 'Paragraph' );
		fireEvent.press( paragraphBlock );

		// Open Block Settings.
		fireEvent.press( screen.getByLabelText( 'Open Settings' ) );

		// Wait for Block Settings to be visible.
		const blockSettingsModal = screen.getByTestId( 'block-settings-modal' );
		await waitFor( () => blockSettingsModal.props.isVisible );

		// Assert
		const contrastCheckElement = screen.getByText(
			/This color combination/
		);
		expect( contrastCheckElement ).toBeDefined();
	} );
} );
