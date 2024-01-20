/**
 * External dependencies
 */
import {
	addBlock,
	getEditorHtml,
	initializeEditor,
	getBlock,
	typeInRichText,
	fireEvent,
} from 'test/helpers';

/**
 * WordPress dependencies
 */
import { getBlockTypes, unregisterBlockType } from '@wordpress/blocks';
import { registerCoreBlocks } from '@wordpress/block-library';
import { ENTER } from '@wordpress/keycodes';

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

describe( 'Verse block', () => {
	it( 'inserts block', async () => {
		const screen = await initializeEditor();

		// Add block
		await addBlock( screen, 'Verse' );

		// Get block
		const verseBlock = await getBlock( screen, 'Verse' );
		expect( verseBlock ).toBeVisible();
		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'renders block text set as initial content', async () => {
		const screen = await initializeEditor( {
			initialHtml: `<!-- wp:verse -->
			<pre class="wp-block-verse">Sample text</pre>
			<!-- /wp:verse -->`,
		} );

		// Get block
		const verseBlock = await getBlock( screen, 'Verse' );
		expect( verseBlock ).toBeVisible();
		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'should produce expected markup for multiline text', async () => {
		// Arrange
		const screen = await initializeEditor();
		await addBlock( screen, 'Verse' );

		// Act
		const verseTextInput =
			await screen.findByPlaceholderText( 'Write verse…' );
		typeInRichText( verseTextInput, 'A great statement.' );
		fireEvent( verseTextInput, 'onKeyDown', {
			nativeEvent: {},
			preventDefault() {},
			keyCode: ENTER,
		} );
		typeInRichText( verseTextInput, 'Again' );

		// Assert
		expect( getEditorHtml() ).toMatchInlineSnapshot( `
		"<!-- wp:verse -->
		<pre class="wp-block-verse">A great statement.<br>Again</pre>
		<!-- /wp:verse -->"
	` );
	} );

	it( 'should split on triple Enter', async () => {
		// Arrange
		const screen = await initializeEditor();
		await addBlock( screen, 'Verse' );

		// Act
		const verseTextInput =
			await screen.findByPlaceholderText( 'Write verse…' );
		typeInRichText( verseTextInput, 'Hello' );
		fireEvent( verseTextInput, 'onKeyDown', {
			nativeEvent: {},
			preventDefault() {},
			keyCode: ENTER,
		} );
		fireEvent( verseTextInput, 'onKeyDown', {
			nativeEvent: {},
			preventDefault() {},
			keyCode: ENTER,
		} );
		fireEvent( verseTextInput, 'onKeyDown', {
			nativeEvent: {},
			preventDefault() {},
			keyCode: ENTER,
		} );

		// Assert
		expect( getEditorHtml() ).toMatchInlineSnapshot( `
		"<!-- wp:verse -->
		<pre class="wp-block-verse">Hello</pre>
		<!-- /wp:verse -->

		<!-- wp:paragraph -->
		<p></p>
		<!-- /wp:paragraph -->"
	` );
	} );
} );
