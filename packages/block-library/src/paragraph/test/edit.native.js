/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import Paragraph from '../edit';

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

	it( 'splits empty block', () => {
		// Given
		const instance = getTestInstanceWithContent( '' );

		const blocks = [ ];
		const before = '';
		const after = '';

		// Mock implemenattion of `createBlock` to test against `insertBlocksAfter`.
		const newBlock = { content: after };
		createBlock.mockImplementation( () => newBlock );

		// When
		instance.splitBlock( before, after, ...blocks );

		// Then

		// Should ask for creating a new paragraph block.
		expect( createBlock ).toHaveBeenCalledTimes( 1 );
		expect( createBlock ).toHaveBeenCalledWith( 'core/paragraph', { content: after } );

		// New block is inserted after the current block.
		expect( instance.props.insertBlocksAfter ).toHaveBeenCalledTimes( 1 );
		expect( instance.props.insertBlocksAfter ).toHaveBeenCalledWith( [ newBlock ] );
	} );

	it( 'splits block with content on the middle', () => {
		// Given
		const before = 'Some text ';
		const after = 'to split';
		const blocks = [ ];

		const newBlock = { content: after };
		createBlock.mockImplementation( () => newBlock );

		const instance = getTestInstanceWithContent( before + after );

		// When
		instance.splitBlock( before, after, ...blocks );

		// Then

		// Do NOT remove current block
		expect( instance.props.onReplace ).toHaveBeenCalledTimes( 0 );

		// Should ask for creating a new paragraph block with the second half of the text.
		expect( createBlock ).toHaveBeenCalledTimes( 1 );
		expect( createBlock ).toHaveBeenCalledWith( 'core/paragraph', { content: after } );

		// Insert new block with the second half of the text
		expect( instance.props.insertBlocksAfter ).toHaveBeenCalledTimes( 1 );
		expect( instance.props.insertBlocksAfter ).toHaveBeenCalledWith( [ newBlock ] );

		// Replace current block content with first half of the text.
		expect( instance.props.setAttributes ).toHaveBeenCalledTimes( 1 );
		expect( instance.props.setAttributes ).toHaveBeenCalledWith( { content: before } );
	} );
} );
