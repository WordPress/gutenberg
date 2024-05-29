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
import PostLastRevisionCheck from '../check';

jest.mock( '@wordpress/data/src/components/use-select', () => jest.fn() );

function setupDataMock( id, count ) {
	useSelect.mockImplementation( ( mapSelect ) =>
		mapSelect( () => ( {
			getCurrentPostLastRevisionId: () => id,
			getCurrentPostRevisionsCount: () => count,
			getEditedPostAttribute: () => null,
			getPostType: () => ( {
				supports: {
					revisions: true,
				},
			} ),
		} ) )
	);
}

describe( 'PostLastRevisionCheck', () => {
	it( 'should not render anything if the last revision ID is unknown', () => {
		setupDataMock( null, 2 );

		render( <PostLastRevisionCheck>Children</PostLastRevisionCheck> );

		expect( screen.queryByText( 'Children' ) ).not.toBeInTheDocument();
	} );

	it( 'should not render anything if there is only one revision', () => {
		setupDataMock( 1, 1 );

		render( <PostLastRevisionCheck>Children</PostLastRevisionCheck> );

		expect( screen.queryByText( 'Children' ) ).not.toBeInTheDocument();
	} );

	it( 'should render if there are two revisions', () => {
		setupDataMock( 1, 2 );

		render( <PostLastRevisionCheck>Children</PostLastRevisionCheck> );

		expect( screen.getByText( 'Children' ) ).toBeVisible();
	} );
} );
