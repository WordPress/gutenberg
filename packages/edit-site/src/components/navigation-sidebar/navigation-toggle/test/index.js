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
import NavigationToggle from '..';

jest.mock( '@wordpress/data/src/components/use-select', () => {
	// This allows us to tweak the returned value on each test.
	const mock = jest.fn();
	return mock;
} );
jest.mock( '@wordpress/data/src/components/use-dispatch', () => ( {
	useDispatch: () => ( { setNavigationPanelActiveMenu: jest.fn() } ),
} ) );

jest.mock( '@wordpress/core-data' );

describe( 'NavigationToggle', () => {
	describe( 'when in full screen mode', () => {
		it( 'should display a user uploaded site icon if it exists', () => {
			useSelect.mockImplementation( ( cb ) => {
				return cb( () => ( {
					getCurrentTemplateNavigationPanelSubMenu: () => 'root',
					getEntityRecord: () => ( {
						site_icon_url: 'https://fakeUrl.com',
					} ),
					isResolving: () => false,
					isNavigationOpened: () => false,
				} ) );
			} );

			const { container } = render( <NavigationToggle /> );
			const siteIcon = container.querySelector(
				'.edit-site-navigation-toggle__site-icon'
			);

			expect( siteIcon ).toBeTruthy();
		} );

		it( 'should display a default site icon if no user uploaded site icon exists', () => {
			useSelect.mockImplementation( ( cb ) => {
				return cb( () => ( {
					getCurrentTemplateNavigationPanelSubMenu: () => 'root',
					getEntityRecord: () => ( {
						site_icon_url: '',
					} ),
					isResolving: () => false,
					isNavigationOpened: () => false,
				} ) );
			} );

			const { container } = render( <NavigationToggle /> );
			const siteIcon = container.querySelector(
				'.edit-site-navigation-toggle__site-icon'
			);
			const defaultIcon = container.querySelector( 'svg' );

			expect( siteIcon ).toBeFalsy();
			expect( defaultIcon ).toBeTruthy();
		} );
	} );
} );
