/**
 * External dependencies
 */
import { render, act } from '@testing-library/react';

/**
 * Internal dependencies
 */
import AlignmentMatrixControl from '../';

const __windowFocus = window.focus;

beforeAll( () => {
	window.focus = jest.fn();
} );

afterAll( () => {
	window.focus = __windowFocus;
} );

let container = null;

const getControl = () => {
	return container.querySelector( '.component-alignment-matrix-control' );
};

const getCells = () => {
	const control = getControl();
	return control.querySelectorAll( '[role="gridcell"]' );
};

describe( 'AlignmentMatrixControl', () => {
	describe( 'Basic rendering', () => {
		it( 'should render', () => {
			act( () => {
				container = render( <AlignmentMatrixControl /> ).container;
			} );
			const control = getControl();

			expect( control ).toBeTruthy();
		} );
	} );

	describe( 'Change value', () => {
		it( 'should change value on cell click', () => {
			const spy = jest.fn();

			act( () => {
				container = render(
					<AlignmentMatrixControl
						value={ 'center' }
						onChange={ spy }
					/>
				).container;
			} );

			const cells = getCells();

			act( () => {
				cells[ 3 ].focus();
			} );

			expect( spy.mock.calls[ 0 ][ 0 ] ).toBe( 'center left' );

			act( () => {
				cells[ 4 ].focus();
			} );

			expect( spy.mock.calls[ 1 ][ 0 ] ).toBe( 'center center' );

			act( () => {
				cells[ 7 ].focus();
			} );

			expect( spy.mock.calls[ 2 ][ 0 ] ).toBe( 'bottom center' );
		} );
	} );
} );
