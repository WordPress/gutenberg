/**
 * External dependencies
 */
import {
	changeTextOfRichText,
	fireEvent,
	measurePerformance,
} from 'test/helpers';

/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';

describe( 'RichText Performance', () => {
	// eslint-disable-next-line jest/no-done-callback
	it( 'performance is stable', async ( screen ) => {
		const scenario = async () => {
			const richTextInput = screen.getByTestId( 'performance' );

			fireEvent( richTextInput, 'focus' );

			changeTextOfRichText(
				richTextInput,
				'<strong>Bold</strong> <em>italic</em> <s>strikethrough</s> text'
			);

			// Check if the onChange is called and the state is updated.
			expect( changeTextOfRichText ).toHaveBeenCalledTimes( 1 );
		};

		await measurePerformance( <RichText testID="performance" />, {
			scenario,
		} );
	} );
} );
