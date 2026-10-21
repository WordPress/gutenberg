import { describe, expect, it, vi } from 'vitest';
import { createRegistry } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import postTypeSupports from '../post_type_supports';
import { unlock } from '../lock-unlock';

// The editor store loads the viewport store, which reads the media queries.
vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );

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
		const action = postTypeSupports[ 'edit-post' ];
		const { isEligible } = action;
		const callback = 'callback' in action ? action.callback : undefined;

		function createRegistryWithEditor() {
			const registry = createRegistry();
			registry.register( editorStore );
			return registry;
		}

		it( 'offers to edit the entity records that are not in the trash', () => {
			expect( isEligible?.( post ) ).toBe( true );
			expect(
				isEligible?.( {
					...post,
					id: 'twentytwentyfive//index',
					type: 'wp_template',
				} )
			).toBe( true );
			expect( isEligible?.( { ...post, status: 'trash' } ) ).toBe(
				false
			);
		} );

		it( 'does not offer to edit the patterns of the theme', () => {
			const { id, ...themePattern } = post;
			expect(
				isEligible?.( {
					...themePattern,
					type: 'pattern',
				} as unknown as typeof post )
			).toBe( false );
		} );

		it( 'opens the entity with the entity navigator of the screen', () => {
			const registry = createRegistryWithEditor();
			const navigator = vi.fn();
			unlock( registry.dispatch( editorStore ) ).setEntityNavigator(
				navigator
			);

			callback?.(
				[
					{
						...post,
						id: 'twentytwentyfive//header',
						type: 'wp_template_part',
					},
				],
				{ registry }
			);

			expect( navigator ).toHaveBeenCalledTimes( 1 );
			expect( navigator ).toHaveBeenCalledWith( {
				postType: 'wp_template_part',
				postId: 'twentytwentyfive//header',
			} );
		} );

		it( 'does nothing when the screen sets no entity navigator', () => {
			const registry = createRegistryWithEditor();

			expect( () => callback?.( [ post ], { registry } ) ).not.toThrow();
		} );
	} );
} );
