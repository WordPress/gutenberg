/**
 * External dependencies
 */
import { render, unmountComponentAtNode } from 'react-dom';
import { act, Simulate } from 'react-dom/test-utils';

/**
 * Internal dependencies
 */
import AlignmentMatrixControl from '../';

let container = null;

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

const getCells = () => {
	const control = getControl();
	return control.querySelectorAll( '[role="gridcell"]' );
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

	describe( 'Change value', () => {
		it( 'should change value on cell click', () => {
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

			const cells = getCells();

			act( () => Simulate.click( cells[ 3 ] ) );

			expect( spy.mock.calls[ 0 ][ 0 ] ).toBe( 'center left' );

			act( () => Simulate.click( cells[ 4 ] ) );

			expect( spy.mock.calls[ 1 ][ 0 ] ).toBe( 'center center' );

			act( () => Simulate.click( cells[ 7 ] ) );

			expect( spy.mock.calls[ 2 ][ 0 ] ).toBe( 'bottom center' );
		} );
	} );
} );
