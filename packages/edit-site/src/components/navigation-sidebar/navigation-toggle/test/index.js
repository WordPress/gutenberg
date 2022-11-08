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

/**
 * Whether the element has been positioned.
 * True if `top` and `left` have been set, false otherwise.
 *
 * @param {Element} element Element to check.
 * @return {boolean} True if positioned, false otherwise.
 */
function isElementPositioned( element ) {
	const { getComputedStyle } = element.ownerDocument.defaultView;

	const { top, left } = getComputedStyle( element );
	return top !== '' && left !== '';
}

/**
 * Custom jest matcher.
 * Determines whether an element has been positioned or not.
 *
 * @param {Element} element Element to check.
 * @return {Object} Matcher result
 */
function toBePositioned( element ) {
	const isInDocument =
		element.ownerDocument === element.getRootNode( { composed: true } );
	const isPositioned = isInDocument && isElementPositioned( element );
	return {
		pass: isPositioned,
		message: () => {
			const is = isPositioned ? 'is' : 'is not';
			return [
				this.utils.matcherHint(
					`${ this.isNot ? '.not' : '' }.toBePositioned`,
					'element',
					''
				),
				'',
				`Received element ${ is } positioned${
					isInDocument ? '' : ' (element is not in the document)'
				}:`,
				`  ${ this.utils.printReceived( element.cloneNode( false ) ) }`,
			].join( '\n' );
		},
	};
}

// Register the custom matcher
expect.extend( {
	toBePositioned,
} );

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
			await waitFor(
				() =>
					expect(
						screen.getByText( 'Toggle navigation' ).parentElement
					).toBePositioned(),
				{ timeout: 2000 } // It might take more than a second to position the popover.
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
			await waitFor(
				() =>
					expect(
						screen.getByText( 'Toggle navigation' ).parentElement
					).toBePositioned(),
				{ timeout: 2000 } // It might take more than a second to position the popover.
			);

			expect(
				screen.queryByAltText( 'Site Icon' )
			).not.toBeInTheDocument();

			expect( container ).toMatchSnapshot();
		} );
	} );
} );
