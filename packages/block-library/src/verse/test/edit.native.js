/**
 * External dependencies
 */
import {
	addBlock,
	getEditorHtml,
	initializeEditor,
	getBlock,
	changeAndSelectTextOfRichText,
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
		const verseTextInput = await screen.findByPlaceholderText(
			'Write verse…'
		);
		const string = 'A great statement.';
		changeAndSelectTextOfRichText( verseTextInput, string, {
			selectionStart: string.length,
			selectionEnd: string.length,
		} );
		fireEvent( verseTextInput, 'onKeyDown', {
			nativeEvent: {},
			preventDefault() {},
			keyCode: ENTER,
		} );

		// TODO: Determine a way to type after pressing ENTER within the block.

		// Assert
		expect( getEditorHtml() ).toMatchInlineSnapshot( `
		"<!-- wp:verse -->
		<pre class="wp-block-verse">A great statement.<br></pre>
		<!-- /wp:verse -->"
	` );
	} );
} );
