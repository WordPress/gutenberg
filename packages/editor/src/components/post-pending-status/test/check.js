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
import { PostPendingStatusCheck } from '../check';

jest.mock( '@wordpress/data/src/components/use-select', () => {
	// This allows us to tweak the returned value on each test.
	const mock = jest.fn();
	return mock;
} );

function setupUseSelectMock( hasPublishAction ) {
	useSelect.mockImplementation( ( cb ) => {
		return cb( () => ( {
			isCurrentPostPublished: () => false,
			getCurrentPost: () => ( {
				_links: {
					'wp:action-publish': hasPublishAction,
				},
			} ),
		} ) );
	} );
}

describe( 'PostPendingStatusCheck', () => {
	it( "should not render anything if the user doesn't have the right capabilities", () => {
		setupUseSelectMock( false );

		render( <PostPendingStatusCheck>status</PostPendingStatusCheck> );

		expect( screen.queryByText( 'status' ) ).not.toBeInTheDocument();
	} );

	it( 'should render if the user has the correct capability', () => {
		setupUseSelectMock( true );

		render( <PostPendingStatusCheck>status</PostPendingStatusCheck> );

		expect( screen.getByText( 'status' ) ).toBeVisible();
	} );
} );
