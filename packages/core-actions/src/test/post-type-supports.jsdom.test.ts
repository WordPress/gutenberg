import { describe, expect, it, vi } from 'vitest';
import postTypeSupports from '../post_type_supports';

describe( 'post_type_supports', () => {
	it( 'maps the id of each default action to its JavaScript parts', () => {
		expect( Object.keys( postTypeSupports ) ).toEqual( [
			'delete-post',
			'duplicate-post',
			'edit-post',
			'move-to-trash',
			'order-pages',
			'permanently-delete',
			'rename-post',
			'reset-post',
			'restore',
			'view-post',
			'view-post-revisions',
		] );
		for ( const parts of Object.values( postTypeSupports ) ) {
			// The data of the action, such as its id and label, is
			// registered on the server.
			expect( parts ).not.toHaveProperty( 'id' );
			expect( 'callback' in parts || 'RenderModal' in parts ).toBe(
				true
			);
		}
	} );

	it( 'offers to restore a post in the trash, not to view or trash it', () => {
		const post = {
			id: 1,
			type: 'post',
			status: 'trash' as const,
			title: 'Hello',
			content: '',
			permissions: { delete: true, update: true },
		};
		expect( postTypeSupports[ 'view-post' ].isEligible?.( post ) ).toBe(
			false
		);
		expect( postTypeSupports.restore.isEligible?.( post ) ).toBe( true );
		expect( postTypeSupports[ 'move-to-trash' ].isEligible?.( post ) ).toBe(
			false
		);
	} );

	describe( 'edit-post', () => {
		const post = {
			id: 1,
			type: 'page',
			status: 'draft' as const,
			title: 'About',
			content: '',
		};
		const editPost = postTypeSupports[ 'edit-post' ];
		const { isEligible } = editPost;
		const callback = 'callback' in editPost ? editPost.callback : undefined;

		it( 'offers to edit the posts that are not in the trash', () => {
			expect( isEligible?.( post ) ).toBe( true );
			expect( isEligible?.( { ...post, status: 'publish' } ) ).toBe(
				true
			);
			expect( isEligible?.( { ...post, status: 'trash' } ) ).toBe(
				false
			);
		} );

		it( 'does not offer to edit the patterns of the theme', () => {
			expect( isEligible?.( { ...post, type: 'wp_block' } ) ).toBe(
				true
			);
			expect( isEligible?.( { ...post, type: 'pattern' } ) ).toBe(
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
} );
