/**
 * Internal dependencies
 */
import { createElement } from '..';
import { render, hydrate, unmountComponentAtNode } from '../react-polyfill';

describe( 'render', () => {
	it( 'should render into a container', () => {
		const container = document.createElement( 'div' );

		render( createElement( 'p', null, 'hello' ), container );

		expect( container ).toHaveTextContent( 'hello' );
		expect( console ).toHaveWarned();
	} );

	it( 'should update the container on subsequent renders', () => {
		const container = document.createElement( 'div' );

		render( createElement( 'p', null, 'hello' ), container );
		render( createElement( 'p', null, 'world' ), container );

		expect( container ).toHaveTextContent( 'world' );
	} );

	it( 'should call the callback after rendering', () => {
		const container = document.createElement( 'div' );
		const callback = jest.fn();

		render( createElement( 'p', null, 'hello' ), container, callback );

		expect( callback ).toHaveBeenCalledTimes( 1 );
		expect( container ).toHaveTextContent( 'hello' );
	} );
} );

describe( 'hydrate', () => {
	it( 'should hydrate into a container with matching markup', () => {
		const container = document.createElement( 'div' );
		container.innerHTML = '<p>hello</p>';

		hydrate( createElement( 'p', null, 'hello' ), container );

		expect( container ).toHaveTextContent( 'hello' );
		expect( console ).toHaveWarned();
	} );

	it( 'should call the callback after hydrating', () => {
		const container = document.createElement( 'div' );
		container.innerHTML = '<p>hello</p>';
		const callback = jest.fn();

		hydrate( createElement( 'p', null, 'hello' ), container, callback );

		expect( callback ).toHaveBeenCalledTimes( 1 );
	} );
} );

describe( 'unmountComponentAtNode', () => {
	it( 'should return false when the container has no root', () => {
		const container = document.createElement( 'div' );

		expect( unmountComponentAtNode( container ) ).toBe( false );
		expect( console ).toHaveWarned();
	} );

	it( 'should unmount and return true when a root exists', () => {
		const container = document.createElement( 'div' );

		render( createElement( 'p', null, 'hello' ), container );
		expect( container ).toHaveTextContent( 'hello' );

		expect( unmountComponentAtNode( container ) ).toBe( true );
		expect( container ).toHaveTextContent( '' );
		expect( unmountComponentAtNode( container ) ).toBe( false );
	} );
} );
