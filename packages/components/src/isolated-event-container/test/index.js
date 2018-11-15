/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import IsolatedEventContainer from '../';

describe( 'IsolatedEventContainer', () => {
	it( 'should pass props to container', () => {
		const isolated = shallow( <IsolatedEventContainer className="test" onClick="click" /> );

		expect( isolated.hasClass( 'test' ) ).toBe( true );
		expect( isolated.prop( 'onClick' ) ).toBe( 'click' );
	} );

	it( 'should stop mousedown event propagation', () => {
		const isolated = shallow( <IsolatedEventContainer /> );
		const event = { stopPropagation: jest.fn() };

		isolated.simulate( 'mousedown', event );
		expect( event.stopPropagation ).toHaveBeenCalled();
	} );
} );
