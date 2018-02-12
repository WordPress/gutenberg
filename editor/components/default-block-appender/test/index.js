/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { DefaultBlockAppender } from '../';

describe( 'DefaultBlockAppender', () => {
	const expectOnAppendCalled = ( onAppend ) => {
		expect( onAppend ).toHaveBeenCalledTimes( 1 );
		expect( onAppend ).toHaveBeenCalledWith();
	};

	it( 'should match snapshot', () => {
		const onAppend = jest.fn();
		const wrapper = shallow( <DefaultBlockAppender onAppend={ onAppend } /> );

		expect( wrapper ).toMatchSnapshot();
	} );

	it( 'should append a default block when input clicked', () => {
		const onAppend = jest.fn();
		const wrapper = shallow( <DefaultBlockAppender onAppend={ onAppend } /> );
		const input = wrapper.find( 'input.editor-default-block-appender__content' );

		expect( input.prop( 'value' ) ).toEqual( 'Write your story' );
		input.simulate( 'click' );

		expectOnAppendCalled( onAppend );
	} );

	it( 'should append a default block when input focused', () => {
		const onAppend = jest.fn();
		const wrapper = shallow( <DefaultBlockAppender onAppend={ onAppend } /> );

		wrapper.find( 'input.editor-default-block-appender__content' ).simulate( 'focus' );

		expect( wrapper ).toMatchSnapshot();

		expectOnAppendCalled( onAppend );
	} );

	it( 'should optionally show without prompt', () => {
		const onAppend = jest.fn();
		const wrapper = shallow( <DefaultBlockAppender onAppend={ onAppend } showPrompt={ false } /> );
		const input = wrapper.find( 'input.editor-default-block-appender__content' );

		expect( input.prop( 'value' ) ).toEqual( '' );

		expect( wrapper ).toMatchSnapshot();
	} );
} );
