/**
 * External dependencies
 */
import { render, unmountComponentAtNode } from 'react-dom';
import { act, Simulate } from 'react-dom/test-utils';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { UP, DOWN } from '@wordpress/keycodes';

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

			const input = getInput();

			expect( input.classList.contains( 'hello' ) ).toBe( true );
		} );
	} );

	describe( 'onChange handling', () => {
		it( 'should provide onChange callback with string value', () => {
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

			expect( spy.mock.calls[ 0 ][ 0 ] ).toBe( '10' );
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

		it( 'should increment by step on key UP press', () => {
			act( () => {
				render( <StatefulNumberControl value={ 5 } />, container );
			} );

			const input = getInput();

			act( () => {
				Simulate.keyDown( input, { keyCode: UP } );
			} );

			expect( input.value ).toBe( '6' );
		} );

		it( 'should increment from a negative value', () => {
			act( () => {
				render( <StatefulNumberControl value={ -5 } />, container );
			} );

			const input = getInput();

			act( () => {
				Simulate.keyDown( input, { keyCode: UP } );
			} );

			expect( input.value ).toBe( '-4' );
		} );

		it( 'should increment by shiftStep on key UP + shift press', () => {
			act( () => {
				render(
					<StatefulNumberControl value={ 5 } shiftStep={ 10 } />,
					container
				);
			} );

			const input = getInput();

			act( () => {
				Simulate.keyDown( input, { keyCode: UP, shiftKey: true } );
			} );

			expect( input.value ).toBe( '20' );
		} );

		it( 'should increment by custom shiftStep on key UP + shift press', () => {
			act( () => {
				render(
					<StatefulNumberControl value={ 5 } shiftStep={ 100 } />,
					container
				);
			} );

			const input = getInput();

			act( () => {
				Simulate.keyDown( input, { keyCode: UP, shiftKey: true } );
			} );

			expect( input.value ).toBe( '100' );
		} );

		it( 'should increment but be limited by max on shiftStep', () => {
			act( () => {
				render(
					<StatefulNumberControl
						value={ 5 }
						shiftStep={ 100 }
						max={ 99 }
					/>,
					container
				);
			} );

			const input = getInput();

			act( () => {
				Simulate.keyDown( input, { keyCode: UP, shiftKey: true } );
			} );

			expect( input.value ).toBe( '99' );
		} );

		it( 'should not increment by shiftStep if disabled', () => {
			act( () => {
				render(
					<StatefulNumberControl
						value={ 5 }
						shiftStep={ 100 }
						isShiftStepEnabled={ false }
					/>,
					container
				);
			} );

			const input = getInput();

			act( () => {
				Simulate.keyDown( input, { keyCode: UP, shiftKey: true } );
			} );

			expect( input.value ).toBe( '6' );
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

		it( 'should decrement by step on key DOWN press', () => {
			act( () => {
				render( <StatefulNumberControl value={ 5 } />, container );
			} );

			const input = getInput();

			act( () => {
				Simulate.keyDown( input, { keyCode: DOWN } );
			} );

			expect( input.value ).toBe( '4' );
		} );

		it( 'should decrement from a negative value', () => {
			act( () => {
				render( <StatefulNumberControl value={ -5 } />, container );
			} );

			const input = getInput();

			act( () => {
				Simulate.keyDown( input, { keyCode: DOWN } );
			} );

			expect( input.value ).toBe( '-6' );
		} );

		it( 'should decrement by shiftStep on key DOWN + shift press', () => {
			act( () => {
				render( <StatefulNumberControl value={ 5 } />, container );
			} );

			const input = getInput();

			act( () => {
				Simulate.keyDown( input, { keyCode: DOWN, shiftKey: true } );
			} );

			expect( input.value ).toBe( '0' );
		} );

		it( 'should decrement by custom shiftStep on key DOWN + shift press', () => {
			act( () => {
				render(
					<StatefulNumberControl value={ 5 } shiftStep={ 100 } />,
					container
				);
			} );

			const input = getInput();

			act( () => {
				Simulate.keyDown( input, { keyCode: DOWN, shiftKey: true } );
			} );

			expect( input.value ).toBe( '-100' );
		} );

		it( 'should decrement but be limited by min on shiftStep', () => {
			act( () => {
				render(
					<StatefulNumberControl
						value={ 5 }
						shiftStep={ 100 }
						min={ 4 }
					/>,
					container
				);
			} );

			const input = getInput();

			act( () => {
				Simulate.keyDown( input, { keyCode: DOWN, shiftKey: true } );
			} );

			expect( input.value ).toBe( '4' );
		} );

		it( 'should not decrement by shiftStep if disabled', () => {
			act( () => {
				render(
					<StatefulNumberControl
						value={ 5 }
						shiftStep={ 100 }
						isShiftStepEnabled={ false }
					/>,
					container
				);
			} );

			const input = getInput();

			act( () => {
				Simulate.keyDown( input, { keyCode: DOWN, shiftKey: true } );
			} );

			expect( input.value ).toBe( '4' );
		} );
	} );
} );
