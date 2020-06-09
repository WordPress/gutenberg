/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useEntityProp } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import FullscreenModeClose from '../';

jest.mock( '@wordpress/data/src/components/use-select', () => {
	// This allows us to tweak the returned value on each test
	const mock = jest.fn();
	return mock;
} );

jest.mock( '@wordpress/core-data' );

describe( 'FullscreenModeClose', () => {
	describe( 'when in full screen mode', () => {
		useSelect.mockImplementation( ( cb ) => {
			return cb( () => ( {
				isResolving: () => false,
				isFeatureActive: () => true,
				getCurrentPostType: () => {},
				getPostType: () => true,
			} ) );
		} );

		it( 'should display a user uploaded site icon if it exists', () => {
			useEntityProp.mockImplementation( () => {
				return [ 'https://fakeUrl.com' ];
			} );

			const { getByAltText } = render( <FullscreenModeClose /> );
			const siteIcon = getByAltText( 'site-icon' );

			expect( siteIcon ).toBeTruthy();
		} );

		it( 'should display a default site icon if no user uploaded site icon exists', () => {
			useEntityProp.mockImplementation( () => {
				return [ undefined ];
			} );

			const { container, queryByAltText } = render(
				<FullscreenModeClose />
			);
			const siteIcon = queryByAltText( 'site-icon' );
			const defaultIcon = container.querySelector( 'svg' );

			expect( siteIcon ).toBeFalsy();
			expect( defaultIcon ).toBeTruthy();
		} );
	} );
} );
