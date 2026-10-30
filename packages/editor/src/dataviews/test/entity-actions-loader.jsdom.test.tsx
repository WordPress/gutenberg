import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import {
	resolveEntityActionsConfig,
	useEntityActions,
} from '../entity-actions-loader';

vi.mock( import( '@wordpress/api-fetch' ) );

const featureCallback = vi.fn();

// The script module the `useEntityActions` tests import. It only exists as this
// mock, so it is mocked for the dynamic import of the loader with
// `vi.doMock()`: `vi.mock( import() )` needs a module TypeScript resolves.
vi.doMock( 'acme/actions', () => ( {
	default: { 'acme/feature': { callback: featureCallback } },
} ) );

const CORE_MODULE = '@wordpress/core-actions/post_type_supports';

const CONFIG = {
	kind: 'postType',
	name: 'page',
	actions: [
		{ id: 'rename-post', label: 'Rename' },
		{ id: 'acme/feature', label: 'Feature', supportsBulk: true },
		{ id: 'move-to-trash', label: 'Trash', isPrimary: true },
	],
	script_modules: [
		{ id: CORE_MODULE, actions: [ 'rename-post', 'move-to-trash' ] },
		{ id: 'acme/actions', actions: [ 'acme/feature', 'move-to-trash' ] },
	],
};

function RenameModal() {
	return null;
}

function TrashModal() {
	return null;
}

function deferred< T >() {
	let resolve!: ( value: T ) => void;
	const promise = new Promise< T >( ( _resolve ) => {
		resolve = _resolve;
	} );
	return { promise, resolve };
}

describe( 'resolveEntityActionsConfig', () => {
	it( 'keeps the server order and merges the parts of each action in', async () => {
		const callback = vi.fn();
		const actions = await resolveEntityActionsConfig(
			CONFIG,
			async ( id ) =>
				id === CORE_MODULE
					? {
							default: {
								'rename-post': { RenderModal: RenameModal },
								'move-to-trash': { RenderModal: TrashModal },
							},
						}
					: { default: { 'acme/feature': { callback } } }
		);

		expect( actions ).toEqual( [
			{ id: 'rename-post', label: 'Rename', RenderModal: RenameModal },
			{
				id: 'acme/feature',
				label: 'Feature',
				supportsBulk: true,
				callback,
			},
			{
				id: 'move-to-trash',
				label: 'Trash',
				isPrimary: true,
				RenderModal: TrashModal,
			},
		] );
	} );

	it( 'applies the modules in the server order, whichever loads first', async () => {
		const coreIsEligible = () => true;
		const pluginIsEligible = () => false;
		const core = deferred< unknown >();
		const plugin = deferred< unknown >();
		const resolving = resolveEntityActionsConfig( CONFIG, ( id ) =>
			id === CORE_MODULE ? core.promise : plugin.promise
		);

		// The plugin module finishes first; core, listed earlier, must not
		// override it when it finishes last.
		plugin.resolve( {
			default: {
				'acme/feature': { callback: vi.fn() },
				'move-to-trash': { isEligible: pluginIsEligible },
			},
		} );
		core.resolve( {
			default: {
				'rename-post': { RenderModal: RenameModal },
				'move-to-trash': {
					RenderModal: TrashModal,
					isEligible: coreIsEligible,
				},
			},
		} );

		const actions = await resolving;
		expect( actions[ 2 ] ).toMatchObject( {
			id: 'move-to-trash',
			RenderModal: TrashModal,
			isEligible: pluginIsEligible,
		} );
	} );

	it( 'ignores the parts of actions the server does not list for the module', async () => {
		const actions = await resolveEntityActionsConfig(
			{
				...CONFIG,
				script_modules: [
					{
						id: CORE_MODULE,
						actions: [ 'rename-post', 'acme/feature' ],
					},
				],
			},
			async () => ( {
				default: {
					'rename-post': { RenderModal: RenameModal },
					'acme/feature': { callback: vi.fn() },
					'move-to-trash': { RenderModal: TrashModal },
					'duplicate-post': { RenderModal: RenameModal },
				},
			} )
		);

		expect( actions.map( ( { id } ) => id ) ).toEqual( [
			'rename-post',
			'acme/feature',
		] );
		expect( console ).toHaveWarnedWith(
			'The action move-to-trash of postType/page is skipped: no script module provides its `callback` or `RenderModal`.'
		);
	} );

	it( 'keeps the id the server registered the action with', async () => {
		const actions = await resolveEntityActionsConfig(
			{
				...CONFIG,
				actions: [ CONFIG.actions[ 0 ] ],
				script_modules: [
					{ id: CORE_MODULE, actions: [ 'rename-post' ] },
				],
			},
			async () => ( {
				default: {
					'rename-post': { id: 'retitle', RenderModal: RenameModal },
				},
			} )
		);

		expect( actions.map( ( { id } ) => id ) ).toEqual( [ 'rename-post' ] );
	} );

	it( 'skips the actions whose module fails to load', async () => {
		const callback = vi.fn();
		const actions = await resolveEntityActionsConfig(
			CONFIG,
			async ( id ) => {
				if ( id === CORE_MODULE ) {
					throw new Error( 'Network error' );
				}
				return { default: { 'acme/feature': { callback } } };
			}
		);

		expect( actions ).toEqual( [
			{
				id: 'acme/feature',
				label: 'Feature',
				supportsBulk: true,
				callback,
			},
		] );
		// The module is reported, not each action it leaves without parts.
		expect( console ).toHaveWarnedWith(
			`Could not load the script module ${ CORE_MODULE } of the actions of postType/page.`,
			expect.any( Error )
		);
	} );
} );

