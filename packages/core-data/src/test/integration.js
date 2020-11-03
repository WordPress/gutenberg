/**
 * WordPress dependencies
 */
import { createRegistry, controls } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { receiveEntityRecords } from '../actions';
import * as selectors from '../selectors';
import * as resolvers from '../resolvers';

// Mock to prevent calling window.fetch in test environment
jest.mock( '@wordpress/data-controls', () => {
	return {
		apiFetch: jest.fn(),
	};
} );
import { apiFetch } from '@wordpress/data-controls';

describe( 'receiveEntityRecord', () => {
	function createTestRegistry( getEntityRecord ) {
		const registry = createRegistry();
		const initialState = {
			entities: {
				data: {},
			},
		};
		registry.registerStore( 'core', {
			selectors: {
				getEntitiesByKind: () => [
					{ name: 'postType', kind: 'root', baseURL: '/wp/v2/types' },
					{ name: 'postType', kind: 'root', baseURL: '/wp/v2/types' },
				],
			},
			reducer: () => ( {} ),
		} );
		registry.registerStore( 'test/resolution', {
			actions: {
				receiveEntityRecords,
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

	const runPromise = async ( promise ) => {
		jest.runAllTimers();
		await promise;
	};

	beforeEach( async () => {
		jest.useFakeTimers();
	} );

	it( 'should not trigger a resolver when the requested record is available via receiveEntityRecords.', async () => {
		const getEntityRecord = jest.fn();
		const registry = createTestRegistry( getEntityRecord );

		// Trigger resolution of postType records
		apiFetch.mockImplementation( () => ( {
			2: { slug: 'test', id: 2 },
		} ) );
		await runPromise(
			registry
				.dispatch( 'test/resolution' )
				.getEntityRecords( 'root', 'postType' )
		);

		// Select record with id = 2, it is available and should trigger the resolver
		await runPromise(
			registry
				.dispatch( 'test/resolution' )
				.getEntityRecord( 'root', 'postType', 2 )
		);
		expect( getEntityRecord ).not.toHaveBeenCalled();

		// Select record with id = 4, it is not available and should not trigger the resolver
		await runPromise(
			registry
				.dispatch( 'test/resolution' )
				.getEntityRecord( 'root', 'postType', 4 )
		);
		expect( getEntityRecord ).toHaveBeenCalled();
	} );
} );
