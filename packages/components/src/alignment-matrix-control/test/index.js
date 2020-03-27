/**
 * External dependencies
 */
import { render, unmountComponentAtNode } from 'react-dom';
import { act } from 'react-dom/test-utils';

/**
 * WordPress dependencies
 */
import { UP, DOWN, LEFT, RIGHT } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import AlignmentMatrixControl from '../';

let container = null;

function triggerKeyDown( el, { keyCode } ) {
	// modern browsers, IE9+
	const e = document.createEvent( 'HTMLEvents' );
	e.keyCode = keyCode;
	e.initEvent( 'keydown', false, true );
	el.dispatchEvent( e );
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

const getControl = () => {
	return container.querySelector( '.component-alignment-matrix-control' );
};

describe( 'AlignmentMatrixControl', () => {
	describe( 'Basic rendering', () => {
		it( 'should render', () => {
			act( () => {
				render( <AlignmentMatrixControl />, container );
			} );
			const control = getControl();

			expect( control ).toBeTruthy();
		} );
	} );

	describe( 'Keyboard movement', () => {
		it( 'should move the next value up on UP press', () => {
			const spy = jest.fn();

			act( () => {
				render(
					<AlignmentMatrixControl
						value={ 'center' }
						onChange={ spy }
					/>,
					container
				);
			} );

			const control = getControl();

			act( () => {
				triggerKeyDown( control, { keyCode: UP } );
			} );

			expect( spy.mock.calls[ 0 ][ 0 ] ).toBe( 'center top' );
		} );

		it( 'should move the next value down on DOWN press', () => {
			const spy = jest.fn();

			act( () => {
				render(
					<AlignmentMatrixControl
						value={ 'center' }
						onChange={ spy }
					/>,
					container
				);
			} );

			const control = getControl();

			act( () => {
				triggerKeyDown( control, { keyCode: DOWN } );
			} );

			expect( spy.mock.calls[ 0 ][ 0 ] ).toBe( 'bottom center' );
		} );

		it( 'should move the next value left on LEFT press', () => {
			const spy = jest.fn();

			act( () => {
				render(
					<AlignmentMatrixControl
						value={ 'center' }
						onChange={ spy }
					/>,
					container
				);
			} );

			const control = getControl();

			act( () => {
				triggerKeyDown( control, { keyCode: LEFT } );
			} );

			expect( spy.mock.calls[ 0 ][ 0 ] ).toBe( 'center left' );
		} );

		it( 'should move the next value right on RIGHT press', () => {
			const spy = jest.fn();

			act( () => {
				render(
					<AlignmentMatrixControl
						value={ 'center' }
						onChange={ spy }
					/>,
					container
				);
			} );

			const control = getControl();

			act( () => {
				triggerKeyDown( control, { keyCode: RIGHT } );
			} );

			expect( spy.mock.calls[ 0 ][ 0 ] ).toBe( 'center right' );
		} );
	} );
} );
