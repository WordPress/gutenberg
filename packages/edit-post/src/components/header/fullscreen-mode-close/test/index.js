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
import FullscreenModeClose from '../';

jest.mock( '@wordpress/data/src/components/use-select', () => {
	// This allows us to tweak the returned value on each test.
	const mock = jest.fn();
	return mock;
} );

jest.mock( '@wordpress/core-data' );

describe( 'FullscreenModeClose', () => {
	describe( 'when in full screen mode', () => {
		it( 'should display a user uploaded site icon if it exists', () => {
			useSelect.mockImplementation( ( cb ) => {
				return cb( () => ( {
					isResolving: () => false,
					isFeatureActive: () => true,
					getCurrentPostType: () => {},
					getPostType: () => true,
					getEntityRecord: () => ( {
						site_icon_url: 'https://fakeUrl.com',
					} ),
				} ) );
			} );

			render( <FullscreenModeClose /> );

			const siteIcon = screen.getByAltText( 'Site Icon' );

			expect( siteIcon ).toBeVisible();
		} );

		it( 'should display a default site icon if no user uploaded site icon exists', () => {
			useSelect.mockImplementation( ( cb ) => {
				return cb( () => ( {
					isResolving: () => false,
					isFeatureActive: () => true,
					getCurrentPostType: () => {},
					getPostType: () => true,
					getEntityRecord: () => ( {
						site_icon_url: '',
					} ),
				} ) );
			} );

			const { container } = render( <FullscreenModeClose /> );

			expect(
				screen.queryByAltText( 'Site Icon' )
			).not.toBeInTheDocument();

			expect( container ).toMatchSnapshot();
		} );
	} );
} );
