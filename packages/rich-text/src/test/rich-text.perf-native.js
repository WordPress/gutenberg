/**
 * External dependencies
 */
import {
	changeTextOfRichText,
	fireEvent,
	measurePerformance,
	screen,
} from 'test/helpers';

/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';

describe( 'RichText Performance', () => {
	it( 'performance is stable when typing using Rich Text', async () => {
		const scenario = async () => {
			const richTextInput = screen.getByLabelText( 'Text input. Empty' );

			fireEvent( richTextInput, 'focus' );

			changeTextOfRichText(
				richTextInput,
				'<strong>Bold</strong> <em>italic</em> <s>strikethrough</s> text'
			);
		};

		await measurePerformance( <RichText onChange={ jest.fn() } />, {
			scenario,
		} );
	} );
} );
