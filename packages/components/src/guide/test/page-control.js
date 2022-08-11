/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import PageControl from '../page-control';

describe( 'PageControl', () => {
	it( 'renders an empty list when there are no pages', () => {
		render( <PageControl currentPage={ 0 } numberOfPages={ 0 } /> );
		expect( screen.queryByRole( 'button' ) ).not.toBeInTheDocument();
	} );

	it( 'renders a button for each page', () => {
		render( <PageControl currentPage={ 0 } numberOfPages={ 5 } /> );
		expect( screen.getAllByRole( 'button' ) ).toHaveLength( 5 );
	} );

	it( 'sets the current page when a button is clicked', async () => {
		const user = userEvent.setup( { delay: null } );
		const setCurrentPage = jest.fn();
		render(
			<PageControl
				currentPage={ 0 }
				numberOfPages={ 2 }
				setCurrentPage={ setCurrentPage }
			/>
		);

		await user.click( screen.getAllByRole( 'button' )[ 1 ] );

		expect( setCurrentPage ).toHaveBeenCalledWith( 1 );
	} );
} );
