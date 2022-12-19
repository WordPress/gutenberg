/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import PostAuthorCheck from '../check';

jest.mock( '@wordpress/data/src/components/use-select', () => {
	// This allows us to tweak the returned value on each test.
	const mock = jest.fn();
	return mock;
} );

describe( 'PostAuthorCheck', () => {
	it( 'should not render anything if has no authors', () => {
		useSelect.mockImplementation( () => ( {
			hasAuthors: false,
			hasAssignAuthorAction: true,
		} ) );

		render( <PostAuthorCheck>authors</PostAuthorCheck> );
		expect( screen.queryByText( 'authors' ) ).not.toBeInTheDocument();
	} );

	it( "should not render anything if doesn't have author action", () => {
		useSelect.mockImplementation( () => ( {
			hasAuthors: true,
			hasAssignAuthorAction: false,
		} ) );

		render( <PostAuthorCheck>authors</PostAuthorCheck> );
		expect( screen.queryByText( 'authors' ) ).not.toBeInTheDocument();
	} );

	it( 'should render control', () => {
		useSelect.mockImplementation( () => ( {
			hasAuthors: true,
			hasAssignAuthorAction: true,
		} ) );

		render( <PostAuthorCheck>authors</PostAuthorCheck> );
		expect( screen.getByText( 'authors' ) ).toBeVisible();
	} );
} );
