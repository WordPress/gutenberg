import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useSelect } from '@wordpress/data';
import PostStickyCheck from '../check';

vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );

vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useSelect: vi.fn(),
} ) );

function setupUseSelectMock( { hasStickyAction, postType } ) {
	useSelect.mockImplementation( ( cb ) => {
		return cb( () => ( {
			getCurrentPostType: () => postType,
			getCurrentPost: () => ( {
				_links: {
					'wp:action-sticky': hasStickyAction,
				},
			} ),
		} ) );
	} );
}

describe( 'PostSticky', () => {
	it( 'should not render anything if the post type is not "post"', () => {
		setupUseSelectMock( { hasStickyAction: true, postType: 'page' } );
		render( <PostStickyCheck>Can Show Sticky</PostStickyCheck> );
		expect(
			screen.queryByText( 'Can Show Sticky' )
		).not.toBeInTheDocument();
	} );

	it( "should not render anything if post doesn't support stickying", () => {
		setupUseSelectMock( { hasStickyAction: false, postType: 'post' } );
		render( <PostStickyCheck>Can Show Sticky</PostStickyCheck> );
		expect(
			screen.queryByText( 'Can Show Sticky' )
		).not.toBeInTheDocument();
	} );

	it( 'should render if the post supports stickying', () => {
		setupUseSelectMock( { hasStickyAction: true, postType: 'post' } );
		render( <PostStickyCheck>Can Show Sticky</PostStickyCheck> );
		expect( screen.getByText( 'Can Show Sticky' ) ).toBeVisible();
	} );
} );
