import { afterEach, describe, expect, it } from '@jest/globals';
import { addFilter, removeFilter } from '@wordpress/hooks';
import {
	getAnnouncedSync,
	getEngineAdapters,
	resetEngineAdaptersForTesting,
	resolveEngineAdapter,
} from '../engines';
import { resetProviderCreatorsForTesting } from '../providers';

// The framework ships NO engines; they come from a plugin via
// `registerSyncEngine` (or the `sync.engines` filter). These tests register a
// minimal stub adapter to exercise the registry and the negotiation.
const STUB_SLUG = 'stub-engine';
const STUB_PROTOCOL = 1;
const STUB_HOOK = 'test/stub-engine';

function registerStubEngine(): void {
	addFilter( 'sync.engines', STUB_HOOK, ( adapters ) => [
		...( adapters as unknown[] ),
		{
			slug: STUB_SLUG,
			protocolVersion: STUB_PROTOCOL,
			createManager: () => ( {} ) as never,
		},
	] );
}

describe( 'sync engine adapters', () => {
	afterEach( () => {
		removeFilter( 'sync.engines', STUB_HOOK );
		resetEngineAdaptersForTesting();
		resetProviderCreatorsForTesting();
		delete window._wpCollaborationSync;
		delete window.__experimentalEnableRealTimeCollaboration;
	} );

	describe( 'getEngineAdapters', () => {
		it( 'registers no adapters by default (engines come from a plugin)', () => {
			expect( Object.keys( getEngineAdapters() ) ).toHaveLength( 0 );
		} );

		it( 'accepts adapters via the sync.engines filter and drops malformed ones', () => {
			addFilter( 'sync.engines', 'test/add-engine', ( adapters ) => [
				...( adapters as unknown[] ),
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

			removeFilter( 'sync.engines', 'test/add-engine' );
		} );
	} );

	describe( 'getAnnouncedSync', () => {
		it( 'returns null without a server announcement', () => {
			expect( getAnnouncedSync() ).toBeNull();
		} );

		it( 'returns null for a malformed announcement', () => {
			window._wpCollaborationSync = { engine: STUB_SLUG };
			expect( getAnnouncedSync() ).toBeNull();
		} );

		it( 'normalizes a valid announcement', () => {
			window._wpCollaborationSync = {
				engine: STUB_SLUG,
				engineProtocol: 1,
			};
			expect( getAnnouncedSync() ).toEqual( {
				engine: STUB_SLUG,
				engineProtocol: 1,
				transports: [],
				transportProtocol: 1,
			} );
		} );
	} );

	describe( 'resolveEngineAdapter', () => {
		it( 'returns null when the server announces nothing', () => {
			expect( resolveEngineAdapter() ).toBeNull();
		} );

		it( 'resolves the announced engine when registered at the right protocol', () => {
			registerStubEngine();
			window._wpCollaborationSync = {
				engine: STUB_SLUG,
				engineProtocol: STUB_PROTOCOL,
				transports: [ 'http-polling' ],
				transportProtocol: 1,
			};
			expect( resolveEngineAdapter()?.slug ).toBe( STUB_SLUG );
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
			registerStubEngine();
			window._wpCollaborationSync = {
				engine: STUB_SLUG,
				engineProtocol: STUB_PROTOCOL + 1,
				transports: [ 'http-polling' ],
				transportProtocol: 1,
			};
			expect( resolveEngineAdapter() ).toBeNull();
		} );
	} );
} );
