import { describe, expect, it, vi } from 'vitest';
import page from '../page';

describe( 'page', () => {
	it( 'maps the id of each page action to its JavaScript parts', () => {
		expect( Object.keys( page ) ).toEqual( [
			'quick-edit',
			'set-as-homepage',
			'set-as-posts-page',
		] );
		for ( const parts of Object.values( page ) ) {
			// The data of the action, such as its id and label, is
			// registered on the server.
			expect( parts ).not.toHaveProperty( 'id' );
		}
		expect( 'RenderModal' in page[ 'set-as-homepage' ] ).toBe( true );
		expect( 'RenderModal' in page[ 'set-as-posts-page' ] ).toBe( true );
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

	describe( 'quick-edit', () => {
		const post = {
			id: 1,
			type: 'page',
			status: 'draft' as const,
			title: 'About',
			content: '',
		};
		const quickEdit = page[ 'quick-edit' ];
		const { isEligible, label } = quickEdit;
		const callback =
			'callback' in quickEdit ? quickEdit.callback : undefined;

		it( 'offers to quick edit the pages that are not in the trash', () => {
			expect( isEligible?.( post ) ).toBe( true );
			expect( isEligible?.( { ...post, status: 'publish' } ) ).toBe(
				true
			);
			expect( isEligible?.( { ...post, status: 'trash' } ) ).toBe(
				false
			);
		} );

		it( 'is labelled as a bulk edit for several pages', () => {
			expect( typeof label ).toBe( 'function' );
			if ( typeof label !== 'function' ) {
				return;
			}
			expect( label( [ post ] ) ).toBe( 'Quick edit' );
			expect( label( [ post, { ...post, id: 2 } ] ) ).toBe( 'Bulk edit' );
		} );

		it( 'only signals it was performed, for the list to open the form', () => {
			const onActionPerformed = vi.fn();

			callback?.( [ post ], { registry: {}, onActionPerformed } );

			expect( onActionPerformed ).toHaveBeenCalledWith( [ post ] );
		} );

		it( 'does nothing in a list that does not handle it', () => {
			expect( () =>
				callback?.( [ post ], { registry: {} } )
			).not.toThrow();
		} );
	} );
} );
