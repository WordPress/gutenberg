import { describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { mergePluginFields, resolveFieldsConfig, useFields } from '..';
import { store as editorStore } from '../../../store';
import { unlock } from '../../../lock-unlock';

vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );

vi.mock( import( '@wordpress/api-fetch' ) );

const CONFIG = {
	kind: 'postType',
	name: 'page',
	fields: [
		{ id: 'date_added', type: 'datetime', label: 'Date added' },
		{ id: 'author', type: 'integer', label: 'Author' },
		{ id: 'comment_status', type: 'text', label: 'Comments' },
	],
	script_modules: [
		{ id: '@wordpress/core-fields', fields: [ 'author' ] },
		{ id: 'acme/fields', fields: [ 'author', 'comment_status' ] },
	],
};

const SERVER_CONFIG = { ...CONFIG, script_modules: [] };

function deferred< T >() {
	let resolve!: ( value: T ) => void;
	let reject!: ( reason: unknown ) => void;
	const promise = new Promise< T >( ( _resolve, _reject ) => {
		resolve = _resolve;
		reject = _reject;
	} );
	return { promise, resolve, reject };
}

describe( 'resolveFieldsConfig', () => {
	it( 'keeps the server order and merges the parts of each field in', async () => {
		const coreRender = () => null;
		const fields = await resolveFieldsConfig( CONFIG, async ( id ) =>
			id === '@wordpress/core-fields'
				? { default: { author: { render: coreRender } } }
				: { default: {} }
		);

		expect( fields.map( ( { id } ) => id ) ).toEqual( [
			'date_added',
			'author',
			'comment_status',
		] );
		expect( fields[ 1 ] ).toEqual( {
			id: 'author',
			type: 'integer',
			label: 'Author',
			render: coreRender,
		} );
	} );

	it( 'applies the modules in the server order, whichever loads first', async () => {
		const coreRender = () => null;
		const pluginRender = () => null;
		const core = deferred< unknown >();
		const plugin = deferred< unknown >();
		const resolving = resolveFieldsConfig( CONFIG, ( id ) =>
			id === '@wordpress/core-fields' ? core.promise : plugin.promise
		);

		// The plugin module finishes first; core, listed earlier, must not
		// override it when it finishes last.
		plugin.resolve( { default: { author: { render: pluginRender } } } );
		core.resolve( { default: { author: { render: coreRender } } } );

		const fields = await resolving;
		expect( fields[ 1 ].render ).toBe( pluginRender );
	} );

	it( 'ignores the parts of fields the server does not list for the module', async () => {
		const fields = await resolveFieldsConfig(
			{
				...CONFIG,
				script_modules: [
					{ id: '@wordpress/core-fields', fields: [ 'author' ] },
				],
			},
			async () => ( {
				default: {
					author: { enableSorting: false },
					comment_status: { enableSorting: false },
					word_count: { label: 'Word count' },
				},
			} )
		);

		expect( fields.map( ( { id } ) => id ) ).toEqual( [
			'date_added',
			'author',
			'comment_status',
		] );
		expect( fields[ 1 ].enableSorting ).toBe( false );
		expect( fields[ 2 ].enableSorting ).toBeUndefined();
	} );

	it( 'keeps the server data of the fields whose module fails to load', async () => {
		const pluginRender = () => null;
		const fields = await resolveFieldsConfig( CONFIG, async ( id ) => {
			if ( id === '@wordpress/core-fields' ) {
				throw new Error( 'Network error' );
			}
			return { default: { author: { render: pluginRender } } };
		} );

		expect( fields[ 1 ] ).toEqual( {
			id: 'author',
			type: 'integer',
			label: 'Author',
			render: pluginRender,
		} );
		expect( console ).toHaveWarned();
	} );
} );

describe( 'mergePluginFields', () => {
	const serverFields = [
		{ id: 'title', label: 'Title' },
		{ id: 'author', label: 'Author' },
	];

	it( 'returns the server fields themselves when no plugin field is registered', () => {
		expect( mergePluginFields( serverFields, [] ) ).toBe( serverFields );
	} );

	it( 'adds the plugin fields after the server ones', () => {
		const rating = { id: 'rating', label: 'Rating' };

		expect( mergePluginFields( serverFields, [ rating ] ) ).toEqual( [
			...serverFields,
			rating,
		] );
	} );

	it( 'leaves out the plugin fields whose id the server returns', () => {
		expect(
			mergePluginFields( serverFields, [
				{ id: 'author', label: 'Written by' },
			] )
		).toBe( serverFields );
	} );
} );

