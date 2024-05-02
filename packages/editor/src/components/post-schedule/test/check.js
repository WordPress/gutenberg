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
import PostScheduleCheck from '../check';

jest.mock( '@wordpress/data/src/components/use-select', () => jest.fn() );

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

describe( 'PostScheduleCheck', () => {
	it( "should not render anything if the user doesn't have the right capabilities", () => {
		setupMockSelect( false );
		render( <PostScheduleCheck>yes</PostScheduleCheck> );
		expect( screen.queryByText( 'yes' ) ).not.toBeInTheDocument();
	} );

	it( 'should render if the user has the correct capability', () => {
		setupMockSelect( true );
		render( <PostScheduleCheck>yes</PostScheduleCheck> );
		expect( screen.getByText( 'yes' ) ).toBeVisible();
	} );
} );
