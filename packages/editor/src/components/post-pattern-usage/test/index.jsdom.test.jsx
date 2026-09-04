import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { useSelect } from '@wordpress/data';
import PostPatternUsage from '../';

jest.mock( '@wordpress/data/src/components/use-select', () => jest.fn() );
jest.mock( '@wordpress/api-fetch' );

function setupUseSelectMock( postType = 'wp_block' ) {
	useSelect.mockImplementation( ( cb ) =>
		cb( () => ( {
			getCurrentPostType: () => postType,
			getCurrentPostId: () => 123,
		} ) )
	);
}

const USAGE = {
	total: 3,
	groups: [
		{
			type: 'page',
			labels: { name: 'Pages', singular_name: 'Page' },
			count: 2,
			items: [
				{ id: 1, title: 'About' },
				{ id: 2, title: 'Contact &amp; support' },
			],
		},
		{
			type: 'wp_template',
			labels: { name: 'Templates', singular_name: 'Template' },
			count: 1,
			items: [ { id: 3, title: 'Single Posts' } ],
		},
	],
};

describe( 'PostPatternUsage', () => {
	beforeEach( () => {
		setupUseSelectMock();
		apiFetch.mockReset();
		apiFetch.mockResolvedValue( USAGE );
	} );

	it( 'summarizes the entries the pattern is used in', async () => {
		render( <PostPatternUsage /> );

		expect(
			await screen.findByText( 'Used in 2 Pages, 1 Template.' )
		).toBeInTheDocument();
	} );

	it( 'lists the entries, linking each to its editor', async () => {
		const user = userEvent.setup();
		render( <PostPatternUsage /> );

		await user.click( await screen.findByRole( 'button' ) );

		expect( screen.getByRole( 'link', { name: /About/ } ) ).toHaveAttribute(
			'href',
			'post.php?post=1&action=edit'
		);
		// Titles arrive encoded, as they are stored.
		expect(
			screen.getByRole( 'link', { name: /Contact & support/ } )
		).toBeInTheDocument();
		// Templates are edited in the site editor.
		expect(
			screen.getByRole( 'link', { name: /Single Posts/ } )
		).toHaveAttribute(
			'href',
			'site-editor.php?p=%2Fwp_template%2F3&canvas=edit'
		);
	} );

	it( 'says so when the pattern is not used anywhere', async () => {
		apiFetch.mockResolvedValue( { total: 0, groups: [] } );
		render( <PostPatternUsage /> );

		expect(
			await screen.findByText( 'Not used anywhere.' )
		).toBeInTheDocument();
	} );

	it( 'renders nothing for a post that is not a pattern', () => {
		setupUseSelectMock( 'page' );
		const { container } = render( <PostPatternUsage /> );

		expect( apiFetch ).not.toHaveBeenCalled();
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'renders nothing when the endpoint is unavailable', async () => {
		// A plain WordPress install, without the Gutenberg plugin.
		apiFetch.mockRejectedValue( {
			code: 'rest_no_route',
			message: 'No route was found matching the URL and request method.',
		} );

		let container;
		await act( async () => {
			( { container } = render( <PostPatternUsage /> ) );
		} );

		expect( container ).toBeEmptyDOMElement();
	} );
} );
