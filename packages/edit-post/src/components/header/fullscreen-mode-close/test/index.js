/**
 * External dependencies
 */
import { render } from '@testing-library/react';

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

			const { container } = render( <FullscreenModeClose /> );
			const siteIcon = container.querySelector(
				'.edit-post-fullscreen-mode-close_site-icon'
			);

			expect( siteIcon ).toBeTruthy();
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
			const siteIcon = container.querySelector(
				'.edit-post-fullscreen-mode-close_site-icon'
			);
			const defaultIcon = container.querySelector( 'svg' );

			expect( siteIcon ).toBeFalsy();
			expect( defaultIcon ).toBeTruthy();
		} );
	} );
} );
