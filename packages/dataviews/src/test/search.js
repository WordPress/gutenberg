/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import Search from '../search.js';

describe( 'DataViews search component', () => {
	const onChangeView = jest.fn();
	it( 'should not reset page when first rendered', () => {
		const view = {
			search: '',
		};
		render(
			<Search
				label="search"
				view={ view }
				onChangeView={ onChangeView }
			/>
		);
		expect( onChangeView ).toHaveBeenCalledTimes( 0 );
	} );

	it( 'should reset page if search term was changed', () => {
		const view = {
			search: '',
		};
		const { rerender } = render(
			<Search
				label="search"
				view={ view }
				onChangeView={ onChangeView }
			/>
		);
		const viewNext = {
			search: 'search term',
		};
		rerender(
			<Search
				label="search"
				view={ viewNext }
				onChangeView={ onChangeView }
			/>
		);
		expect( onChangeView ).toHaveBeenCalledTimes( 1 );
	} );
} );
