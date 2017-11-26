/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { DefaultBlockAppender } from '../';

describe( 'DefaultBlockAppender', () => {
	const expectInsertBlockCalled = ( insertBlock ) => {
		expect( insertBlock ).toHaveBeenCalledTimes( 1 );
		expect( insertBlock ).toHaveBeenCalledWith( expect.objectContaining( {
			attributes: {},
			isValid: true,
			name: 'core/paragraph',
			uid: expect.any( String ),
		} ) );
	};

	describe( 'no block present', () => {
		it( 'should match snapshot', () => {
			const wrapper = shallow( <DefaultBlockAppender count={ 0 } /> );

			expect( wrapper ).toMatchSnapshot();
		} );

		it( 'should append a default block when input clicked', () => {
			const insertBlock = jest.fn();
			const wrapper = shallow( <DefaultBlockAppender count={ 0 } onInsertBlock={ insertBlock } /> );

			wrapper.find( 'input.editor-default-block-appender__content' ).simulate( 'click' );

			expectInsertBlockCalled( insertBlock );
		} );

		it( 'should append a default block when input focused', () => {
			const insertBlock = jest.fn();
			const wrapper = shallow( <DefaultBlockAppender count={ 0 } onInsertBlock={ insertBlock } /> );

			wrapper.find( 'input.editor-default-block-appender__content' ).simulate( 'focus' );

			expectInsertBlockCalled( insertBlock );
		} );
	} );

	describe( 'blocks present', () => {
		it( 'should match snapshot', () => {
			const wrapper = shallow( <DefaultBlockAppender count={ 5 } /> );

			expect( wrapper ).toMatchSnapshot();
		} );

		it( 'should append a default block when button clicked', () => {
			const insertBlock = jest.fn();
			const wrapper = shallow( <DefaultBlockAppender count={ 5 } onInsertBlock={ insertBlock } /> );

			wrapper.find( 'button.editor-default-block-appender__content' ).simulate( 'click' );

			expectInsertBlockCalled( insertBlock );
		} );
	} );
} );
