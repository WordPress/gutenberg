/**
 * External dependencies
 */
import {
	addBlock,
	changeTextOfRichText,
	fireEvent,
	getEditorHtml,
	initializeEditor,
	render,
	setupCoreBlocks,
	within,
} from 'test/helpers';

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

	it( 'should left align text', async () => {
		// Arrange
		const screen = await initializeEditor();
		await addBlock( screen, 'Paragraph' );

		const [ paragraphBlock ] = screen.getAllByLabelText(
			/Paragraph Block\. Row 1/
		);

		// Act
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

		const [ paragraphBlock ] = screen.getAllByLabelText(
			/Paragraph Block\. Row 1/
		);

		// Act
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

		const [ paragraphBlock ] = screen.getAllByLabelText(
			/Paragraph Block\. Row 1/
		);

		// Act
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
} );
