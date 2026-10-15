import { describe, expect, it, vi } from 'vitest';
import { createRegistry } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as editorStore } from '../../../store';
import { unlock } from '../../../lock-unlock';
import { registerPostTypeSchema } from '../private-actions';

vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );

function registerSchema( postType: string, supports: Record< string, any > ) {
	const registry = createRegistry();
	registry.register( editorStore );
	// Answers the three requests the schema makes, without the REST API.
	const resolveSelect = ( store: any ) =>
		store === coreStore
			? {
					getPostType: async () => ( {
						slug: postType,
						viewable: true,
						supports,
					} ),
					canUser: async () => true,
					getCurrentTheme: async () => ( {
						is_block_theme: true,
						theme_supports: { 'post-thumbnails': true },
					} ),
				}
			: registry.resolveSelect( store );
	return registerPostTypeSchema( postType )( {
		registry: { ...registry, resolveSelect },
	} ).then( () => unlock( registry.select( editorStore ) ) );
}

describe( 'registerPostTypeSchema', () => {
	it( 'registers the actions of a post type, but leaves its fields to the server', async () => {
		const { getEntityActions, getEntityFields } = await registerSchema(
			'page',
			{ title: true, editor: true, author: true, comments: true }
		);

		expect( getEntityActions( 'postType', 'page' ).length ).toBeGreaterThan(
			0
		);
		expect( getEntityFields( 'postType', 'page' ) ).toEqual( [] );
	} );

	it( 'still registers the fields of attachments on the client', async () => {
		const { getEntityFields } = await registerSchema( 'attachment', {
			title: true,
			author: true,
		} );

		expect(
			getEntityFields( 'postType', 'attachment' ).map(
				( { id }: { id: string } ) => id
			)
		).toContain( 'alt_text' );
	} );
} );
