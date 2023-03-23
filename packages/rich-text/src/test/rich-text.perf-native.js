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
import {
	BottomSheetSettings,
	BlockEdit,
	RichText,
} from '@wordpress/block-editor';
import { SlotFillProvider } from '@wordpress/components';

describe( 'RichText Performance', () => {
	it( 'performance is stable when typing rich text', async () => {
		const scenario = async () => {
			const richTextInput = screen.getByLabelText( 'Text input. Empty' );

			fireEvent( richTextInput, 'focus' );

			changeTextOfRichText(
				richTextInput,
				'<strong>Bold</strong> <em>italic</em> <s>strikethrough</s> text'
			);
		};

		const EditorTree = ( props ) => (
			<SlotFillProvider>
				<BlockEdit
					isSelected
					name={ 'editor' }
					clientId={ 0 }
					{ ...props }
				/>
				<BottomSheetSettings isVisible />
			</SlotFillProvider>
		);

		await measurePerformance( EditorTree, {
			scenario,
		} );
	} );

	it( 'performance is stable when text input is focused', async () => {
		const scenario = async () => {
			const richTextInput = screen.getByLabelText( 'Text input. Empty' );

			fireEvent( richTextInput, 'focus' );
		};

		await measurePerformance( <RichText onFocus={ jest.fn() } />, {
			scenario,
		} );
	} );

	it( 'performance is stable when text input is blurred', async () => {
		const scenario = async () => {
			const richTextInput = screen.getByLabelText( 'Text input. Empty' );

			fireEvent( richTextInput, 'blur' );
		};

		await measurePerformance( <RichText onBlur={ jest.fn() } />, {
			scenario,
		} );
	} );

	it( 'performance is stable when text is selected', async () => {
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
