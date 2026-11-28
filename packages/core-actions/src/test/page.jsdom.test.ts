import { describe, expect, it } from 'vitest';
import page from '../page';

describe( 'page', () => {
	it( 'maps the id of each page action to its JavaScript parts', () => {
		expect( Object.keys( page ) ).toEqual( [
			'set-as-homepage',
			'set-as-posts-page',
		] );
		for ( const parts of Object.values( page ) ) {
			// The data of the action, such as its id and label, is
			// registered on the server.
			expect( parts ).not.toHaveProperty( 'id' );
			expect( 'RenderModal' in parts ).toBe( true );
		}
	} );

	it.each( [
		[ 'set-as-homepage', 'wp:action-set-homepage' ],
		[ 'set-as-posts-page', 'wp:action-set-posts-page' ],
	] as const )(
		'offers %s for the published pages with the %s link',
		( id, rel ) => {
			const post = {
				id: 1,
				type: 'page',
				status: 'publish' as const,
				title: 'About',
				content: '',
				_links: { [ rel ]: [ { href: 'https://example.org/1' } ] },
			};
			const { isEligible } = page[ id ];

			expect( isEligible?.( post ) ).toBe( true );
			// The server leaves the link out for the homepage, the posts
			// page, and the users who cannot manage the site options.
			expect( isEligible?.( { ...post, _links: {} } ) ).toBe( false );
			// The editor shows the actions of the edited page.
			expect( isEligible?.( { ...post, status: 'draft' } ) ).toBe(
				false
			);
		}
	);

	it( 'checks the link of each action only', () => {
		const post = {
			id: 1,
			type: 'page',
			status: 'publish' as const,
			title: 'About',
			content: '',
			_links: {
				'wp:action-set-posts-page': [
					{ href: 'https://example.org/1' },
				],
			},
		};

		expect( page[ 'set-as-homepage' ].isEligible?.( post ) ).toBe( false );
		expect( page[ 'set-as-posts-page' ].isEligible?.( post ) ).toBe( true );
	} );
} );
