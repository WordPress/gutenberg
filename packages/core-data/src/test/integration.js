/**
 * WordPress dependencies
 */
import { createRegistry, controls } from '@wordpress/data';

/**
 * Internal dependencies
 */
import * as actions from '../actions';
import * as selectors from '../selectors';
import * as resolvers from '../resolvers';
import { store } from '../';

// Mock to prevent calling window.fetch in test environment
jest.mock( '@wordpress/data-controls', () => {
	const dataControls = jest.requireActual( '@wordpress/data-controls' );
	return {
		...dataControls,
		apiFetch: jest.fn(),
	};
} );
const { apiFetch: actualApiFetch } = jest.requireActual(
	'@wordpress/data-controls'
);
import { apiFetch } from '@wordpress/data-controls';

jest.mock( '@wordpress/api-fetch', () => {
	return {
		__esModule: true,
		default: jest.fn(),
	};
} );
import triggerFetch from '@wordpress/api-fetch';

const runPromise = async ( promise ) => {
	jest.runAllTimers();
	await promise;
};

const runPendingPromises = async () => {
	jest.runAllTimers();
	const p = new Promise( ( resolve ) => setTimeout( resolve ) );
	jest.runAllTimers();
	await p;
};

describe( 'receiveEntityRecord', () => {
	function createTestRegistry( getEntityRecord ) {
		const registry = createRegistry();
		const initialState = {
			entities: {
				data: {},
			},
		};
		registry.register( store );
		registry.registerStore( 'test/resolution', {
			actions: {
				receiveEntityRecords: actions.receiveEntityRecords,
				*getEntityRecords( ...args ) {
					return yield controls.resolveSelect(
						'test/resolution',
						'getEntityRecords',
						...args
					);
				},
				*getEntityRecord( ...args ) {
					return yield controls.resolveSelect(
						'test/resolution',
						'getEntityRecord',
						...args
					);
				},
			},
			reducer: ( state = initialState ) => {
				return state;
			},
			selectors: {
				getEntityRecord: selectors.getEntityRecord,
				getEntityRecords: selectors.getEntityRecords,
			},
			resolvers: {
				getEntityRecord,
				getEntityRecords: resolvers.getEntityRecords,
			},
		} );
		return registry;
	}

	beforeEach( async () => {
		apiFetch.mockReset();
		triggerFetch.mockReset();
		jest.useFakeTimers();
	} );

	it( 'should not trigger a resolver when the requested record is available via receiveEntityRecords (default entity key).', async () => {
		const getEntityRecord = jest.fn();
		const registry = createTestRegistry( getEntityRecord );

		// Trigger resolution of postType records
		apiFetch.mockImplementation( () => ( {
			2: { slug: 'test', id: 2 },
		} ) );
		await runPromise(
			registry
				.dispatch( 'test/resolution' )
				.getEntityRecords( 'root', 'site' )
		);
		jest.runAllTimers();

		// Select record with id = 2, it is available and should not trigger the resolver
		await runPromise(
			registry
				.dispatch( 'test/resolution' )
				.getEntityRecord( 'root', 'site', 2 )
		);
		expect( getEntityRecord ).not.toHaveBeenCalled();

		// Select record with id = 4, it is not available and should trigger the resolver
		await runPromise(
			registry
				.dispatch( 'test/resolution' )
				.getEntityRecord( 'root', 'site', 4 )
		);
		expect( getEntityRecord ).toHaveBeenCalled();
	} );

	it( 'should not trigger a resolver when the requested record is available via receiveEntityRecords (non-default entity key).', async () => {
		const getEntityRecord = jest.fn();
		const registry = createTestRegistry( getEntityRecord );

		// Trigger resolution of postType records
		apiFetch.mockImplementation( () => ( {
			'test-1': { slug: 'test-1', id: 2 },
		} ) );
		await runPromise(
			registry
				.dispatch( 'test/resolution' )
				.getEntityRecords( 'root', 'taxonomy' )
		);
		jest.runAllTimers();

		// Select record with id = test-1, it is available and should not trigger the resolver
		await runPromise(
			registry
				.dispatch( 'test/resolution' )
				.getEntityRecord( 'root', 'taxonomy', 'test-1' )
		);
		expect( getEntityRecord ).not.toHaveBeenCalled();

		// Select record with id = test-2, it is not available and should trigger the resolver
		await runPromise(
			registry
				.dispatch( 'test/resolution' )
				.getEntityRecord( 'root', 'taxonomy', 'test-2' )
		);
		expect( getEntityRecord ).toHaveBeenCalled();
	} );
} );

