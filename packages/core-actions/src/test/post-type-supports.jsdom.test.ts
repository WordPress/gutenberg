import { describe, expect, it } from 'vitest';
import postTypeSupports from '../post_type_supports';

describe( 'post_type_supports', () => {
	it( 'maps the id of each default action to what performs it', () => {
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
		// The data of each action, its id included, comes from the server.
		for ( const action of Object.values( postTypeSupports ) ) {
			expect( 'callback' in action || 'RenderModal' in action ).toBe(
				true
			);
			expect( action ).not.toHaveProperty( 'id' );
		}
	} );

	it( 'does not offer to view or restore a post in the trash', () => {
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
