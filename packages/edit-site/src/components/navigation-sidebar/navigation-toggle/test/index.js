/**
 * External dependencies
 */
import { render, screen, waitFor } from '@testing-library/react';

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

// Find an enclosing popover around `element`, and then check if it's been
// already positioned (by setting the `top` and `left` styles) by the
// `@floating-ui/react` library's `useFloating` hook. This happens asynchronously
// so the test code will need to wait for it.
function isPopover( element ) {
	if ( ! element ) {
		return false;
	}

	const popover = element.closest( '.components-popover' );
	if ( ! popover ) {
		return false;
	}

	const { top, left } = popover.style;
	return top !== '' && left !== '' ? 'positioned' : 'not-positioned';
}

describe( 'NavigationToggle', () => {
	describe( 'when in full screen mode', () => {
		it( 'should display a user uploaded site icon if it exists', async () => {
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

			render( <NavigationToggle /> );

			// The `NavigationToggle` component auto-focuses on mount, and that
			// causes the button tooltip to appear and to be positioned relative
			// to the button. It happens async and we need to wait for it.
			await waitFor( () =>
				expect(
					isPopover( screen.getByText( 'Toggle navigation' ) )
				).toBe( 'positioned' )
			);

			const siteIcon = screen.getByAltText( 'Site Icon' );

			expect( siteIcon ).toBeVisible();
		} );

		it( 'should display a default site icon if no user uploaded site icon exists', async () => {
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

			// wait for the button tooltip to appear and to be positioned
			await waitFor( () =>
				expect(
					isPopover( screen.getByText( 'Toggle navigation' ) )
				).toBe( 'positioned' )
			);

			expect(
				screen.queryByAltText( 'Site Icon' )
			).not.toBeInTheDocument();

			expect( container ).toMatchSnapshot();
		} );
	} );
} );
