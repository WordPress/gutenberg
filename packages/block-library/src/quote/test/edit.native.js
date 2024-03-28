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
	typeInRichText,
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

		// Act
		fireEvent.press( quoteBlock );
		let quoteTextInput =
			within( quoteBlock ).getByPlaceholderText( 'Start writing…' );
		typeInRichText( quoteTextInput, 'A great statement.' );
		fireEvent( quoteTextInput, 'onKeyDown', {
			nativeEvent: {},
			preventDefault() {},
			keyCode: ENTER,
		} );
		quoteTextInput =
			within( quoteBlock ).getAllByPlaceholderText(
				'Start writing…'
			)[ 1 ];
		typeInRichText( quoteTextInput, 'Again.' );
		fireEvent.press( screen.getByLabelText( 'Navigate Up' ) );
		fireEvent.press( screen.getByLabelText( 'Add citation' ) );
		const citationBlock =
			await screen.findByPlaceholderText( 'Add citation' );
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
		"<!-- wp:quote -->
		<blockquote class="wp-block-quote"><!-- wp:paragraph -->
		<p>A great statement.</p>
		<!-- /wp:paragraph -->

		<!-- wp:paragraph -->
		<p>Again.</p>
		<!-- /wp:paragraph --><cite>A <br>person</cite></blockquote>
		<!-- /wp:quote -->

		<!-- wp:paragraph -->
		<p></p>
		<!-- /wp:paragraph -->"
	` );
	} );
} );
