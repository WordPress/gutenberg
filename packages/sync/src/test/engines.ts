/**
 * External dependencies
 */
import { afterEach, describe, expect, it } from '@jest/globals';

/**
 * WordPress dependencies
 */
import { addFilter, removeFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import {
	getAnnouncedSync,
	getEngineAdapters,
	resetEngineAdaptersForTesting,
	resolveEngineAdapter,
	YJS_RELAY_ENGINE_PROTOCOL,
	YJS_RELAY_ENGINE_SLUG,
} from '../engines';
import { getProviderCreators } from '../providers';

describe( 'sync engine adapters', () => {
	afterEach( () => {
		resetEngineAdaptersForTesting();
		delete window._wpCollaborationSync;
		delete window._wpCollaborationEnabled;
	} );

	describe( 'getEngineAdapters', () => {
		it( 'registers the yjs-relay adapter by default', () => {
			const adapters = getEngineAdapters();
			expect( adapters[ YJS_RELAY_ENGINE_SLUG ] ).toBeDefined();
			expect( adapters[ YJS_RELAY_ENGINE_SLUG ].protocolVersion ).toBe(
				YJS_RELAY_ENGINE_PROTOCOL
			);
			// The yjs-relay adapter supplies the transport session codec
			// factory grown in the provider-narrowing refactor.
			expect(
				typeof adapters[ YJS_RELAY_ENGINE_SLUG ].createSessionCodec
			).toBe( 'function' );
		} );

		it( 'accepts additional adapters via the sync.engines filter and drops malformed ones', () => {
			addFilter( 'sync.engines', 'test/add-engine', ( adapters ) => [
				...adapters,
				{
					slug: 'intent-log',
					protocolVersion: 1,
					createManager: () => ( {} ),
				},
				{ slug: 'malformed-no-factory', protocolVersion: 1 },
			] );

			const adapters = getEngineAdapters();
			expect( adapters[ 'intent-log' ] ).toBeDefined();
			expect( adapters[ 'malformed-no-factory' ] ).toBeUndefined();
			expect( adapters[ YJS_RELAY_ENGINE_SLUG ] ).toBeDefined();

			removeFilter( 'sync.engines', 'test/add-engine' );
		} );
	} );

	describe( 'getAnnouncedSync', () => {
		it( 'returns null without a server announcement', () => {
			expect( getAnnouncedSync() ).toBeNull();
		} );

		it( 'returns null for a malformed announcement', () => {
			window._wpCollaborationSync = { engine: 'yjs-relay' };
			expect( getAnnouncedSync() ).toBeNull();
		} );

		it( 'normalizes a valid announcement', () => {
			window._wpCollaborationSync = {
				engine: 'yjs-relay',
				engineProtocol: 1,
			};
			expect( getAnnouncedSync() ).toEqual( {
				engine: 'yjs-relay',
				engineProtocol: 1,
				transports: [],
				transportProtocol: 1,
			} );
		} );
	} );

	describe( 'resolveEngineAdapter', () => {
		it( 'falls back to yjs-relay when the server announces nothing (pre-handshake server)', () => {
			const adapter = resolveEngineAdapter();
			expect( adapter?.slug ).toBe( YJS_RELAY_ENGINE_SLUG );
		} );

		it( 'resolves the announced engine when registered at the right protocol', () => {
			window._wpCollaborationSync = {
				engine: YJS_RELAY_ENGINE_SLUG,
				engineProtocol: YJS_RELAY_ENGINE_PROTOCOL,
				transports: [ 'http-polling' ],
				transportProtocol: 1,
			};
			expect( resolveEngineAdapter()?.slug ).toBe(
				YJS_RELAY_ENGINE_SLUG
			);
		} );

		it( 'returns null when the announced engine is not registered', () => {
			window._wpCollaborationSync = {
				engine: 'automerge',
				engineProtocol: 1,
				transports: [ 'http-polling' ],
				transportProtocol: 1,
			};
			expect( resolveEngineAdapter() ).toBeNull();
		} );

		it( 'returns null on an engine protocol version mismatch', () => {
			window._wpCollaborationSync = {
				engine: YJS_RELAY_ENGINE_SLUG,
				engineProtocol: YJS_RELAY_ENGINE_PROTOCOL + 1,
				transports: [ 'http-polling' ],
				transportProtocol: 1,
			};
			expect( resolveEngineAdapter() ).toBeNull();
		} );
	} );

	describe( 'transport handshake in getProviderCreators', () => {
		it( 'returns no providers when the announced transports exclude http-polling', () => {
			window._wpCollaborationEnabled = '1';
			window._wpCollaborationSync = {
				engine: YJS_RELAY_ENGINE_SLUG,
				engineProtocol: YJS_RELAY_ENGINE_PROTOCOL,
				transports: [ 'websocket' ],
				transportProtocol: 1,
			};
			expect( getProviderCreators() ).toEqual( [] );
		} );
	} );
} );
