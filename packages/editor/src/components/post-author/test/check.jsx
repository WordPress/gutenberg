/**
 * External dependencies
 */
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import PostAuthorCheck from '../check';

vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useSelect: vi.fn(),
} ) );

function setupUseSelectMock( hasAssignAuthorAction ) {
	useSelect.mockImplementation( ( cb ) => {
		return cb( () => ( {
			getPostType: () => ( { supports: { author: true } } ),
			getEditedPostAttribute: () => {},
			getCurrentPost: () => ( {
				_links: {
					'wp:action-assign-author': hasAssignAuthorAction,
				},
			} ),
		} ) );
	} );
}

describe( 'PostAuthorCheck', () => {
	it( "should not render anything if doesn't have author action", () => {
		setupUseSelectMock( false );

		render( <PostAuthorCheck>authors</PostAuthorCheck> );
		expect( screen.queryByText( 'authors' ) ).not.toBeInTheDocument();
	} );

	it( 'should render control', () => {
		setupUseSelectMock( true );

		render( <PostAuthorCheck>authors</PostAuthorCheck> );
		expect( screen.getByText( 'authors' ) ).toBeVisible();
	} );
} );
