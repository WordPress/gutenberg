import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useSelect } from '@wordpress/data';
import PostLastRevisionCheck from '../check';

vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );

vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useSelect: vi.fn(),
} ) );

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
