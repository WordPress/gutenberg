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

	it( 'should have valid class', () => {
		const wrapper = shallow( <Warning /> );

		expect( wrapper.hasClass( 'editor-warning' ) ).toBe( true );
		expect( wrapper.find( '.editor-warning__actions' ) ).toHaveLength( 0 );
		expect( wrapper.find( '.editor-warning__hidden' ) ).toHaveLength( 0 );
	} );

	it( 'should show child error message element', () => {
		const wrapper = shallow( <Warning primaryActions={ <button /> }>Message</Warning> );

		const actions = wrapper.find( '.editor-warning__actions' );
		const action = actions.childAt( 0 );

		expect( actions ).toHaveLength( 1 );
		expect( action.hasClass( 'editor-warning__action' ) ).toBe( true );
		expect( action.childAt( 0 ).type() ).toBe( 'button' );
	} );

	it( 'should show hidden actions', () => {
		const wrapper = shallow( <Warning hiddenActions={ [ { title: 'test', onClick: null } ] }>Message</Warning> );

		const actions = wrapper.find( '.editor-warning__hidden' );

		expect( actions ).toHaveLength( 1 );
	} );
} );
