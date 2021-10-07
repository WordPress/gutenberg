/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { DefaultBlockAppender, ZWNBSP } from '../';

describe( 'DefaultBlockAppender', () => {
	const expectOnAppendCalled = ( onAppend ) => {
		expect( onAppend ).toHaveBeenCalledTimes( 1 );
		expect( onAppend ).toHaveBeenCalledWith();
	};

	it( 'should render nothing if not visible', () => {
		const wrapper = shallow( <DefaultBlockAppender /> );

		expect( wrapper.type() ).toBe( null );
	} );

	it( 'should match snapshot', () => {
		const onAppend = jest.fn();
		const wrapper = shallow(
			<DefaultBlockAppender isVisible onAppend={ onAppend } showPrompt />
		);

		expect( wrapper ).toMatchSnapshot();
	} );

	it( 'should append a default block when input focused', () => {
		const onAppend = jest.fn();
		const wrapper = shallow(
			<DefaultBlockAppender isVisible onAppend={ onAppend } showPrompt />
		);

		wrapper.find( 'p' ).simulate( 'focus' );

		expect( wrapper ).toMatchSnapshot();

		expectOnAppendCalled( onAppend );
	} );

	it( 'should optionally show without prompt', () => {
		const onAppend = jest.fn();
		const wrapper = shallow(
			<DefaultBlockAppender
				isVisible
				onAppend={ onAppend }
				showPrompt={ false }
			/>
		);
		const input = wrapper.find( 'p' );

		expect( input.prop( 'children' ) ).toEqual( ZWNBSP );

		expect( wrapper ).toMatchSnapshot();
	} );
} );
