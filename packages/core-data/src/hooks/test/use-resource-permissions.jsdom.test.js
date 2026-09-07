import triggerFetch from '@wordpress/api-fetch';
import { createRegistry, RegistryProvider } from '@wordpress/data';
jest.mock( '@wordpress/api-fetch' );
import { renderHook, waitFor } from '@testing-library/react';
import { createElement } from '@wordpress/element';
import { store as coreDataStore } from '../../index';
import useResourcePermissions from '../use-resource-permissions';

describe( 'useResourcePermissions', () => {
	let registry;
	beforeEach( () => {
		registry = createRegistry();
		registry.register( coreDataStore );

		triggerFetch.mockImplementation( () => ( {
			headers: new Headers( {
				allow: 'POST',
			} ),
		} ) );
	} );

	function renderHookWithRegistry( hook, options = {} ) {
		const Wrapper = ( { children } ) =>
			createElement( RegistryProvider, { value: registry }, children );
		return renderHook( hook, { wrapper: Wrapper, ...options } );
	}

	it( 'retrieves the relevant permissions for a key-less resource', async () => {
		const { result } = renderHookWithRegistry( () =>
			useResourcePermissions( 'widgets' )
		);
		expect( result.current ).toEqual( {
			status: 'IDLE',
			isResolving: false,
			hasResolved: false,
			canCreate: false,
			canRead: false,
		} );

		await waitFor( () =>
			expect( result.current ).toEqual( {
				status: 'SUCCESS',
				isResolving: false,
				hasResolved: true,
				canCreate: true,
				canRead: false,
			} )
		);
	} );

	it( 'retrieves the relevant permissions for a resource with a key', async () => {
		const { result } = renderHookWithRegistry( () =>
			useResourcePermissions( 'widgets', 1 )
		);
		expect( result.current ).toEqual( {
			status: 'IDLE',
			isResolving: false,
			hasResolved: false,
			canCreate: false,
			canRead: false,
			canUpdate: false,
			canDelete: false,
		} );

		await waitFor( () =>
			expect( result.current ).toEqual( {
				status: 'SUCCESS',
				isResolving: false,
				hasResolved: true,
				canCreate: true,
				canRead: false,
				canUpdate: false,
				canDelete: false,
			} )
		);
	} );

	it( 'retrieves the relevant permissions for a id-less entity', async () => {
		const { result } = renderHookWithRegistry( () =>
			useResourcePermissions( {
				kind: 'root',
				name: 'user',
			} )
		);
		expect( result.current ).toEqual( {
			status: 'IDLE',
			isResolving: false,
			hasResolved: false,
			canCreate: false,
			canRead: false,
		} );

		await waitFor( () =>
			expect( result.current ).toEqual( {
				status: 'SUCCESS',
				isResolving: false,
				hasResolved: true,
				canCreate: true,
				canRead: false,
			} )
		);
	} );

	it( 'normalizes id-less entity resources before resolving permissions', async () => {
		triggerFetch.mockImplementation( ( options ) => {
			if ( options.path === '/wp/v2/types?context=view' ) {
				return {
					wp_navigation: {
						name: 'Navigation Menus',
						slug: 'wp_navigation',
						rest_base: 'navigation',
						rest_namespace: 'wp/v2',
					},
				};
			}
			if (
				options.path === '/wp/v2/navigation' &&
				options.method === 'OPTIONS'
			) {
				return {
					headers: new Headers( { allow: 'GET, POST' } ),
				};
			}
			throw new Error(
				`Unexpected request: ${ JSON.stringify( options ) }`
			);
		} );

		const { result } = renderHookWithRegistry( () =>
			useResourcePermissions( {
				kind: 'postType',
				name: 'wp_navigation',
				id: undefined,
			} )
		);

		await waitFor( () =>
			expect( result.current ).toEqual( {
				status: 'SUCCESS',
				isResolving: false,
				hasResolved: true,
				canCreate: true,
				canRead: true,
			} )
		);

		expect(
			triggerFetch.mock.calls.filter(
				( [ options ] ) => options.path === '/wp/v2/navigation'
			)
		).toHaveLength( 1 );
	} );

	it( 'retrieves the relevant permissions for an entity', async () => {
		const { result } = renderHookWithRegistry( () =>
			useResourcePermissions( {
				kind: 'root',
				name: 'user',
				id: 1,
			} )
		);
		expect( result.current ).toEqual( {
			status: 'IDLE',
			isResolving: false,
			hasResolved: false,
			canCreate: false,
			canRead: false,
			canUpdate: false,
			canDelete: false,
		} );

		await waitFor( () =>
			expect( result.current ).toEqual( {
				status: 'SUCCESS',
				isResolving: false,
				hasResolved: true,
				canCreate: true,
				canRead: false,
				canUpdate: false,
				canDelete: false,
			} )
		);
	} );

	it( 'should warn when called with incorrect arguments signature', () => {
		renderHookWithRegistry( () =>
			useResourcePermissions(
				{
					kind: 'root',
					name: 'user',
				},
				1
			)
		);

		expect( console ).toHaveWarnedWith(
			`When 'resource' is an entity object, passing 'id' as a separate argument isn't supported.`
		);
	} );
} );
