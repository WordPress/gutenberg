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
	it( 'performance is stable', async () => {
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

	it( 'should call onFocus when the TextInput component gains focus', async () => {
		const scenario = async () => {
			const richTextInput = screen.getByLabelText( 'Text input. Empty' );

			fireEvent( richTextInput, 'focus' );
		};

		await measurePerformance( <RichText onFocus={ jest.fn() } />, {
			scenario,
		} );
	} );

	it( 'should call onBlue when the TextInput component is blurred', async () => {
		const scenario = async () => {
			const richTextInput = screen.getByLabelText( 'Text input. Empty' );

			fireEvent( richTextInput, 'focus' );
		};

		await measurePerformance( <RichText onBlur={ jest.fn() } />, {
			scenario,
		} );
	} );

	it( 'should call onSelectionChange when the selection in the TextInput component changes', async () => {
		const scenario = async () => {
			const richTextInput = screen.getByLabelText( 'Text input. Empty' );

			const selection = { start: 2, end: 4 };
			fireEvent( richTextInput, 'selectionChange', {
				nativeEvent: { selection },
			} );
		};

		await measurePerformance(
			<RichText onSelectionChange={ jest.fn() } />,
			{
				scenario,
			}
		);
	} );

	it( 'should call onKeyPress when a key is pressed while the TextInput component is focused', async () => {
		const scenario = async () => {
			const richTextInput = screen.getByLabelText( 'Text input. Empty' );

			fireEvent.changeText( richTextInput, 'abc' );
		};

		await measurePerformance( <RichText onKeyPress={ jest.fn() } />, {
			scenario,
		} );
	} );
} );