describe( 'saveEntityRecord', () => {
	function createTestRegistry() {
		const registry = createRegistry();
		registry.register( store );
		return registry;
	}

	beforeEach( async () => {
		apiFetch.mockReset();
		triggerFetch.mockReset();
		jest.useFakeTimers( 'modern' );
	} );

	it( 'should not trigger any GET requests until POST/PUT is finished.', async () => {
		const registry = createTestRegistry();
		// Fetch post types from the API {{{
		apiFetch.mockImplementation( () => ( {
			'post-1': { slug: 'post-1' },
		} ) );

		// Trigger fetch
		registry.select( 'core' ).getEntityRecords( 'root', 'postType' );
		jest.runAllTimers();
		await Promise.resolve().then( () => jest.runAllTimers() );
		expect( apiFetch ).toBeCalledTimes( 1 );
		expect( apiFetch ).toBeCalledWith( {
			path: '/wp/v2/types?context=edit',
		} );

		// Select fetched results, there should be no subsequent request
		apiFetch.mockReset();
		const results = registry
			.select( 'core' )
			.getEntityRecords( 'root', 'postType' );
		expect( apiFetch ).toBeCalledTimes( 0 );
		jest.runAllTimers();
		expect( apiFetch ).toBeCalledTimes( 0 );
		expect( results ).toHaveLength( 1 );
		expect( results[ 0 ].slug ).toBe( 'post-1' );
		// }}} Fetch post types from the API

		// Save changes
		apiFetch.mockClear();
		apiFetch.mockImplementation( actualApiFetch );
		let resolvePromise;
		triggerFetch.mockImplementation( function () {
			return new Promise( ( resolve ) => {
				resolvePromise = resolve;
			} );
		} );
		const savePromise = registry
			.dispatch( 'core' )
			.saveEntityRecord( 'root', 'postType', {
				slug: 'post-1',
				newField: 'a',
			} );
		await runPendingPromises();

		// There should ONLY be a single hanging API call (PUT) by this point.
		// If there have been any other requests, it is a race condition of some sorts,
		// e.g. a resolution was triggered before the save was finished.
		expect( triggerFetch ).toBeCalledTimes( 1 );
		expect( triggerFetch ).toHaveBeenCalledWith(
			expect.objectContaining( {
				method: 'PUT',
				path: '/wp/v2/types/post-1',
				data: expect.objectContaining( {
					newField: 'a',
					slug: 'post-1',
				} ),
			} )
		);
		triggerFetch.mockClear();
		apiFetch.mockClear();

		// The PUT is still hanging, let's call a selector now and make sure it won't trigger
		// any requests
		registry.select( 'core' ).getEntityRecords( 'root', 'postType' );
		jest.runAllTimers();
		expect( triggerFetch ).toBeCalledTimes( 0 );

		// Now that all timers are exhausted, let's resolve the PUT request and wait until the
		// save is complete
		resolvePromise( { newField: 'a', slug: 'post-1' } );

		// Run selector and make sure it doesn't trigger any requests just yet
		registry.select( 'core' ).getEntityRecords( 'root', 'postType' );
		jest.runAllTimers();
		expect( triggerFetch ).toBeCalledTimes( 0 );

		const newRecord = await savePromise;
		expect( newRecord ).toEqual( { newField: 'a', slug: 'post-1' } );
		// There should be no other API calls just because saving succeeded
		jest.runAllTimers();
		expect( triggerFetch ).toBeCalledTimes( 0 );

		// Calling the selector after the save is finished should trigger a resolver and a GET request
		registry.select( 'core' ).getEntityRecords( 'root', 'postType' );
		await runPendingPromises();
		expect( triggerFetch ).toBeCalledTimes( 1 );
		expect( triggerFetch ).toBeCalledWith( {
			path: '/wp/v2/types?context=edit',
		} );
	} );
} );
