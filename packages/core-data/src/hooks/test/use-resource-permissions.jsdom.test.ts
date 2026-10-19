import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import triggerFetch from '@wordpress/api-fetch';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import { renderHook, waitFor } from '@testing-library/react';
import { createElement } from '@wordpress/element';
import type { ReactNode } from 'react';
import { store as coreDataStore } from '../../index';
import useResourcePermissions from '../use-resource-permissions';

vi.mock( import( '@wordpress/api-fetch' ) );

// The tests stub REST responses in place of typed requests.
const apiFetchMock = triggerFetch as unknown as Mock;

describe( 'useResourcePermissions', () => {
	let registry: ReturnType< typeof createRegistry >;
	beforeEach( () => {
		registry = createRegistry();
		registry.register( coreDataStore );

		apiFetchMock.mockImplementation( () => ( {
			headers: new Headers( {
				allow: 'POST',
			} ),
		} ) );
	} );

	function renderHookWithRegistry< Result, Props >(
		hook: ( props: Props ) => Result,
		options: { initialProps?: Props } = {}
	) {
		const Wrapper = ( { children }: { children?: ReactNode } ) =>
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
		apiFetchMock.mockImplementation( ( options ) => {
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
			apiFetchMock.mock.calls.filter(
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
				// @ts-expect-error Tests the warning for an ID passed beside an entity resource.
				1
			)
		);

		expect( console ).toHaveWarnedWith(
			`When 'resource' is an entity object, passing 'id' as a separate argument isn't supported.`
		);
	} );
} );
