/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

jest.mock( '@wordpress/data/src/components/use-select', () => jest.fn() );

/**
 * Internal dependencies
 */
import PostVisibilityCheck from '../check';

function setupMockSelect( hasPublishAction ) {
	useSelect.mockImplementation( ( mapSelect ) => {
		return mapSelect( () => ( {
			getCurrentPost: () => ( {
				_links: {
					'wp:action-publish': hasPublishAction,
				},
			} ),
		} ) );
	} );
}

describe( 'PostVisibilityCheck', () => {
	const renderProp = ( { canEdit } ) => ( canEdit ? 'yes' : 'no' );

	it( "should not render the edit link if the user doesn't have the right capability", () => {
		setupMockSelect( false );
		render( <PostVisibilityCheck render={ renderProp } /> );
		expect( screen.queryByText( 'yes' ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'no' ) ).toBeVisible();
	} );

	it( 'should render if the user has the correct capability', () => {
		setupMockSelect( true );
		render( <PostVisibilityCheck render={ renderProp } /> );
		expect( screen.queryByText( 'no' ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'yes' ) ).toBeVisible();
	} );
} );
