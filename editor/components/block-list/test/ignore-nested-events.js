/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import IgnoreNestedEvents from '../ignore-nested-events';

describe( 'IgnoreNestedEvents', () => {
	it( 'passes props to its rendered div', () => {
		const wrapper = shallow(
			<IgnoreNestedEvents className="foo" />
		);

		expect( wrapper.type() ).toBe( 'div' );
		expect( wrapper.prop( 'className' ) ).toBe( 'foo' );
	} );

	it( 'stops propagation of events to ancestor IgnoreNestedEvents', () => {
		const spyOuter = jest.fn();
		const spyInner = jest.fn();
		const wrapper = shallow(
			<IgnoreNestedEvents onClick={ spyOuter }>
				<IgnoreNestedEvents onClick={ spyInner } />
			</IgnoreNestedEvents>
		);

		wrapper.childAt( 0 ).simulate( 'click' );

		expect( spyInner ).toHaveBeenCalled();
		expect( spyOuter ).not.toHaveBeenCalled();
	} );

	it( 'stops propagation of child handled events', () => {
		const spyOuter = jest.fn();
		const spyInner = jest.fn();
		const wrapper = shallow(
			<IgnoreNestedEvents onClick={ spyOuter }>
				<IgnoreNestedEvents childHandledEvents={ [ 'onClick' ] }>
					<div />
					<IgnoreNestedEvents onClick={ spyInner } />
				</IgnoreNestedEvents>
			</IgnoreNestedEvents>
		);

		const div = wrapper.childAt( 0 ).childAt( 0 );
		div.simulate( 'click' );

		expect( spyInner ).not.toHaveBeenCalled();
		expect( spyOuter ).not.toHaveBeenCalled();
	} );
} );
