/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import Notice from '../index';

describe( 'Notice', () => {
	it( 'should has valid class', () => {
		const wrapper = shallow( <Notice status="example" /> );
		expect( wrapper.hasClass( 'notice' ) ).toBe( true );
		expect( wrapper.hasClass( 'notice-alt' ) ).toBe( true );
		expect( wrapper.hasClass( 'notice-example' ) ).toBe( true );
		expect( wrapper.hasClass( 'is-dismissible' ) ).toBe( true );
	} );
	it( 'should not has is-dismissible class when isDismissible prop is false', () => {
		const wrapper = shallow( <Notice isDismissible={ false } /> );
		expect( wrapper.hasClass( 'is-dismissible' ) ).toBe( false );
	} );
} );
