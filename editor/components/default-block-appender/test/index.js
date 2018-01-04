/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { DefaultBlockAppender } from '../';

describe( 'DefaultBlockAppender', () => {
	const expectAppendDefaultBlockCalled = ( appendDefaultBlock ) => {
		expect( appendDefaultBlock ).toHaveBeenCalledTimes( 1 );
		expect( appendDefaultBlock ).toHaveBeenCalledWith();
	};

	describe( 'no block present', () => {
		it( 'should match snapshot', () => {
			const appendDefaultBlock = jest.fn();
			const wrapper = shallow( <DefaultBlockAppender count={ 0 } appendDefaultBlock={ appendDefaultBlock } /> );

			expect( wrapper ).toMatchSnapshot();
		} );

		it( 'should append a default block when input clicked', () => {
			const appendDefaultBlock = jest.fn();
			const wrapper = shallow( <DefaultBlockAppender count={ 0 } appendDefaultBlock={ appendDefaultBlock } /> );

			wrapper.find( 'input.editor-default-block-appender__content' ).simulate( 'click' );

			expectAppendDefaultBlockCalled( appendDefaultBlock );
		} );

		it( 'should append a default block when input focused', () => {
			const appendDefaultBlock = jest.fn();
			const wrapper = shallow( <DefaultBlockAppender count={ 0 } appendDefaultBlock={ appendDefaultBlock } /> );

			wrapper.find( 'input.editor-default-block-appender__content' ).simulate( 'focus' );

			expectAppendDefaultBlockCalled( appendDefaultBlock );
		} );
	} );

	describe( 'blocks present', () => {
		it( 'should match snapshot', () => {
			const wrapper = shallow( <DefaultBlockAppender count={ 5 } /> );

			expect( wrapper ).toMatchSnapshot();
		} );
	} );
} );
