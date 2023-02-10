/**
 * External dependencies
 */
import { measurePerformance } from 'reassure';
import { fireEvent } from '@testing-library/react-native';

/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';

describe( 'RichText Performance', () => {
	it( 'measures performance', async () => {
		const onChange = jest.fn();

		const changeTextOfRichText = ( richText, text ) => {
			fireEvent( richText, 'focus' );
			fireEvent( richText, 'onChange', {
				nativeEvent: {
					eventCount: 1,
					target: undefined,
					text,
				},
			} );
		};

		const scenario = async () => {
			const richTextInput = <RichText />;
			// Simulate user typing text.
			fireEvent( richTextInput, 'focus' );

			changeTextOfRichText(
				richTextInput,
				'<strong>Bold</strong> <em>italic</em> <s>strikethrough</s> text'
			);

			// Check if the onChange is called and the state is updated.
			expect( onChange ).toHaveBeenCalledTimes( 1 );
		};

		await measurePerformance( <RichText onChange={ onChange } />, {
			scenario,
		} );
	} );
} );
