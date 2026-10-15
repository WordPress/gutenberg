import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRegistry } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import postTypeSupports from '@wordpress/core-actions/post_type_supports';
import wpBlock from '@wordpress/core-actions/wp_block';
import type { Action } from '@wordpress/dataviews';
import { store as editorStore } from '../../../store';
import { lock, unlock } from '../../../lock-unlock';
import { registerPostTypeSchema } from '../private-actions';

vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );

const POST_TYPES = {
	page: {
		slug: 'page',
		viewable: true,
		supports: {
			title: true,
			editor: true,
			revisions: true,
			'page-attributes': true,
		},
	},
	wp_block: {
		slug: 'wp_block',
		viewable: false,
		supports: { title: true, editor: true, revisions: true },
	},
	wp_template_part: {
		slug: 'wp_template_part',
		viewable: false,
		supports: { title: true, revisions: true },
	},
};

/**
 * Runs `registerPostTypeSchema()` against a registry that resolves the post
 * type, lets the user create posts, and has a block theme active.
 *
 * @param postType The post type.
 * @return The actions registered for the post type.
 */
async function register( postType: keyof typeof POST_TYPES ) {
	const actions: Action< any >[] = [];
	const editorSelectors = {};
	lock( editorSelectors, { isEntityReady: () => false } );
	const editorActions = {};
	lock( editorActions, {
		setIsReady: () => {},
		registerEntityAction: (
			kind: string,
			name: string,
			action: Action< any >
		) => actions.push( action ),
	} );
	const registry = {
		select: () => editorSelectors,
		dispatch: () => editorActions,
		resolveSelect: () => ( {
			getPostType: async () => POST_TYPES[ postType ],
			canUser: async () => true,
			getCurrentTheme: async () => ( { is_block_theme: true } ),
		} ),
		batch: ( callback: () => void ) => callback(),
	};
	await registerPostTypeSchema( postType )( { registry } );
	return { actions, actionIds: actions.map( ( { id } ) => id ) };
}

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
	afterEach( async () => {
		// Undo the mock of the last test. Like the mock, it takes effect on the
		// next import from this file.
		vi.doUnmock( import( '@wordpress/core-actions/wp_template_part' ) );
		await import( '@wordpress/core-actions/wp_template_part' );
	} );

	it( 'registers the actions of a post type', async () => {
		const { getEntityActions } = await registerSchema( 'page', {
			title: true,
			editor: true,
			author: true,
			comments: true,
		} );

		expect(
			getEntityActions( 'postType', 'page' ).map(
				( { id }: { id: string } ) => id
			)
		).toContain( 'rename-post' );
	} );

	it( 'registers the default actions from their script module', async () => {
		const { actions, actionIds } = await register( 'page' );

		expect( actionIds ).toEqual( [
			'view-post',
			'view-post-revisions',
			'duplicate-post',
			'rename-post',
			'order-pages',
			'restore',
			'reset-post',
			'delete-post',
			'move-to-trash',
			'permanently-delete',
		] );
		for ( const action of actions ) {
			expect( Object.values( postTypeSupports ) ).toContain( action );
		}
	} );

	it( 'registers the pattern actions from their script module', async () => {
		const { actions, actionIds } = await register( 'wp_block' );

		expect( actionIds ).toEqual( [
			'view-post-revisions',
			'duplicate-pattern',
			'rename-post',
			'export-pattern',
			'restore',
			'reset-post',
			'delete-post',
			'move-to-trash',
			'permanently-delete',
		] );
		expect( actions ).toContain( wpBlock[ 'duplicate-pattern' ] );
		expect( actions ).toContain( wpBlock[ 'export-pattern' ] );
	} );

	it( 'registers the template part actions from their script module', async () => {
		const { default: wpTemplatePart } =
			await import( '@wordpress/core-actions/wp_template_part' );
		const { actions, actionIds } = await register( 'wp_template_part' );

		expect( actionIds ).toEqual( [
			'view-post-revisions',
			'duplicate-template-part',
			'rename-post',
			'restore',
			'reset-post',
			'delete-post',
			'move-to-trash',
			'permanently-delete',
		] );
		expect( actions ).toContain(
			wpTemplatePart[ 'duplicate-template-part' ]
		);
	} );

	it( 'registers the other actions when a script module fails to load', async () => {
		// The script module of the template part actions fails to load. A mock
		// queued by `vi.doMock()` only takes effect once this file imports a
		// module, so import it here before the schema does.
		vi.doMock( import( '@wordpress/core-actions/wp_template_part' ), () =>
			Promise.reject( new Error( 'Failed to fetch' ) )
		);
		await expect(
			import( '@wordpress/core-actions/wp_template_part' )
		).rejects.toThrow();

		const { actionIds } = await register( 'wp_template_part' );

		expect( actionIds ).toEqual( [
			'view-post-revisions',
			'rename-post',
			'restore',
			'reset-post',
			'delete-post',
			'move-to-trash',
			'permanently-delete',
		] );
		expect( console ).toHaveWarnedWith(
			'Could not load the core actions of the wp_template_part post type.',
			expect.any( Error )
		);
	} );
} );
