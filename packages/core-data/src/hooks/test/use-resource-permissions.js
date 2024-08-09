/**
 * WordPress dependencies
 */
import triggerFetch from '@wordpress/api-fetch';
import { createRegistry, RegistryProvider } from '@wordpress/data';

jest.mock( '@wordpress/api-fetch' );

/**
 * External dependencies
 */
import { render, waitFor } from '@testing-library/react';

/**
 * Internal dependencies
 */
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

	it( 'retrieves the relevant permissions for a key-less resource', async () => {
		let data;
		const TestComponent = () => {
			data = useResourcePermissions( 'widgets' );
			return <div />;
		};
		render(
			<RegistryProvider value={ registry }>
				<TestComponent />
			</RegistryProvider>
		);
		expect( data ).toEqual( {
			status: 'IDLE',
			isResolving: false,
			hasResolved: false,
			canCreate: false,
			canRead: false,
		} );

		await waitFor( () =>
			expect( data ).toEqual( {
				status: 'SUCCESS',
				isResolving: false,
				hasResolved: true,
				canCreate: true,
				canRead: false,
			} )
		);
	} );

	it( 'retrieves the relevant permissions for a resource with a key', async () => {
		let data;
		const TestComponent = () => {
			data = useResourcePermissions( 'widgets', 1 );
			return <div />;
		};
		render(
			<RegistryProvider value={ registry }>
				<TestComponent />
			</RegistryProvider>
		);
		expect( data ).toEqual( {
			status: 'IDLE',
			isResolving: false,
			hasResolved: false,
			canCreate: false,
			canRead: false,
			canUpdate: false,
			canDelete: false,
		} );

		await waitFor( () =>
			expect( data ).toEqual( {
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
		let data;
		const TestComponent = () => {
			data = useResourcePermissions( {
				kind: 'root',
				name: 'media',
			} );
			return <div />;
		};
		render(
			<RegistryProvider value={ registry }>
				<TestComponent />
			</RegistryProvider>
		);
		expect( data ).toEqual( {
			status: 'IDLE',
			isResolving: false,
			hasResolved: false,
			canCreate: false,
			canRead: false,
		} );

		await waitFor( () =>
			expect( data ).toEqual( {
				status: 'SUCCESS',
				isResolving: false,
				hasResolved: true,
				canCreate: true,
				canRead: false,
			} )
		);
	} );

	it( 'retrieves the relevant permissions for an entity', async () => {
		let data;
		const TestComponent = () => {
			data = useResourcePermissions( {
				kind: 'root',
				name: 'media',
				id: 1,
			} );
			return <div />;
		};
		render(
			<RegistryProvider value={ registry }>
				<TestComponent />
			</RegistryProvider>
		);
		expect( data ).toEqual( {
			status: 'IDLE',
			isResolving: false,
			hasResolved: false,
			canCreate: false,
			canRead: false,
			canUpdate: false,
			canDelete: false,
		} );

		await waitFor( () =>
			expect( data ).toEqual( {
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
		const TestComponent = () => {
			useResourcePermissions(
				{
					kind: 'root',
					name: 'media',
				},
				1
			);
			return null;
		};
		render(
			<RegistryProvider value={ registry }>
				<TestComponent />
			</RegistryProvider>
		);

		expect( console ).toHaveWarnedWith(
			`When 'resource' is an entity object, passing 'id' as a separate argument isn't supported.`
		);
	} );
} );
