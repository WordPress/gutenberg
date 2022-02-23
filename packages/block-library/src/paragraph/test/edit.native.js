/**
 * External dependencies
 */
import { render } from 'test/helpers';

/**
 * Internal dependencies
 */
import Paragraph from '../edit';

const getTestComponentWithContent = ( content ) => {
	return render(
		<Paragraph
			attributes={ { content } }
			setAttributes={ jest.fn() }
			onReplace={ jest.fn() }
			insertBlocksAfter={ jest.fn() }
		/>
	);
};

describe( 'Paragraph block', () => {
	it( 'renders without crashing', () => {
		const screen = getTestComponentWithContent( '' );
		expect( screen.container ).toBeTruthy();
	} );
} );
