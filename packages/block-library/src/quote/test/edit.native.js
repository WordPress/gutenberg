/**
 * External dependencies
 */
import {
	addBlock,
	getBlock,
	initializeEditor,
	setupCoreBlocks,
	getEditorHtml,
	fireEvent,
	within,
	waitFor,
	changeAndSelectTextOfRichText,
} from 'test/helpers';

/**
 * WordPress dependencies
 */
import { ENTER } from '@wordpress/keycodes';

setupCoreBlocks();

describe( 'Quote', () => {
	it( 'should produce expected markup for multiline text', async () => {
		// Arrange
		const screen = await initializeEditor();
		await addBlock( screen, 'Quote' );
		const quoteBlock = getBlock( screen, 'Quote' );
		// A layout event must be explicitly dispatched in BlockList component,
		// otherwise the inner blocks are not rendered.
		fireEvent(
			within( quoteBlock ).getByTestId( 'block-list-wrapper' ),
			'layout',
			{
				nativeEvent: {
					layout: {
						width: 320,
					},
				},
			}
		);
		// Await inner blocks to be rendered
		const citationBlock = await waitFor( () =>
			screen.getByPlaceholderText( 'Add citation' )
		);

		// Act
		fireEvent.press( quoteBlock );
		// screen.debug();
		let quoteTextInput =
			within( quoteBlock ).getByPlaceholderText( 'Start writing…' );
		const string = 'A great statement.';
		changeAndSelectTextOfRichText( quoteTextInput, string, {
			selectionStart: string.length,
			selectionEnd: string.length,
		} );
		fireEvent( quoteTextInput, 'onKeyDown', {
			nativeEvent: {},
			preventDefault() {},
			keyCode: ENTER,
		} );
		quoteTextInput =
			within( quoteBlock ).getAllByPlaceholderText(
				'Start writing…'
			)[ 1 ];
		changeAndSelectTextOfRichText( quoteTextInput, 'Again.' );
		const citationTextInput =
			within( citationBlock ).getByPlaceholderText( 'Add citation' );
		changeAndSelectTextOfRichText( citationTextInput, 'A person', {
			selectionStart: 2,
			selectionEnd: 2,
		} );
		fireEvent( citationTextInput, 'onKeyDown', {
			nativeEvent: {},
			preventDefault() {},
			keyCode: ENTER,
		} );

		// Assert
		expect( getEditorHtml() ).toMatchInlineSnapshot( `
		"<!-- wp:quote -->
		<blockquote class="wp-block-quote"><!-- wp:paragraph -->
		<p>A great statement.</p>
		<!-- /wp:paragraph -->

		<!-- wp:paragraph -->
		<p>Again.</p>
		<!-- /wp:paragraph --><cite>A <br>person</cite></blockquote>
		<!-- /wp:quote -->"
	` );
	} );
} );
