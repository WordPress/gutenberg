import { describe, expect, it } from 'vitest';
import postTypeSupports from '../post_type_supports';

describe( 'post_type_supports', () => {
	it( 'maps the id of each default action to its JavaScript parts', () => {
		expect( Object.keys( postTypeSupports ) ).toEqual( [
			'delete-post',
			'duplicate-post',
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
} );
