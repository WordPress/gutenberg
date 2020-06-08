/**
 * External dependencies
 */
import { render, unmountComponentAtNode } from 'react-dom';
import { act, Simulate } from 'react-dom/test-utils';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { UP, DOWN, ENTER } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import NumberControl from '../';

let container = null;

function getInput() {
	return container.querySelector( 'input' );
}

beforeEach( () => {
	container = document.createElement( 'div' );
	document.body.appendChild( container );
} );

afterEach( () => {
	unmountComponentAtNode( container );
	container.remove();
	container = null;
} );

function StatefulNumberControl( props ) {
	const [ value, setValue ] = useState( props.value );
	const handleOnChange = ( v ) => setValue( v );

	return (
		<NumberControl
			{ ...props }
			value={ value }
			onChange={ handleOnChange }
		/>
	);
}

describe( 'NumberControl', () => {
	describe( 'Basic rendering', () => {
		it( 'should render', () => {
			act( () => {
				render( <NumberControl />, container );
			} );

			const input = getInput();

			expect( input ).not.toBeNull();
		} );

		it( 'should render custom className', () => {
			act( () => {
				render( <NumberControl className="hello" />, container );
			} );

			const input = container.querySelector( '.hello' );

			expect( input ).toBeTruthy();
		} );
	} );

	describe( 'onChange handling', () => {
		it( 'should provide onChange callback with number value', () => {
			const spy = jest.fn();
			act( () => {
				render(
					<NumberControl value={ 5 } onChange={ spy } />,
					container
				);
			} );

			const input = getInput();

			input.value = 10;

			act( () => {
				Simulate.change( input );
			} );

			const changeValue = spy.mock.calls[ 0 ][ 0 ];

			expect( changeValue ).toBe( '10' );
		} );
	} );

	describe( 'Validation', () => {
		it( 'should clamp value within range on ENTER keypress', () => {
			act( () => {
				render(
					<NumberControl value={ 5 } min={ 0 } max={ 10 } />,
					container
				);
			} );

			const input = getInput();
			input.value = -100;

			act( () => {
				Simulate.change( input );
				Simulate.keyDown( input, { keyCode: ENTER } );
			} );

			/**
			 * This is zero because the value has been adjusted to
			 * respect the min/max range of the input.
			 */
			expect( input.value ).toBe( '0' );
		} );

		it( 'should parse to number value on ENTER keypress', () => {
			act( () => {
				render( <NumberControl value={ 5 } />, container );
			} );

			const input = getInput();
			input.value = '10 abc';

			act( () => {
				Simulate.change( input );
				Simulate.keyDown( input, { keyCode: ENTER } );
			} );

			expect( input.value ).toBe( '0' );
		} );
	} );

	describe( 'Key UP interactions', () => {
		it( 'should fire onKeyDown callback', () => {
			const spy = jest.fn();
			act( () => {
				render(
					<StatefulNumberControl value={ 5 } onKeyDown={ spy } />,
					container
				);
			} );

			const input = getInput();

			act( () => {
				Simulate.keyDown( input, { keyCode: UP } );
			} );

			expect( spy ).toHaveBeenCalled();
		} );
	} );

	describe( 'Key DOWN interactions', () => {
		it( 'should fire onKeyDown callback', () => {
			const spy = jest.fn();
			act( () => {
				render(
					<StatefulNumberControl value={ 5 } onKeyDown={ spy } />,
					container
				);
			} );

			const input = getInput();

			act( () => {
				Simulate.keyDown( input, { keyCode: DOWN } );
			} );

			expect( spy ).toHaveBeenCalled();
		} );
	} );
} );
