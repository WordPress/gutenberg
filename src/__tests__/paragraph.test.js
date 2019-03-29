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

	it( 'split empty block', () => {
		// Given
		const instance = getTestInstanceWithContent( '' );

		const blocks = [ {} ];
		const before = null;
		const after = null;

		//When
		instance.splitBlock( before, after, ...blocks );

		//Then

		// The block is deleted if before is null
		expect( instance.props.onReplace ).toHaveBeenCalledTimes( 1 );
		expect( instance.props.onReplace ).toHaveBeenCalledWith( [] );

		// New block is inserted after the current block.
		expect( instance.props.insertBlocksAfter ).toHaveBeenCalledTimes( 1 );
		expect( instance.props.insertBlocksAfter ).toHaveBeenCalledWith( blocks );
	} );

	it( 'splits block with content on the middle', () => {
		// Given
		const before = 'Some text ';
		const after = 'to split';

		const newBlock = { content: after };
		createBlock.mockImplementation( () => newBlock );

		const instance = getTestInstanceWithContent( before + after );
		const block = {};

		// When
		instance.splitBlock( before, after, ...[ block ] );

		// Then

		// Do NOT remove current block
		expect( instance.props.onReplace ).toHaveBeenCalledTimes( 0 );

		// Insert new block with the second half of the text
		expect( instance.props.insertBlocksAfter ).toHaveBeenCalledTimes( 1 );
		expect( instance.props.insertBlocksAfter ).toHaveBeenCalledWith( [ block, newBlock ] );

		// Replace current block content with first half of the text.
		expect( instance.props.setAttributes ).toHaveBeenCalledTimes( 1 );
		expect( instance.props.setAttributes ).toHaveBeenCalledWith( { content: before } );
	} );
} );
