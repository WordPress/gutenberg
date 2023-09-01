/**
 * External dependencies
 */
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import AlignmentMatrixControl from '..';

const getControl = () => {
	return screen.getByRole( 'grid' );
};

const getCell = ( name: string ) => {
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
		const user = userEvent.setup();

		it.each( alignments )(
			'should change value on %s cell click',
			async ( alignment ) => {
				const spy = jest.fn();

				render(
					<AlignmentMatrixControl value="center" onChange={ spy } />
				);

				await user.click( getCell( alignment ) );

				expect( getCell( alignment ) ).toHaveFocus();

				expect( spy ).toHaveBeenCalledWith( alignment );
			}
		);
	} );
} );
