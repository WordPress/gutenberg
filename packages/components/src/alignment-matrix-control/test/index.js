/**
 * External dependencies
 */
import { render, screen, within } from '@testing-library/react';

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

const getControl = () => {
	return screen.getByRole( 'grid' );
};

const getCells = () => {
	return within( getControl() ).getAllByRole( 'gridcell' );
};

describe( 'AlignmentMatrixControl', () => {
	describe( 'Basic rendering', () => {
		it( 'should render', () => {
			render( <AlignmentMatrixControl /> );

			expect( getControl() ).toBeTruthy();
		} );
	} );

	describe( 'Change value', () => {
		it( 'should change value on cell click', () => {
			const spy = jest.fn();

			render(
				<AlignmentMatrixControl value={ 'center' } onChange={ spy } />
			);

			const cells = getCells();

			cells[ 3 ].focus();

			expect( spy.mock.calls[ 0 ][ 0 ] ).toBe( 'center left' );

			cells[ 4 ].focus();

			expect( spy.mock.calls[ 1 ][ 0 ] ).toBe( 'center center' );

			cells[ 7 ].focus();

			expect( spy.mock.calls[ 2 ][ 0 ] ).toBe( 'bottom center' );
		} );
	} );
} );
