/**
 * External dependencies
 */
import {
	addBlock,
	dismissModal,
	getBlock,
	typeInRichText,
	fireEvent,
	getEditorHtml,
	initializeEditor,
	setupCoreBlocks,
	selectRangeInRichText,
	within,
} from 'test/helpers';

setupCoreBlocks();

describe( 'Editor History', () => {
	it( 'should remove and add blocks', async () => {
		// Arrange
		const screen = await initializeEditor();

		// Act
		await addBlock( screen, 'Verse' );
		await addBlock( screen, 'Image' );
		await addBlock( screen, 'Paragraph' );

		// Assert
		expect( getEditorHtml() ).toMatchInlineSnapshot( `
		"<!-- wp:verse -->
		<pre class="wp-block-verse"></pre>
		<!-- /wp:verse -->

		<!-- wp:image -->
		<figure class="wp-block-image"><img alt=""/></figure>
		<!-- /wp:image -->

		<!-- wp:paragraph -->
		<p></p>
		<!-- /wp:paragraph -->"
	` );

		// Act
		fireEvent.press( screen.getByLabelText( 'Undo' ) );
		fireEvent.press( screen.getByLabelText( 'Undo' ) );
		fireEvent.press( screen.getByLabelText( 'Undo' ) );

		// Assert
		expect( getEditorHtml() ).toMatchInlineSnapshot( `""` );

		// Act
		fireEvent.press( screen.getByLabelText( 'Redo' ) );
		fireEvent.press( screen.getByLabelText( 'Redo' ) );
		fireEvent.press( screen.getByLabelText( 'Redo' ) );

		// Assert
		expect( getEditorHtml() ).toMatchInlineSnapshot( `
		"<!-- wp:verse -->
		<pre class="wp-block-verse"></pre>
		<!-- /wp:verse -->

		<!-- wp:image -->
		<figure class="wp-block-image"><img alt=""/></figure>
		<!-- /wp:image -->

		<!-- wp:paragraph -->
		<p></p>
		<!-- /wp:paragraph -->"
	` );
	} );

	it( 'should remove and add text', async () => {
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

		// TODO: Determine a way to type multiple times within a given block.

		// Assert
		expect( getEditorHtml() ).toMatchInlineSnapshot( `
		"<!-- wp:paragraph -->
		<p>A quick brown fox jumps over the lazy dog.</p>
		<!-- /wp:paragraph -->"
	` );

		// Act
		fireEvent.press( screen.getByLabelText( 'Undo' ) );

		// Assert
		expect( getEditorHtml() ).toMatchInlineSnapshot( `
		"<!-- wp:paragraph -->
		<p></p>
		<!-- /wp:paragraph -->"
	` );

		// Act
		fireEvent.press( screen.getByLabelText( 'Redo' ) );

		// Assert
		expect( getEditorHtml() ).toMatchInlineSnapshot( `
		"<!-- wp:paragraph -->
		<p>A quick brown fox jumps over the lazy dog.</p>
		<!-- /wp:paragraph -->"
	` );
	} );

	it( 'should remove and add text formatting', async () => {
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
		// Artifical delay to create two history entries for typing and bolding.
		await new Promise( ( resolve ) => setTimeout( resolve, 1000 ) );
		fireEvent.press( screen.getByLabelText( 'Bold' ) );
		fireEvent.press( screen.getByLabelText( 'Italic' ) );

		// TODO: Determine a way to type multiple times within a given block.

		// Assert
		expect( getEditorHtml() ).toMatchInlineSnapshot( `
		"<!-- wp:paragraph -->
		<p>A <strong><em>quick</em></strong> brown fox jumps over the lazy dog.</p>
		<!-- /wp:paragraph -->"
	` );

		// Act
		fireEvent.press( screen.getByLabelText( 'Undo' ) );

		// Assert
		expect( getEditorHtml() ).toMatchInlineSnapshot( `
		"<!-- wp:paragraph -->
		<p>A <strong>quick</strong> brown fox jumps over the lazy dog.</p>
		<!-- /wp:paragraph -->"
	` );

		// Act
		fireEvent.press( screen.getByLabelText( 'Undo' ) );

		// Assert
		expect( getEditorHtml() ).toMatchInlineSnapshot( `
		"<!-- wp:paragraph -->
		<p>A quick brown fox jumps over the lazy dog.</p>
		<!-- /wp:paragraph -->"
	` );

		// Act
		fireEvent.press( screen.getByLabelText( 'Redo' ) );
		fireEvent.press( screen.getByLabelText( 'Redo' ) );

		// Assert
		expect( getEditorHtml() ).toMatchInlineSnapshot( `
		"<!-- wp:paragraph -->
		<p>A <strong><em>quick</em></strong> brown fox jumps over the lazy dog.</p>
		<!-- /wp:paragraph -->"
	` );
	} );

	it( 'should preserve editor history when a link has been added and configured to open in a new tab', async () => {
		// Arrange
		const initialHtml = `
			<!-- wp:paragraph --><p>A <a href="http://wordpress.org">quick</a> brown fox jumps over the lazy dog.</p><!-- /wp:paragraph -->
		`;
		const screen = await initializeEditor( {
			initialHtml,
		} );

		// Act
		const paragraphBlock = getBlock( screen, 'Paragraph' );
		fireEvent.press( paragraphBlock );

		const paragraphTextInput =
			within( paragraphBlock ).getByPlaceholderText( 'Start writing…' );
		selectRangeInRichText( paragraphTextInput, 2, 7 );
		fireEvent.press( screen.getByLabelText( 'Link' ) );

		const newTabButton = screen.getByText( 'Open in new tab' );
		fireEvent.press( newTabButton );

		dismissModal( screen.getByTestId( 'link-settings-modal' ) );

		typeInRichText(
			paragraphTextInput,
			' A quick brown fox jumps over the lazy dog.'
		);

		// Assert
		expect( getEditorHtml() ).toMatchInlineSnapshot( `
		"<!-- wp:paragraph -->
		<p>A <a href="http://wordpress.org" target="_blank" rel="noreferrer noopener">quick</a> brown fox jumps over the lazy dog. A quick brown fox jumps over the lazy dog.</p>
		<!-- /wp:paragraph -->"
	` );

		// Act
		fireEvent.press( screen.getByLabelText( 'Undo' ) );
		fireEvent.press( screen.getByLabelText( 'Undo' ) );

		// Assert
		expect( getEditorHtml() ).toMatchInlineSnapshot( `
		"<!-- wp:paragraph -->
		<p>A <a href="http://wordpress.org">quick</a> brown fox jumps over the lazy dog.</p>
		<!-- /wp:paragraph -->"
	` );

		// Act
		fireEvent.press( screen.getByLabelText( 'Redo' ) );
		fireEvent.press( screen.getByLabelText( 'Redo' ) );

		// Assert
		expect( getEditorHtml() ).toMatchInlineSnapshot( `
		"<!-- wp:paragraph -->
		<p>A <a href="http://wordpress.org" target="_blank" rel="noreferrer noopener">quick</a> brown fox jumps over the lazy dog. A quick brown fox jumps over the lazy dog.</p>
		<!-- /wp:paragraph -->"
	` );
	} );
} );
