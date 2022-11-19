/**
 * External dependencies
 */
import { render, screen, within } from '@testing-library/react';

/**
 * Internal dependencies
 */
import AlignmentMatrixControl from '../';

const getControl = () => {
	return screen.getByRole( 'grid' );
};

const getCell = ( name ) => {
	return within( getControl() ).getByRole( 'gridcell', { name } );
};

describe( 'AlignmentMatrixControl', () => {
	describe( 'Basic rendering', () => {
		it( 'should render', () => {
			render( <AlignmentMatrixControl /> );

			expect( getControl() ).toBeInTheDocument();
		} );
	} );

	describe( 'Change value', () => {
		const alignments = [ 'center left', 'center center', 'bottom center' ];

		it.each( alignments )(
			'should change value on %s cell click',
			( alignment ) => {
				const spy = jest.fn();

				render(
					<AlignmentMatrixControl value="center" onChange={ spy } />
				);

				getCell( alignment ).focus();

				expect( spy ).toHaveBeenCalledWith( alignment );
			}
		);
	} );
} );