describe( 'useFields', () => {
	function createRegistryWithStores() {
		const registry = createRegistry();
		registry.register( coreStore );
		registry.register( editorStore );
		return registry;
	}

	function renderUseFields( registry = createRegistryWithStores() ) {
		return renderHook(
			() => useFields( { kind: 'postType', name: 'page' } ),
			{
				wrapper: ( { children } ) => (
					<RegistryProvider value={ registry }>
						{ children }
					</RegistryProvider>
				),
			}
		);
	}

	it( 'returns the fields once they load', async () => {
		vi.mocked( apiFetch ).mockResolvedValue( SERVER_CONFIG );

		const { result } = renderUseFields();

		expect( result.current ).toEqual( { fields: [], isLoading: true } );
		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );
		expect( result.current.error ).toBeUndefined();
		expect( result.current.fields.map( ( { id } ) => id ) ).toEqual( [
			'date_added',
			'author',
			'comment_status',
		] );
		expect( apiFetch ).toHaveBeenCalledWith( {
			path: '/wp/v2/entity-fields?kind=postType&name=page',
		} );
	} );

	it( 'returns an error instead of an empty list when the request fails', async () => {
		const restError = {
			code: 'rest_forbidden',
			message: 'Sorry, you are not allowed to do that.',
			data: { status: 403 },
		};
		vi.mocked( apiFetch ).mockRejectedValue( restError );

		const { result } = renderUseFields();

		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );
		expect( result.current.fields ).toEqual( [] );
		expect( result.current.error ).toBeInstanceOf( Error );
		expect( result.current.error?.message ).toBe(
			'Sorry, you are not allowed to do that.'
		);
		expect( result.current.error?.cause ).toBe( restError );
	} );

	it( 'returns copy of its own when the failure carries no message', async () => {
		// A `Response`, as `parse: false` rejects with, carries no message.
		vi.mocked( apiFetch ).mockRejectedValue( { status: 500 } );

		const { result } = renderUseFields();

		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );
		expect( result.current.error?.message ).toBe(
			"The fields of this screen didn't load. Reload the page to try again."
		);
	} );

	it( 'adds the fields a plugin registers on the client, but not the default ones', async () => {
		vi.mocked( apiFetch ).mockResolvedValue( SERVER_CONFIG );
		const registry = createRegistryWithStores();
		const { registerEntityField } = unlock(
			registry.dispatch( editorStore )
		);
		// The editor registers its defaults, which the server registers too.
		registerEntityField(
			'postType',
			'page',
			{ id: 'slug', label: 'Slug' },
			{ isDefault: true }
		);
		// A plugin adds a field of its own, and one with a server id.
		registerEntityField( 'postType', 'page', {
			id: 'rating',
			label: 'Rating',
		} );
		registerEntityField( 'postType', 'page', {
			id: 'author',
			label: 'Written by',
		} );

		const { result } = renderUseFields( registry );

		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );
		expect( result.current.fields.map( ( { id } ) => id ) ).toEqual( [
			'date_added',
			'author',
			'comment_status',
			'rating',
		] );
		expect( result.current.fields[ 1 ].label ).toBe( 'Author' );
	} );

	it( 'follows the fields a plugin registers once the server ones loaded', async () => {
		vi.mocked( apiFetch ).mockResolvedValue( SERVER_CONFIG );
		const registry = createRegistryWithStores();

		const { result } = renderUseFields( registry );
		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );
		const serverFields = result.current.fields;

		act( () => {
			unlock( registry.dispatch( editorStore ) ).registerEntityField(
				'postType',
				'page',
				{ id: 'rating', label: 'Rating' }
			);
		} );
		expect( result.current.fields.map( ( { id } ) => id ) ).toEqual( [
			'date_added',
			'author',
			'comment_status',
			'rating',
		] );

		act( () => {
			unlock( registry.dispatch( editorStore ) ).unregisterEntityField(
				'postType',
				'page',
				'rating'
			);
		} );
		expect( result.current.fields ).toBe( serverFields );
	} );
} );
