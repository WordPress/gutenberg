/**
 * External dependencies
 */
import { describe, expect, it } from '@jest/globals';

/**
 * Internal dependencies
 */
import {
	CRDT_DOC_VERSION,
	CRDT_RECORD_MAP_KEY,
	CRDT_STATE_MAP_KEY,
	CRDT_STATE_PERSISTED_AT_KEY,
	CRDT_STATE_PERSISTED_BY_KEY,
	CRDT_STATE_RESTORED_AT_KEY,
	CRDT_STATE_RESTORED_BY_KEY,
	CRDT_STATE_VERSION_KEY,
	LOCAL_EDITOR_ORIGIN,
	LOCAL_SYNC_PROVIDER_ORIGIN,
} from '../config';

describe( 'config', () => {
	describe( 'CRDT_DOC_VERSION', () => {
		it( 'is defined as a number', () => {
			expect( typeof CRDT_DOC_VERSION ).toBe( 'number' );
		} );

		it( 'has the correct version value', () => {
			expect( CRDT_DOC_VERSION ).toBe( 1 );
		} );
	} );

	describe( 'Map keys', () => {
		it( 'defines CRDT_RECORD_MAP_KEY', () => {
			expect( CRDT_RECORD_MAP_KEY ).toBe( 'document' );
		} );

		it( 'defines CRDT_STATE_MAP_KEY', () => {
			expect( CRDT_STATE_MAP_KEY ).toBe( 'state' );
		} );
	} );

	describe( 'State sub-keys', () => {
		it( 'defines CRDT_STATE_PERSISTED_AT_KEY', () => {
			expect( CRDT_STATE_PERSISTED_AT_KEY ).toBe( 'persistedAt' );
		} );

		it( 'defines CRDT_STATE_PERSISTED_BY_KEY', () => {
			expect( CRDT_STATE_PERSISTED_BY_KEY ).toBe( 'persistedBy' );
		} );

		it( 'defines CRDT_STATE_RESTORED_AT_KEY', () => {
			expect( CRDT_STATE_RESTORED_AT_KEY ).toBe( 'restoredAt' );
		} );

		it( 'defines CRDT_STATE_RESTORED_BY_KEY', () => {
			expect( CRDT_STATE_RESTORED_BY_KEY ).toBe( 'restoredBy' );
		} );

		it( 'defines CRDT_STATE_VERSION_KEY', () => {
			expect( CRDT_STATE_VERSION_KEY ).toBe( 'version' );
		} );
	} );

	describe( 'Origin strings', () => {
		it( 'defines LOCAL_EDITOR_ORIGIN', () => {
			expect( LOCAL_EDITOR_ORIGIN ).toBe( 'gutenberg' );
		} );

		it( 'defines LOCAL_SYNC_PROVIDER_ORIGIN', () => {
			expect( LOCAL_SYNC_PROVIDER_ORIGIN ).toBe( 'syncProvider' );
		} );
	} );
} );
