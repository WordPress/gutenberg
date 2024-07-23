/**
 * External dependencies
 */
import {
	act,
	addBlock,
	dismissModal,
	getBlock,
	typeInRichText,
	fireEvent,
	getEditorHtml,
	initializeEditor,
	render,
	setupCoreBlocks,
	triggerBlockListLayout,
	waitFor,
	within,
	withFakeTimers,
	waitForElementToBeRemoved,
	waitForModalVisible,
} from 'test/helpers';
import Clipboard from '@react-native-clipboard/clipboard';
import TextInputState from 'react-native/Libraries/Components/TextInput/TextInputState';

/**
 * WordPress dependencies
 */
import { BACKSPACE, ENTER } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import Paragraph from '../edit';

// Mock debounce to prevent potentially belated state updates.
jest.mock( '@wordpress/compose/src/utils/debounce', () => ( {
	debounce: ( fn ) => {
		fn.cancel = jest.fn();
		return fn;
	},
} ) );
// Mock link suggestions that are fetched by the link picker
// when typing a search query.
jest.mock( '@wordpress/core-data/src/fetch', () => ( {
	__experimentalFetchLinkSuggestions: jest.fn().mockResolvedValue( [ {} ] ),
} ) );

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

	it( 'should prevent deleting the first Paragraph block when pressing backspace at the start', async () => {
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
			{ finalSelectionStart: 0, finalSelectionEnd: 0 }
		);

		fireEvent( paragraphTextInput, 'onKeyDown', {
			nativeEvent: {},
			preventDefault() {},
			keyCode: BACKSPACE,
		} );

		// Assert
		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'should be able to use a prefix to create a Heading block', async () => {
		const screen = await initializeEditor();
		await addBlock( screen, 'Paragraph' );
		const text = '# ';

		const paragraphBlock = getBlock( screen, 'Paragraph' );
		fireEvent.press( paragraphBlock );
		const paragraphTextInput =
			within( paragraphBlock ).getByPlaceholderText( 'Start writing…' );
		typeInRichText( paragraphTextInput, text, {
			finalSelectionStart: 1,
			finalSelectionEnd: 1,
		} );

		fireEvent( paragraphTextInput, 'onChange', {
			nativeEvent: { text },
			preventDefault() {},
		} );

		const headingBlock = getBlock( screen, 'Heading' );
		expect( headingBlock ).toBeVisible();
		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'should be able to use a prefix to create a Quote block', async () => {
		const screen = await initializeEditor();
		await addBlock( screen, 'Paragraph' );
		const text = '> ';

		const paragraphBlock = getBlock( screen, 'Paragraph' );
		fireEvent.press( paragraphBlock );
		const paragraphTextInput =
			within( paragraphBlock ).getByPlaceholderText( 'Start writing…' );
		typeInRichText( paragraphTextInput, text, {
			finalSelectionStart: 1,
			finalSelectionEnd: 1,
		} );

		fireEvent( paragraphTextInput, 'onChange', {
			nativeEvent: { text },
			preventDefault() {},
		} );
		const quoteBlock = getBlock( screen, 'Quote' );
		await triggerBlockListLayout( quoteBlock );

		expect( quoteBlock ).toBeVisible();
		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'should be able to use a prefix to create a List block', async () => {
		const screen = await initializeEditor();
		await addBlock( screen, 'Paragraph' );
		const text = '- ';

		const paragraphBlock = getBlock( screen, 'Paragraph' );
		fireEvent.press( paragraphBlock );
		const paragraphTextInput =
			within( paragraphBlock ).getByPlaceholderText( 'Start writing…' );
		typeInRichText( paragraphTextInput, text, {
			finalSelectionStart: 1,
			finalSelectionEnd: 1,
		} );

		fireEvent( paragraphTextInput, 'onChange', {
			nativeEvent: { text },
			preventDefault() {},
		} );
		const listBlock = getBlock( screen, 'List' );
		await triggerBlockListLayout( listBlock );

		expect( listBlock ).toBeVisible();
		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'should be able to use a prefix to create a numbered List block', async () => {
		const screen = await initializeEditor();
		await addBlock( screen, 'Paragraph' );
		const text = '1. ';

		const paragraphBlock = getBlock( screen, 'Paragraph' );
		fireEvent.press( paragraphBlock );
		const paragraphTextInput =
			within( paragraphBlock ).getByPlaceholderText( 'Start writing…' );
		typeInRichText( paragraphTextInput, text, {
			finalSelectionStart: 2,
			finalSelectionEnd: 2,
		} );

		fireEvent( paragraphTextInput, 'onChange', {
			nativeEvent: { text },
			preventDefault() {},
		} );
		const listBlock = getBlock( screen, 'List' );
		await triggerBlockListLayout( listBlock );

		expect( listBlock ).toBeVisible();
		expect( getEditorHtml() ).toMatchSnapshot();
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

	it( 'should inherit parent alignment', async () => {
		// Arrange
		const screen = await initializeEditor();
		await addBlock( screen, 'Quote' );
		await triggerBlockListLayout( getBlock( screen, 'Quote' ) );

		// Act
		const paragraphBlock = getBlock( screen, 'Paragraph' );
		fireEvent.press( paragraphBlock );
		const paragraphTextInput =
			within( paragraphBlock ).getByPlaceholderText( 'Start writing…' );
		typeInRichText(
			paragraphTextInput,
			'A quick brown fox jumps over the lazy dog.'
		);
		fireEvent.press( screen.getByLabelText( 'Navigate Up' ) );
		fireEvent.press( screen.getByLabelText( 'Align text' ) );
		fireEvent.press( screen.getByLabelText( 'Align text right' ) );

		// Assert
		// This not an ideal assertion, as it relies implementation details of the
		// component: prop names. However, the only aspect we can assert is the prop
		// passed to Aztec, the native module controlling visual alignment. A less
		// brittle alternative might be snapshotting, but RNTL does not yet support
		// focused snapshots, which means the snapshot would be huge.
		// https://github.com/facebook/react/pull/25329
		expect(
			screen.UNSAFE_queryAllByProps( {
				value: '<p>A quick brown fox jumps over the lazy dog.</p>',
				placeholder: 'Start writing…',
				textAlign: 'right',
			} ).length
		).toBe( 2 ); // One for Aztec mock, one for the TextInput.
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
		fireEvent.press( screen.getByLabelText( 'Link' ) );

		fireEvent.changeText(
			screen.getByPlaceholderText( 'Add link text' ),
			'WordPress'
		);
		fireEvent.press(
			screen.getByLabelText( 'Link to, Search or type URL' )
		);
		const typeURLInput = await waitFor( () =>
			screen.getByPlaceholderText( 'Search or type URL' )
		);
		fireEvent.changeText( typeURLInput, 'wordpress.org' );
		await waitForElementToBeRemoved( () =>
			screen.getByTestId( 'link-picker-loading' )
		);
		// Back navigation from link picker uses `setTimeout`
		await withFakeTimers( () => {
			fireEvent.press( screen.getByLabelText( 'Apply' ) );
			act( () => jest.runOnlyPendingTimers() );
		} );

		// Assert
		expect( getEditorHtml() ).toMatchInlineSnapshot( `
		"<!-- wp:paragraph -->
		<p><a href="http://wordpress.org">WordPress</a></p>
		<!-- /wp:paragraph -->"
	` );
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
		fireEvent.press( screen.getByLabelText( 'Link' ) );
		fireEvent.press(
			screen.getByLabelText( 'Link to, Search or type URL' )
		);
		const typeURLInput = await waitFor( () =>
			screen.getByPlaceholderText( 'Search or type URL' )
		);
		fireEvent.changeText( typeURLInput, 'wordpress.org' );
		await waitForElementToBeRemoved( () =>
			screen.getByTestId( 'link-picker-loading' )
		);
		// Back navigation from link picker uses `setTimeout`
		await withFakeTimers( () => {
			fireEvent.press( screen.getByLabelText( 'Apply' ) );
			act( () => jest.runOnlyPendingTimers() );
		} );

		// Assert
		expect( getEditorHtml() ).toMatchInlineSnapshot( `
		"<!-- wp:paragraph -->
		<p>A <a href="http://wordpress.org">quick</a> brown fox jumps over the lazy dog.</p>
		<!-- /wp:paragraph -->"
	` );
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
		// TODO(jest-console): Fix the warning and remove the expect below.
		expect( console ).toHaveWarnedWith(
			`Non-serializable values were found in the navigation state. Check:\n\nColor > params.onColorChange (Function)\n\nThis can break usage such as persisting and restoring state. This might happen if you passed non-serializable values such as function, class instances etc. in params. If you need to use components with callbacks in your options, you can use 'navigation.setOptions' instead. See https://reactnavigation.org/docs/troubleshooting#i-get-the-warning-non-serializable-values-were-found-in-the-navigation-state for more details.`
		);

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

	it( 'should highlight text with selection', async () => {
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
			'A quick brown fox jumps over the lazy dog.',
			{ finalSelectionStart: 2, finalSelectionEnd: 7 }
		);
		fireEvent.press( screen.getByLabelText( 'Text color' ) );
		fireEvent.press( await screen.findByLabelText( 'Tertiary' ) );
		// TODO(jest-console): Fix the warning and remove the expect below.
		expect( console ).toHaveWarnedWith(
			`Non-serializable values were found in the navigation state. Check:\n\ntext-color > Palette > params.onColorChange (Function)\n\nThis can break usage such as persisting and restoring state. This might happen if you passed non-serializable values such as function, class instances etc. in params. If you need to use components with callbacks in your options, you can use 'navigation.setOptions' instead. See https://reactnavigation.org/docs/troubleshooting#i-get-the-warning-non-serializable-values-were-found-in-the-navigation-state for more details.`
		);

		// Assert
		expect( getEditorHtml() ).toMatchInlineSnapshot( `
		"<!-- wp:paragraph -->
		<p>A <mark style="background-color:rgba(0, 0, 0, 0);color:#2411a4" class="has-inline-color has-tertiary-color">quick</mark> brown fox jumps over the lazy dog.</p>
		<!-- /wp:paragraph -->"
	` );
	} );

	it( 'should show the expected font sizes values', async () => {
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
		await waitForModalVisible( blockSettingsModal );

		// Open Font size settings
		fireEvent.press( screen.getByLabelText( 'Font Size, Custom' ) );
		await waitFor( () => screen.getByLabelText( 'Selected: Default' ) );

		// Assert
		const modalContent = within( blockSettingsModal );
		expect( modalContent.getByLabelText( 'Small' ) ).toBeVisible();
		expect( modalContent.getByText( '14px' ) ).toBeVisible();
		expect( modalContent.getByLabelText( 'Medium' ) ).toBeVisible();
		expect( modalContent.getByText( '17px' ) ).toBeVisible();
		expect( modalContent.getByLabelText( 'Large' ) ).toBeVisible();
		expect( modalContent.getByText( '30px' ) ).toBeVisible();
		expect( modalContent.getByLabelText( 'Extra Large' ) ).toBeVisible();
		expect( modalContent.getByText( '40px' ) ).toBeVisible();
		expect(
			modalContent.getByLabelText( 'Extra Extra Large' )
		).toBeVisible();
		expect( modalContent.getByText( '52px' ) ).toBeVisible();
	} );

	it( 'should set a font size value', async () => {
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
		await waitForModalVisible( blockSettingsModal );

		// Open Font size settings
		fireEvent.press( screen.getByLabelText( 'Font Size, Custom' ) );

		// Tap one font size
		fireEvent.press( screen.getByLabelText( 'Large' ) );

		// Dismiss the Block Settings modal.
		await dismissModal( blockSettingsModal );

		// Assert
		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'should set a line height value', async () => {
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
		await waitForModalVisible( blockSettingsModal );

		const lineHeightControl = screen.getByLabelText( /Line Height/ );
		fireEvent.press(
			within( lineHeightControl ).getByText( '1.5', { hidden: true } )
		);
		const lineHeightTextInput = within(
			lineHeightControl
		).getByDisplayValue( '1.5', { hidden: true } );
		fireEvent.changeText( lineHeightTextInput, '1.8' );

		// Dismiss the Block Settings modal.
		await dismissModal( blockSettingsModal );

		// Assert
		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'should focus on the previous Paragraph block when backspacing in an empty Paragraph block', async () => {
		// Arrange
		const screen = await initializeEditor();
		await addBlock( screen, 'Paragraph' );

		// Act
		const paragraphBlock = getBlock( screen, 'Paragraph' );
		fireEvent.press( paragraphBlock );
		const paragraphTextInput =
			within( paragraphBlock ).getByPlaceholderText( 'Start writing…' );
		typeInRichText( paragraphTextInput, 'A quick brown fox jumps' );

		await addBlock( screen, 'Paragraph' );
		const secondParagraphBlock = getBlock( screen, 'Paragraph', {
			rowIndex: 2,
		} );
		fireEvent.press( secondParagraphBlock );

		// Clear mock history
		TextInputState.focusTextInput.mockClear();

		const secondParagraphTextInput =
			within( secondParagraphBlock ).getByPlaceholderText(
				'Start writing…'
			);
		fireEvent( secondParagraphTextInput, 'onKeyDown', {
			nativeEvent: {},
			preventDefault() {},
			keyCode: BACKSPACE,
		} );

		// Assert
		expect( TextInputState.focusTextInput ).toHaveBeenCalled();
	} );
} );
