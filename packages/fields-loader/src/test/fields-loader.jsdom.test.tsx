import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { resolveFieldsConfig, useFields } from '../fields-loader';

vi.mock( '@wordpress/api-fetch' );

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

describe( 'useFields', () => {
	function renderUseFields() {
		const registry = createRegistry();
		registry.register( coreStore );
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
		vi.mocked( apiFetch ).mockResolvedValue( {
			...CONFIG,
			script_modules: [],
		} );

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
			path: '/wp/v2/fields?kind=postType&name=page',
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
} );
