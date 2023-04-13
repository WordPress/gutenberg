/**
 * External dependencies
 */
import {
	act,
	addBlock,
	getBlock,
	changeTextOfRichText,
	changeAndSelectTextOfRichText,
	fireEvent,
	getEditorHtml,
	initializeEditor,
	render,
	setupCoreBlocks,
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
	it( 'renders without crashing', () => {
		const screen = getTestComponentWithContent( '' );
		expect( screen.container ).toBeTruthy();
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
		changeAndSelectTextOfRichText(
			paragraphTextInput,
			'A quick brown fox jumps over the lazy dog.',
			{ selectionStart: 2, selectionEnd: 7 }
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
		changeAndSelectTextOfRichText(
			paragraphTextInput,
			'A quick brown fox jumps over the lazy dog.',
			{ selectionStart: 2, selectionEnd: 7 }
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
		changeAndSelectTextOfRichText(
			paragraphTextInput,
			'A quick brown fox jumps over the lazy dog.',
			{ selectionStart: 2, selectionEnd: 7 }
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
		changeTextOfRichText(
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
		changeTextOfRichText(
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
		changeTextOfRichText(
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
		changeAndSelectTextOfRichText( paragraphTextInput, string, {
			selectionStart: string.length / 2,
			selectionEnd: string.length / 2,
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
			screen.getByPlaceholderText( 'Add link text' ),
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
		changeAndSelectTextOfRichText(
			paragraphTextInput,
			'A quick brown fox jumps over the lazy dog.',
			{
				selectionStart: 2,
				selectionEnd: 7,
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
		changeAndSelectTextOfRichText(
			paragraphTextInput,
			'A quick brown fox jumps over the lazy dog.',
			{
				selectionStart: 2,
				selectionEnd: 7,
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
		changeAndSelectTextOfRichText(
			paragraphTextInput,
			'     some text      ',
			{
				selectionStart: 5,
				selectionEnd: 14,
			}
		);
		fireEvent.press( screen.getByLabelText( 'Italic' ) );

		// Assert
		expect( getEditorHtml() ).toMatchInlineSnapshot( `
		"<!-- wp:paragraph -->
		<p>     <em>some text</em>      </p>
		<!-- /wp:paragraph -->"
	` );
	} );
} );
