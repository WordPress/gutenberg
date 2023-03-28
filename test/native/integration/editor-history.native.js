/**
 * External dependencies
 */
import {
	addBlock,
	fireEvent,
	getEditorHtml,
	initializeEditor,
	setupCoreBlocks,
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
} );
