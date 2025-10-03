/**
 * External dependencies
 */
import { describe, expect, it, jest, beforeEach } from '@jest/globals';

const mockIndexeddbPersistence = {
	destroy: jest.fn(),
};

jest.mock( 'y-indexeddb', () => {
	return {
		IndexeddbPersistence: jest
			.fn()
			.mockImplementation( () => mockIndexeddbPersistence ),
	};
} );

const mockYDoc = {
	clientID: 12345,
	meta: new Map(),
	getMap: jest.fn(),
	transact: jest.fn( ( fn ) => fn() ),
	destroy: jest.fn(),
};

jest.mock( 'yjs', () => ( {
	Doc: jest.fn().mockImplementation( () => mockYDoc ),
} ) );

/**
 * Internal dependencies
 */
import { connectIndexDb } from '../connect-indexdb';

describe( 'connectIndexDb', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'creates an IndexeddbPersistence provider correctly', async () => {
		const { IndexeddbPersistence } = jest.requireMock( 'y-indexeddb' );
		const objectId = '123';
		const objectType = 'post';
		const doc = mockYDoc;

		const result = await connectIndexDb( objectId, objectType, doc );

		expect( result ).toBeDefined();
		expect( typeof result.destroy ).toBe( 'function' );
		expect( IndexeddbPersistence ).toHaveBeenCalledWith( 'post-123', doc );
	} );

	it( 'destroy method calls provider.destroy', async () => {
		const result = await connectIndexDb( '789', 'post', mockYDoc );

		result.destroy();

		expect( mockIndexeddbPersistence.destroy ).toHaveBeenCalled();
	} );
} );
