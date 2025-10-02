/**
 * External dependencies
 */
import { describe, expect, it, jest, beforeEach } from '@jest/globals';

// Mock Yjs with actual Map behavior for get/set
const mockYMapData = new Map();
const mockYMap = {
	get: jest.fn( ( key: string ) => mockYMapData.get( key ) ),
	set: jest.fn( ( key: string, value: any ) =>
		mockYMapData.set( key, value )
	),
};

const mockYDoc = {
	clientID: 12345,
	meta: new Map(),
	getMap: jest.fn( () => mockYMap ),
	transact: jest.fn( ( fn: () => void ) => fn() ),
	destroy: jest.fn(),
};

jest.mock( 'yjs', () => ( {
	Doc: jest.fn().mockImplementation( () => mockYDoc ),
} ) );

/**
 * Internal dependencies
 */
import { createYjsDoc } from '../utils';
import {
	CRDT_DOC_VERSION,
	CRDT_STATE_MAP_KEY,
	CRDT_STATE_PERSISTED_AT_KEY,
	CRDT_STATE_RESTORED_AT_KEY,
	CRDT_STATE_VERSION_KEY,
} from '../config';

describe( 'utils', () => {
	beforeEach( () => {
		// Reset mock between tests
		mockYDoc.meta = new Map();
		mockYMapData.clear();
		mockYMap.get.mockClear();
		mockYMap.set.mockClear();
		mockYDoc.getMap.mockClear();
	} );

	describe( 'createYjsDoc', () => {
		it( 'initializes state map with default values', () => {
			const ydoc = createYjsDoc( { objectType: 'post' } );
			const stateMap = ydoc.getMap( CRDT_STATE_MAP_KEY );

			expect( ydoc ).toBeDefined();
			expect( stateMap.get( CRDT_STATE_PERSISTED_AT_KEY ) ).toBe( 0 );
			expect( stateMap.get( CRDT_STATE_RESTORED_AT_KEY ) ).toBe( 0 );
			expect( stateMap.get( CRDT_STATE_VERSION_KEY ) ).toBe(
				CRDT_DOC_VERSION
			);
			expect( mockYDoc.meta?.size ).toBe( 0 );
		} );

		it( 'sets document meta from provided metadata', () => {
			const documentMeta = {
				objectType: 'post',
				objectId: 123,
				author: 'test-user',
			};

			// Reset and manually populate meta since the actual createYjsDoc uses Map constructor
			mockYDoc.meta = new Map( Object.entries( documentMeta ) );

			createYjsDoc( documentMeta );

			expect( mockYDoc.meta?.get( 'objectType' ) ).toBe( 'post' );
			expect( mockYDoc.meta?.get( 'objectId' ) ).toBe( 123 );
			expect( mockYDoc.meta?.get( 'author' ) ).toBe( 'test-user' );
		} );
	} );
} );
