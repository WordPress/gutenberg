/**
 * External dependencies
 */
import { fireEvent, measurePerformance, screen } from 'test/helpers';

/**
 * Internal dependencies
 */
import Paragraph from '../../edit';

describe( 'RichText Performance', () => {
	it( 'performance is stable when typing text using the Paragraph block', async () => {
		const scenario = async () => {
			const paragraph = screen.getByPlaceholderText( 'Start writing…' );

			fireEvent( paragraph, 'focus' );
			fireEvent.changeText(
				paragraph,
				'<strong>Bold</strong> <em>italic</em> <s>strikethrough</s> text'
			);
		};

		await measurePerformance(
			<Paragraph
				attributes={ {} }
				setAttributes={ jest.fn() }
				onChange={ jest.fn() }
				insertBlocksAfter={ jest.fn() }
			/>,
			{
				scenario,
			}
		);
	} );
} );
