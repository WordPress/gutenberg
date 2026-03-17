/**
 * External dependencies
 */
import {
	typeInRichText,
	fireEvent,
	measurePerformance,
	screen,
} from 'test/helpers';

/**
 * Internal dependencies
 */
import RichText from '../../index.native';

describe( 'RichText Performance', () => {
	const onCreateUndoLevel = jest.fn();
	const onChange = jest.fn();
	const onSelectionChange = jest.fn();

	it( 'performance is stable when typing using Rich Text', async () => {
		const scenario = async () => {
			const richTextInput = screen.getByLabelText( 'Text input. Empty' );

			fireEvent( richTextInput, 'focus' );

			typeInRichText(
				richTextInput,
				'<strong>Bold</strong> <em>italic</em> <s>strikethrough</s> text'
			);
		};

		await measurePerformance(
			<RichText
				onChange={ onChange }
				__unstableOnCreateUndoLevel={ onCreateUndoLevel }
				onSelectionChange={ onSelectionChange }
			/>,
			{
				scenario,
			}
		);
	} );
} );