describe( 'useEntityActions', () => {
	function renderUseActions() {
		const registry = createRegistry();
		registry.register( coreStore );
		return renderHook(
			() => useEntityActions( { kind: 'postType', name: 'page' } ),
			{
				wrapper: ( { children } ) => (
					<RegistryProvider value={ registry }>
						{ children }
					</RegistryProvider>
				),
			}
		);
	}

	it( 'returns the actions once they and their script modules load', async () => {
		vi.mocked( apiFetch ).mockResolvedValue( {
			...CONFIG,
			actions: [ CONFIG.actions[ 1 ] ],
			script_modules: [
				{ id: 'acme/actions', actions: [ 'acme/feature' ] },
			],
		} );

		const { result } = renderUseActions();

		expect( result.current ).toEqual( { actions: [] } );
		await waitFor( () =>
			expect( result.current.actions ).toHaveLength( 1 )
		);
		expect( result.current.error ).toBeUndefined();
		expect( result.current.actions[ 0 ] ).toEqual( {
			id: 'acme/feature',
			label: 'Feature',
			supportsBulk: true,
			callback: featureCallback,
		} );
		expect( apiFetch ).toHaveBeenCalledWith( {
			path: '/wp/v2/entity-actions?kind=postType&name=page',
		} );
	} );

	it( 'returns no actions and the message of the server when the request fails', async () => {
		const error = {
			code: 'rest_forbidden',
			message: 'Sorry, you are not allowed to do that.',
			data: { status: 403 },
		};
		vi.mocked( apiFetch ).mockRejectedValue( error );

		const { result } = renderUseActions();

		await waitFor( () =>
			expect( result.current.error ).toBeInstanceOf( Error )
		);
		expect( result.current.actions ).toEqual( [] );
		expect( result.current.error?.message ).toBe(
			'Sorry, you are not allowed to do that.'
		);
		expect( result.current.error?.cause ).toBe( error );
	} );

	it( 'returns copy of its own when the request fails without a message', async () => {
		// Like the `Response` a request with `parse: false` rejects with.
		vi.mocked( apiFetch ).mockRejectedValue( { status: 500 } );

		const { result } = renderUseActions();

		await waitFor( () =>
			expect( result.current.error ).toBeInstanceOf( Error )
		);
		expect( result.current.error?.message ).toBe(
			'The actions of this screen did not load. Reload the page to try again.'
		);
	} );
} );
