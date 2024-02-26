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

function setupUseSelectMock( hasAssignAuthorAction, hasAuthors ) {
	useSelect.mockImplementation( ( cb ) => {
		return cb( () => ( {
			getPostType: () => ( { supports: { author: true } } ),
			getEditedPostAttribute: () => {},
			getCurrentPost: () => ( {
				_links: {
					'wp:action-assign-author': hasAssignAuthorAction,
				},
			} ),
			getUsers: () => Array( hasAuthors ? 1 : 0 ).fill( {} ),
		} ) );
	} );
}

describe( 'PostAuthorCheck', () => {
	it( 'should not render anything if has no authors', () => {
		setupUseSelectMock( false, true );

		render( <PostAuthorCheck>authors</PostAuthorCheck> );
		expect( screen.queryByText( 'authors' ) ).not.toBeInTheDocument();
	} );

	it( "should not render anything if doesn't have author action", () => {
		setupUseSelectMock( true, false );

		render( <PostAuthorCheck>authors</PostAuthorCheck> );
		expect( screen.queryByText( 'authors' ) ).not.toBeInTheDocument();
	} );

	it( 'should render control', () => {
		setupUseSelectMock( true, true );

		render( <PostAuthorCheck>authors</PostAuthorCheck> );
		expect( screen.getByText( 'authors' ) ).toBeVisible();
	} );
} );
