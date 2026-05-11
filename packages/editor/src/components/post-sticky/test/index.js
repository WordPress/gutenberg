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
import PostStickyCheck from '../check';

jest.mock( '@wordpress/data/src/components/use-select', () => {
	// This allows us to tweak the returned value on each test.
	const mock = jest.fn();
	return mock;
} );

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
