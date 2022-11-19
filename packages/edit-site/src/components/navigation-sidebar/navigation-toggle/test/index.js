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
import NavigationToggle from '..';

jest.mock( '@wordpress/data/src/components/use-select', () => {
	// This allows us to tweak the returned value on each test.
	return jest.fn();
} );

describe( 'NavigationToggle', () => {
	describe( 'when in full screen mode', () => {
		it( 'should display a user uploaded site icon if it exists', () => {
			useSelect.mockImplementation( ( cb ) =>
				cb( () => ( {
					getEntityRecord: () => ( {
						site_icon_url: 'https://fakeUrl.com',
					} ),
					isResolving: () => false,
					isNavigationOpened: () => false,
				} ) )
			);

			const { unmount } = render( <NavigationToggle /> );

			const siteIcon = screen.getByAltText( 'Site Icon' );
			expect( siteIcon ).toBeVisible();

			// Unmount the UI synchronously so that any async effects, like the on-mount focus
			// that shows and positions a tooltip, are cancelled right away and never run.
			unmount();
		} );

		it( 'should display a default site icon if no user uploaded site icon exists', () => {
			useSelect.mockImplementation( ( cb ) =>
				cb( () => ( {
					getEntityRecord: () => ( {
						site_icon_url: '',
					} ),
					isResolving: () => false,
					isNavigationOpened: () => false,
				} ) )
			);

			const { unmount } = render( <NavigationToggle /> );

			const siteIcon = screen.queryByAltText( 'Site Icon' );
			expect( siteIcon ).not.toBeInTheDocument();

			// Unmount the UI synchronously so that any async effects, like the on-mount focus
			// that shows and positions a tooltip, are cancelled right away and never run.
			unmount();
		} );
	} );
} );
