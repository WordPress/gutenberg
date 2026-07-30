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
import ThemeSupportCheck from '../';

jest.mock( '@wordpress/data/src/components/use-select', () => jest.fn() );

function setupUseSelectMock( themeSupports = {}, postType = 'post' ) {
	useSelect.mockImplementation( ( cb ) => {
		return cb( () => ( {
			getEditedPostAttribute: () => postType,
			getThemeSupports: () => themeSupports,
		} ) );
	} );
}

describe( 'ThemeSupportCheck', () => {
	it( "should not render if there's no support check provided", () => {
		setupUseSelectMock( { 'post-thumbnails': true } );
		render( <ThemeSupportCheck>foobar</ThemeSupportCheck> );
		expect( screen.queryByText( 'foobar' ) ).not.toBeInTheDocument();
	} );

	it( 'should render if post-thumbnails are supported', () => {
		setupUseSelectMock( { 'post-thumbnails': true } );
		render(
			<ThemeSupportCheck supportKeys="post-thumbnails">
				foobar
			</ThemeSupportCheck>
		);
		expect( screen.getByText( 'foobar' ) ).toBeVisible();
	} );

	it( 'should render if post-thumbnails are supported for the post type', () => {
		setupUseSelectMock(
			{
				'post-thumbnails': [ 'post' ],
			},
			'post'
		);
		render(
			<ThemeSupportCheck supportKeys="post-thumbnails">
				foobar
			</ThemeSupportCheck>
		);
		expect( screen.getByText( 'foobar' ) ).toBeVisible();
	} );

	it( "should not render if post-thumbnails aren't supported for the post type", () => {
		setupUseSelectMock(
			{
				'post-thumbnails': [ 'post' ],
			},
			'page'
		);
		render(
			<ThemeSupportCheck supportKeys="post-thumbnails">
				foobar
			</ThemeSupportCheck>
		);
		expect( screen.queryByText( 'foobar' ) ).not.toBeInTheDocument();
	} );

	it( 'should not render if post-thumbnails is limited and false is passed for postType', () => {
		setupUseSelectMock(
			{
				'post-thumbnails': [ 'post' ],
			},
			false
		);
		render(
			<ThemeSupportCheck supportKeys="post-thumbnails">
				foobar
			</ThemeSupportCheck>
		);
		expect( screen.queryByText( 'foobar' ) ).not.toBeInTheDocument();
	} );

	it( "should not render if theme doesn't support post-thumbnails", () => {
		setupUseSelectMock( {
			'post-thumbnails': false,
		} );
		render(
			<ThemeSupportCheck supportKeys="post-thumbnails">
				foobar
			</ThemeSupportCheck>
		);
		expect( screen.queryByText( 'foobar' ) ).not.toBeInTheDocument();
	} );
} );
