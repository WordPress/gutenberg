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
	it( 'should have stable performance when typing rich text', async () => {
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

	it( 'should have stable performance when text input is focused', async () => {
		const scenario = async () => {
			const richTextInput = screen.getByLabelText( 'Text input. Empty' );

			fireEvent( richTextInput, 'focus' );
		};

		await measurePerformance( <RichText onFocus={ jest.fn() } />, {
			scenario,
		} );
	} );

	it( 'should have stable performance when text input is blurred', async () => {
		const scenario = async () => {
			const richTextInput = screen.getByLabelText( 'Text input. Empty' );

			fireEvent( richTextInput, 'blur' );
		};

		await measurePerformance( <RichText onBlur={ jest.fn() } />, {
			scenario,
		} );
	} );

	it( 'should have stable performance when text is selected', async () => {
		const scenario = async () => {
			const richTextInput = screen.getByLabelText( 'Text input. Empty' );

			const selection = { start: 2, end: 4 };
			fireEvent( richTextInput, 'selectionChange', 2, 4, 'Hello', {
				nativeEvent: { selection, text: 'Hello' },
			} );
		};

		await measurePerformance(
			<RichText onSelectionChange={ jest.fn() } />,
			{
				scenario,
			}
		);
	} );
} );
