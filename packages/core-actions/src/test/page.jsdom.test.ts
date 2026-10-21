import { describe, expect, it, vi } from 'vitest';
import page from '../page';

describe( 'page', () => {
	it( 'maps the id of each page action to its JavaScript parts', () => {
		expect( Object.keys( page ) ).toEqual( [
			'edit-post',
			'set-as-homepage',
			'set-as-posts-page',
		] );
		for ( const parts of Object.values( page ) ) {
			// The data of the action, such as its id and label, is
			// registered on the server.
			expect( parts ).not.toHaveProperty( 'id' );
			expect( 'callback' in parts || 'RenderModal' in parts ).toBe(
				true
			);
		}
	} );

	describe( 'edit-post', () => {
		const post = {
			id: 1,
			type: 'page',
			status: 'draft' as const,
			title: 'About',
			content: '',
		};
		const editPost = page[ 'edit-post' ];
		const { isEligible } = editPost;
		const callback = 'callback' in editPost ? editPost.callback : undefined;

		it( 'offers to edit the pages that are not in the trash', () => {
			expect( isEligible?.( post ) ).toBe( true );
			expect( isEligible?.( { ...post, status: 'publish' } ) ).toBe(
				true
			);
			expect( isEligible?.( { ...post, status: 'trash' } ) ).toBe(
				false
			);
		} );

		it( 'only signals it was performed, for the list to navigate', () => {
			const onActionPerformed = vi.fn();
			const open = vi.spyOn( window, 'open' );

			callback?.( [ post ], { registry: {}, onActionPerformed } );

			expect( onActionPerformed ).toHaveBeenCalledWith( [ post ] );
			expect( open ).not.toHaveBeenCalled();
			open.mockRestore();
		} );

		it( 'does nothing in a list that does not handle it', () => {
			expect( () =>
				callback?.( [ post ], { registry: {} } )
			).not.toThrow();
		} );
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
