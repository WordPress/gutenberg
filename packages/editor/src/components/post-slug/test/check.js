/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import PostSlugCheck from '../check';

describe( 'PostSlugCheck', () => {
	it( 'should render control', () => {
		render( <PostSlugCheck>slug</PostSlugCheck> );

		expect( screen.getByText( 'slug' ) ).toBeVisible();
	} );
} );
