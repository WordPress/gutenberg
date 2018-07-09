/**
 * External dependencies
 */
import { mount } from 'enzyme';

/**
 * Internal dependencies
 */
import { Component } from '../../../api';
import pure from '../';

describe( 'pure', () => {
	it( 'functional component should rerender only when props change', () => {
		let i = 0;
		const MyComp = pure( () => {
			return <p>{ ++i }</p>;
		} );
		const wrapper = mount( <MyComp /> );
		wrapper.update(); // Updating with same props doesn't rerender
		expect( wrapper.html() ).toBe( '<p>1</p>' );
		wrapper.setProps( { prop: 'a' } ); // New prop should trigger a rerender
		expect( wrapper.html() ).toBe( '<p>2</p>' );
		wrapper.setProps( { prop: 'a' } ); // Keeping the same prop value should not rerender
		expect( wrapper.html() ).toBe( '<p>2</p>' );
		wrapper.setProps( { prop: 'b' } ); // Changing the prop value should rerender
		expect( wrapper.html() ).toBe( '<p>3</p>' );
	} );

	it( 'class component should rerender if the props or state change', () => {
		let i = 0;
		const MyComp = pure( class extends Component {
			constructor() {
				super( ...arguments );
				this.state = {};
			}
			render() {
				return <p>{ ++i }</p>;
			}
		} );
		const wrapper = mount( <MyComp /> );
		wrapper.update(); // Updating with same props doesn't rerender
		expect( wrapper.html() ).toBe( '<p>1</p>' );
		wrapper.setProps( { prop: 'a' } ); // New prop should trigger a rerender
		expect( wrapper.html() ).toBe( '<p>2</p>' );
		wrapper.setProps( { prop: 'a' } ); // Keeping the same prop value should not rerender
		expect( wrapper.html() ).toBe( '<p>2</p>' );
		wrapper.setProps( { prop: 'b' } ); // Changing the prop value should rerender
		expect( wrapper.html() ).toBe( '<p>3</p>' );
		wrapper.setState( { state: 'a' } ); // New state value should trigger a rerender
		expect( wrapper.html() ).toBe( '<p>4</p>' );
		wrapper.setState( { state: 'a' } ); // Keeping the same state value should not trigger a rerender
		expect( wrapper.html() ).toBe( '<p>4</p>' );
	} );
} );
