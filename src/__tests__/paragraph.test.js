/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import Paragraph from '../../gutenberg/packages/block-library/src/paragraph/edit.native.js';

/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
jest.mock( '@wordpress/blocks' );

const getTestComponentWithContent = ( content ) => {
	return shallow(
		<Paragraph
			attributes={ { content } }
			setAttributes={ jest.fn() }
			onReplace={ jest.fn() }
			insertBlocksAfter={ jest.fn() }
		/>
	);
};

const getTestInstanceWithContent = ( content ) => {
	return getTestComponentWithContent( content ).instance();
};

describe( 'Paragraph block', () => {
	it( 'renders without crashing', () => {
		const component = getTestComponentWithContent( '' );
		expect( component.exists() ).toBe( true );
	} );
} );
