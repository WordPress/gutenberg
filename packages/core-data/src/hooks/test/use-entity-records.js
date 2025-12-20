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
import useEntityRecords, {
	useEntityRecordsWithPermissions,
} from '../use-entity-records';

describe( 'useEntityRecords', () => {
	let registry;

	beforeEach( () => {
		registry = createRegistry();
		registry.register( coreDataStore );
	} );

	const TEST_RECORDS = [
		{ id: 1, hello: 'world1' },
		{ id: 2, hello: 'world2' },
		{ id: 3, hello: 'world3' },
	];

	it( 'resolves the entity records when missing from the state', async () => {
		// Provide response
		triggerFetch.mockImplementation( () => TEST_RECORDS );

		let data;
		const TestComponent = () => {
			data = useEntityRecords( 'root', 'widget', { status: 'draft' } );
			return <div />;
		};
		render(
			<RegistryProvider value={ registry }>
				<TestComponent />
			</RegistryProvider>
		);

		expect( data ).toEqual( {
			records: null,
			hasResolved: false,
			hasStarted: false,
			isResolving: false,
			status: 'IDLE',
			totalItems: null,
			totalPages: null,
		} );

		// Fetch request should have been issued
		await waitFor( () =>
			expect( triggerFetch ).toHaveBeenCalledWith( {
				path: '/wp/v2/widgets?context=edit&status=draft',
			} )
		);

		expect( data ).toEqual( {
			records: TEST_RECORDS,
			hasResolved: true,
			hasStarted: true,
			isResolving: false,
			status: 'SUCCESS',
			totalItems: 3,
			totalPages: 1,
		} );
	} );
} );

describe( 'useEntityRecordsWithPermissions', () => {
	let registry;

	beforeEach( () => {
		registry = createRegistry();
		registry.register( coreDataStore );

		// Mock the post entity configuration
		registry.dispatch( coreDataStore ).addEntities( [
			{
				name: 'post',
				kind: 'postType',
				baseURL: '/wp/v2/posts',
				baseURLParams: { context: 'edit' },
			},
		] );
	} );

	const TEST_RECORDS = [
		{ id: 1, title: 'Post 1', slug: 'post-1' },
		{ id: 2, title: 'Post 2', slug: 'post-2' },
	];

	const fieldsFromMock = Object.keys( TEST_RECORDS[ 0 ] ).join( ',' );

	it( 'injects _links when _fields is provided', async () => {
		// Mock the API response
		triggerFetch.mockImplementation( () => TEST_RECORDS );

		const TestComponent = () => {
			useEntityRecordsWithPermissions( 'postType', 'post', {
				_fields: fieldsFromMock,
			} );
			return <div />;
		};
		render(
			<RegistryProvider value={ registry }>
				<TestComponent />
			</RegistryProvider>
		);

		// Should inject _links into the _fields parameter
		await waitFor( () =>
			expect( triggerFetch ).toHaveBeenCalledWith( {
				path: `/wp/v2/posts?context=edit&_fields=${ encodeURIComponent(
					fieldsFromMock + ',_links'
				) }`,
			} )
		);
	} );

	it( 'does not modify query when _fields is not provided', async () => {
		// Mock the API response
		triggerFetch.mockImplementation( () => TEST_RECORDS );

		const TestComponent = () => {
			useEntityRecordsWithPermissions( 'postType', 'post', {} );
			return <div />;
		};
		render(
			<RegistryProvider value={ registry }>
				<TestComponent />
			</RegistryProvider>
		);

		// Should not add _fields when not originally provided
		await waitFor( () =>
			expect( triggerFetch ).toHaveBeenCalledWith( {
				path: '/wp/v2/posts?context=edit',
			} )
		);
	} );

	it( 'avoids duplicate _links when already present in _fields', async () => {
		// Mock the API response
		triggerFetch.mockImplementation( () => TEST_RECORDS );

		const fieldsWithLinks = fieldsFromMock + ',_links';
		const TestComponent = () => {
			useEntityRecordsWithPermissions( 'postType', 'post', {
				_fields: fieldsWithLinks,
			} );
			return <div />;
		};
		render(
			<RegistryProvider value={ registry }>
				<TestComponent />
			</RegistryProvider>
		);

		// Should not duplicate _links (deduplication working correctly)
		await waitFor( () =>
			expect( triggerFetch ).toHaveBeenCalledWith( {
				path: `/wp/v2/posts?context=edit&_fields=${ encodeURIComponent(
					fieldsWithLinks
				) }`,
			} )
		);
	} );
} );
