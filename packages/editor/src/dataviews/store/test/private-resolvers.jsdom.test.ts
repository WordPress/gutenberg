import { describe, expect, it, vi } from 'vitest';
import apiFetch from '@wordpress/api-fetch';
import { createRegistry } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import postTypeSupports from '@wordpress/core-actions/post_type_supports';
import wpBlock from '@wordpress/core-actions/wp_block';
import { store as editorStore } from '../../../store';
import { unlock } from '../../../lock-unlock';

vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );

vi.mock( import( '@wordpress/api-fetch' ) );

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
 * Resolves the actions of a post type against a registry whose actions
 * request answers with the given config, or rejects with the given error.
 *
 * @param postType The post type.
 * @param response The actions config, or the error the request rejects with.
 * @return The registry and the resolved actions.
 */
async function resolveActions( postType: string, response: unknown ) {
	vi.mocked( apiFetch ).mockImplementation( async () => {
		if ( response instanceof Error ) {
			throw response;
		}
		return response;
	} );
	const registry = createRegistry();
	registry.register( coreStore );
	registry.register( editorStore );

	const actions = await unlock(
		registry.resolveSelect( editorStore )
	).getEntityActions( 'postType', postType );

	return { registry, actions };
}

describe( 'getEntityActions', () => {
	it( 'resolves the server actions, in the server order, with the parts of their script module', async () => {
		const ids = [ 'view-post', 'rename-post', 'move-to-trash' ];
		const { actions } = await resolveActions(
			'page',
			serverConfig( 'page', ids )
		);

		expect( actions.map( ( { id }: { id: string } ) => id ) ).toEqual(
			ids
		);
		expect( actions[ 1 ] ).toMatchObject( {
			id: 'rename-post',
			label: 'Label of rename-post',
			...postTypeSupports[ 'rename-post' ],
		} );
		expect( apiFetch ).toHaveBeenCalledWith( {
			path: '/wp/v2/entity-actions?kind=postType&name=page',
		} );
	} );

	it( 'merges the actions of several script modules', async () => {
		const { actions } = await resolveActions(
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

		expect( actions.map( ( { id }: { id: string } ) => id ) ).toEqual( [
			'rename-post',
			'duplicate-pattern',
			'export-pattern',
		] );
		expect( actions[ 2 ] ).toMatchObject( wpBlock[ 'export-pattern' ] );
	} );

	it( 'leaves out the actions of a script module that fails to load', async () => {
		const { actions } = await resolveActions(
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

		expect( actions.map( ( { id }: { id: string } ) => id ) ).toEqual( [
			'rename-post',
		] );
		expect( console ).toHaveWarnedWith(
			'Could not load the script module @wordpress/core-actions/wp_template_part of the actions of postType/wp_template_part.',
			expect.any( Error )
		);
		expect( console ).toHaveWarnedWith(
			'The action duplicate-template-part of the actions of postType/wp_template_part has no callback or modal, so it is left out.'
		);
	} );

	it( 'has no action when the request fails', async () => {
		const error = { code: 'rest_forbidden', message: 'Forbidden.' };
		vi.mocked( apiFetch ).mockRejectedValue( error );
		const registry = createRegistry();
		registry.register( coreStore );
		registry.register( editorStore );
		const selectors = unlock( registry.select( editorStore ) );
		selectors.getEntityActions( 'postType', 'page' );

		await vi.waitFor( () =>
			expect(
				selectors.getResolutionError( 'getEntityActions', [
					'postType',
					'page',
				] )
			).toBe( error )
		);
		expect( selectors.getEntityActions( 'postType', 'page' ) ).toEqual(
			[]
		);
	} );
} );
