/**
 * WordPress dependencies
 */
import { Component, createRoot } from '@wordpress/element';

/**
 * Internal dependencies
 */
import pure from '../';

describe( 'pure', () => {
	it( 'functional component should rerender only when props change', () => {
		let i = 0;
		const MyComp = pure( () => {
			return <p>{ ++i }</p>;
		} );
		const container = document.createElement( 'div' );
		const root = createRoot( container );
		root.render( <MyComp /> );
		jest.runAllTimers();
		expect( container.innerHTML ).toBe( '<p>1</p>' );
		root.render( <MyComp prop="a" /> ); // New prop should trigger a rerender.
		jest.runAllTimers();
		expect( container.innerHTML ).toBe( '<p>2</p>' );
		root.render( <MyComp prop="a" /> ); // Keeping the same prop value should not rerender.
		jest.runAllTimers();
		expect( container.innerHTML ).toBe( '<p>2</p>' );
		root.render( <MyComp prop="b" /> ); // Changing the prop value should rerender.
		jest.runAllTimers();
		expect( container.innerHTML ).toBe( '<p>3</p>' );
	} );

	it( 'class component should rerender if the props or state change', () => {
		let i = 0;
		const MyComp = pure(
			class extends Component {
				constructor() {
					super( ...arguments );
					this.state = {};
				}
				render() {
					return <p>{ ++i }</p>;
				}
			}
		);
		const ref = { current: null };
		const container = document.createElement( 'div' );
		const root = createRoot( container );
		root.render( <MyComp ref={ ref } /> );
		jest.runAllTimers();
		expect( container.innerHTML ).toBe( '<p>1</p>' );
		root.render( <MyComp ref={ ref } prop="a" /> ); // New prop should trigger a rerender.
		jest.runAllTimers();
		expect( container.innerHTML ).toBe( '<p>2</p>' );
		root.render( <MyComp ref={ ref } prop="a" /> ); // Keeping the same prop value should not rerender.
		jest.runAllTimers();
		expect( container.innerHTML ).toBe( '<p>2</p>' );
		root.render( <MyComp ref={ ref } prop="b" /> ); // Changing the prop value should rerender.
		jest.runAllTimers();
		expect( container.innerHTML ).toBe( '<p>3</p>' );
		ref.current.setState( { state: 'a' } ); // New state value should trigger a rerender.
		jest.runAllTimers();
		expect( container.innerHTML ).toBe( '<p>4</p>' );
		ref.current.setState( { state: 'a' } ); // Keeping the same state value should not trigger a rerender.
		jest.runAllTimers();
		expect( container.innerHTML ).toBe( '<p>4</p>' );
	} );
} );
