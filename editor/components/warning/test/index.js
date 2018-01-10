/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import Warning from '../index';

describe( 'Warning', () => {
	it( 'should match snapshot', () => {
		const wrapper = shallow( <Warning>error</Warning> );
		expect( wrapper ).toMatchSnapshot();
	} );
	it( 'should has valid class', () => {
		const wrapper = shallow( <Warning /> );
		expect( wrapper.hasClass( 'editor-warning' ) ).toBe( true );
	} );
	it( 'should show child error message element', () => {
		const wrapper = shallow( <Warning><p>message</p></Warning> );
		expect( wrapper.find( 'p' ).text() ).toBe( 'message' );
	} );
} );
