/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { PostStickyCheck } from '../check';

describe( 'PostSticky', () => {
	it( 'should not render anything if the post type is not "post"', () => {
		render(
			<PostStickyCheck postType="page" hasStickyAction={ true }>
				Can Toggle Sticky
			</PostStickyCheck>
		);
		expect(
			screen.queryByText( 'Can Toggle Sticky' )
		).not.toBeInTheDocument();
	} );

	it( "should not render anything if post doesn't support stickying", () => {
		render(
			<PostStickyCheck postType="post" hasStickyAction={ false }>
				Can Toggle Sticky
			</PostStickyCheck>
		);
		expect(
			screen.queryByText( 'Can Toggle Sticky' )
		).not.toBeInTheDocument();
	} );

	it( 'should render if the post supports stickying', () => {
		render(
			<PostStickyCheck postType="post" hasStickyAction={ true }>
				Can Toggle Sticky
			</PostStickyCheck>
		);
		expect( screen.getByText( 'Can Toggle Sticky' ) ).toBeVisible();
	} );
} );
