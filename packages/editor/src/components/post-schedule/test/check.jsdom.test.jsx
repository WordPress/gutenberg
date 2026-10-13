import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useSelect } from '@wordpress/data';
import PostScheduleCheck from '../check';

vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );

vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useSelect: vi.fn(),
} ) );

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
