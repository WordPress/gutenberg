import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useSelect } from '@wordpress/data';
import { PostPendingStatusCheck } from '../check';

vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );

vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useSelect: vi.fn(),
} ) );

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
