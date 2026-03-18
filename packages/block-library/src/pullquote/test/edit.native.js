/**
 * External dependencies
 */
import {
	addBlock,
	getBlock,
	initializeEditor,
	selectRangeInRichText,
	setupCoreBlocks,
	getEditorHtml,
	fireEvent,
	within,
	waitFor,
	typeInRichText,
} from 'test/helpers';

/**
 * WordPress dependencies
 */
import { ENTER } from '@wordpress/keycodes';

setupCoreBlocks();

describe( 'Pullquote', () => {
	it( 'should produce expected markup for multiline text', async () => {
		// Arrange
		const screen = await initializeEditor();
		await addBlock( screen, 'Pullquote' );
		// Await inner blocks to be rendered
		const citationBlock = await waitFor( () =>
			screen.getByPlaceholderText( 'Add citation' )
		);

		// Act
		const pullquoteBlock = getBlock( screen, 'Pullquote' );
		fireEvent.press( pullquoteBlock );
		const pullquoteTextInput =
			within( pullquoteBlock ).getByPlaceholderText( 'Add quote' );
		typeInRichText( pullquoteTextInput, 'A great statement.' );
		fireEvent( pullquoteTextInput, 'onKeyDown', {
			nativeEvent: {},
			preventDefault() {},
			keyCode: ENTER,
		} );
		typeInRichText( pullquoteTextInput, 'Again' );

		const citationTextInput =
			within( citationBlock ).getByPlaceholderText( 'Add citation' );
		typeInRichText( citationTextInput, 'A person' );
		fireEvent( citationTextInput, 'onKeyDown', {
			nativeEvent: {},
			preventDefault() {},
			keyCode: ENTER,
		} );
		selectRangeInRichText( citationTextInput, 2 );
		fireEvent( citationTextInput, 'onKeyDown', {
			nativeEvent: {},
			preventDefault() {},
			keyCode: ENTER,
		} );

		// Assert
		expect( getEditorHtml() ).toMatchInlineSnapshot( `
		"<!-- wp:pullquote -->
		<figure class="wp-block-pullquote"><blockquote><p>A great statement.<br>Again</p><cite>A <br>person</cite></blockquote></figure>
		<!-- /wp:pullquote -->

		<!-- wp:paragraph -->
		<p></p>
		<!-- /wp:paragraph -->"
	` );
	} );
} );
