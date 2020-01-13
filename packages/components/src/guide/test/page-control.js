/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import PageControl from '../page-control';

describe( 'PageControl', () => {
	it( 'renders an empty list when there are no pages', () => {
		const wrapper = shallow( <PageControl currentPage={ 0 } numberOfPages={ 0 } /> );
		expect( wrapper.find( Button ) ).toHaveLength( 0 );
	} );

	it( 'renders a button for each page', () => {
		const wrapper = shallow( <PageControl currentPage={ 0 } numberOfPages={ 5 } /> );
		expect( wrapper.find( Button ) ).toHaveLength( 5 );
	} );

	it( 'sets the current page when a button is clicked', () => {
		const setCurrentPage = jest.fn();
		const wrapper = shallow(
			<PageControl
				currentPage={ 0 }
				numberOfPages={ 2 }
				setCurrentPage={ setCurrentPage }
			/>
		);
		wrapper.find( Button ).at( 1 ).simulate( 'click' );
		expect( setCurrentPage ).toHaveBeenCalledWith( 1 );
	} );
} );
