import { describe, expect, it, vi } from 'vitest';
import { createRegistry } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { addAction, removeAction } from '@wordpress/hooks';
import postTypeSupports from '@wordpress/core-actions/post_type_supports';
import wpBlock from '@wordpress/core-actions/wp_block';
import { store as editorStore } from '../../../store';
import { lock, unlock } from '../../../lock-unlock';
import { registerPostTypeSchema } from '../private-actions';

vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );

// The script module of the template part actions fails to load in these tests.
vi.mock( import( '@wordpress/core-actions/wp_template_part' ), () =>
	Promise.reject( new Error( 'Failed to fetch' ) )
);

const DEFAULTS = '@wordpress/core-actions/post_type_supports';

/**
 * Returns the actions config the server sends for a post type, with the
 * given actions from the default module, then the given ones from another
 * module.
 *
 * @param name    The post type.
 * @param ids     The ids of the default actions.
 * @param modules The other modules, with the ids of their actions.
 * @return The actions config.
 */
function serverConfig(
	name: string,
	ids: string[],
	modules: Array< { id: string; actions: string[] } > = []
) {
	const moduleIds = modules.flatMap( ( { actions } ) => actions );
	return {
		kind: 'postType',
		name,
		actions: [ ...ids, ...moduleIds ].map( ( id ) => ( {
			id,
			label: `Label of ${ id }`,
			origin: { registeredBy: 'core' },
		} ) ),
		script_modules: [ { id: DEFAULTS, actions: ids }, ...modules ],
	};
}

/**
 * Runs `registerPostTypeSchema()` against a registry whose core data store
 * answers the actions request with the given config, or the given error.
 *
 * @param postType The post type.
 * @param config   The actions config, or the error the request rejects with.
 * @return The private selectors of the editor store, and how many requests
 *         were made.
 */
async function registerSchema( postType: string, config: unknown ) {
	const registry = createRegistry();
	registry.register( editorStore );
	const getActionsConfig = vi.fn( async () => {
		if ( config instanceof Error ) {
			throw config;
		}
		return config;
	} );
	const coreSelectors = {};
	lock( coreSelectors, { getActionsConfig } );
	const resolveSelect = ( store: any ) =>
		store === coreStore ? coreSelectors : registry.resolveSelect( store );
	const schemaRegistry = { ...registry, resolveSelect };

	await registerPostTypeSchema( postType )( { registry: schemaRegistry } );
	// A second registration does nothing.
	await registerPostTypeSchema( postType )( { registry: schemaRegistry } );

	return {
		selectors: unlock( registry.select( editorStore ) ),
		requests: getActionsConfig.mock.calls,
	};
}

describe( 'registerPostTypeSchema', () => {
	it( 'registers the server actions, in the server order, with the parts of their script module', async () => {
		const ids = [ 'view-post', 'rename-post', 'move-to-trash' ];
		const { selectors, requests } = await registerSchema(
			'page',
			serverConfig( 'page', ids )
		);

		const actions = selectors.getEntityActions( 'postType', 'page' );
		expect( actions.map( ( { id }: { id: string } ) => id ) ).toEqual(
			ids
		);
		expect( actions[ 1 ] ).toMatchObject( {
			id: 'rename-post',
			label: 'Label of rename-post',
			...postTypeSupports[ 'rename-post' ],
		} );
		expect( requests ).toEqual( [ [ 'postType', 'page' ] ] );
	} );

	it( 'merges the actions of several script modules', async () => {
		const { selectors } = await registerSchema(
			'wp_block',
			serverConfig(
				'wp_block',
				[ 'rename-post' ],
				[
					{
						id: '@wordpress/core-actions/wp_block',
						actions: [ 'duplicate-pattern', 'export-pattern' ],
					},
				]
			)
		);

		const actions = selectors.getEntityActions( 'postType', 'wp_block' );
		expect( actions.map( ( { id }: { id: string } ) => id ) ).toEqual( [
			'rename-post',
			'duplicate-pattern',
			'export-pattern',
		] );
		expect( actions[ 2 ] ).toMatchObject( wpBlock[ 'export-pattern' ] );
	} );

	it( 'leaves out the actions of a script module that fails to load', async () => {
		const { selectors } = await registerSchema(
			'wp_template_part',
			serverConfig(
				'wp_template_part',
				[ 'rename-post' ],
				[
					{
						id: '@wordpress/core-actions/wp_template_part',
						actions: [ 'duplicate-template-part' ],
					},
				]
			)
		);

		expect(
			selectors
				.getEntityActions( 'postType', 'wp_template_part' )
				.map( ( { id }: { id: string } ) => id )
		).toEqual( [ 'rename-post' ] );
		expect( console ).toHaveWarnedWith(
			'Could not load the script module @wordpress/core-actions/wp_template_part of the actions of postType/wp_template_part.',
			expect.any( Error )
		);
		expect( console ).toHaveWarnedWith(
			'The action duplicate-template-part of the actions of postType/wp_template_part has no callback or modal, so it is left out.'
		);
	} );

	it( 'registers no server action when the request fails, and still fires the hook', async () => {
		const registered = vi.fn();
		addAction( 'core.registerPostTypeSchema', 'test/schema', registered );

		const { selectors } = await registerSchema(
			'page',
			new Error( 'Forbidden' )
		);
		removeAction( 'core.registerPostTypeSchema', 'test/schema' );

		expect( selectors.getEntityActions( 'postType', 'page' ) ).toEqual(
			[]
		);
		expect( registered ).toHaveBeenCalledTimes( 1 );
		expect( registered ).toHaveBeenCalledWith( 'page' );
		expect( console ).toHaveWarnedWith(
			'Could not load the actions of the page post type.',
			expect.any( Error )
		);
	} );
} );
