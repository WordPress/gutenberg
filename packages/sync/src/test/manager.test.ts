/**
 * External dependencies
 */
import * as Y from 'yjs';
import { Awareness } from 'y-protocols/awareness';
import * as fun from 'lib0/function';
import {
	describe,
	expect,
	it,
	jest,
	beforeEach,
	afterEach,
} from '@jest/globals';

/**
 * Internal dependencies
 */
import { createSyncManager } from '../manager';
import {
	CRDT_RECORD_MAP_KEY,
	CRDT_STATE_MAP_KEY,
	CRDT_STATE_MAP_SAVED_AT_KEY as SAVED_AT_KEY,
	CRDT_STATE_MAP_SAVED_BY_KEY as SAVED_BY_KEY,
} from '../config';
import { getProviderCreators } from '../providers';
import { createPresenceDetector } from '../presence-detector';
import type {
	CRDTDoc,
	ObjectData,
	ProviderCreator,
	ProviderCreatorResult,
	RecordHandlers,
	SyncConfig,
} from '../types';
import { serializeCrdtDoc } from '../utils';

// Mock dependencies.
jest.mock( '../providers', () => ( {
	getProviderCreators: jest.fn(),
} ) );
const mockGetProviderCreators = jest.mocked( getProviderCreators );

jest.mock( '../presence-detector', () => ( {
	createPresenceDetector: jest.fn(),
} ) );
const mockCreatePresenceDetector = jest.mocked( createPresenceDetector );

/**
 * Helper: configure the presence detector mock to trigger the
 * onCollaboratorDetected callback after a microtask (matching the real
 * behavior where the first poll is async). This causes providers to
 * connect shortly after loadEntity returns.
 */
function mockPresenceDetectorImmediate() {
	mockCreatePresenceDetector.mockImplementation( ( options ) => {
		// Fire after a microtask so entityStates is populated first.
		Promise.resolve().then( () => options.onCollaboratorDetected() );
		return { destroy: jest.fn() };
	} );
}

/**
 * Helper: configure the presence detector mock to NOT trigger the callback.
 * Providers will remain deferred (not connected).
 */
function mockPresenceDetectorDeferred() {
	mockCreatePresenceDetector.mockImplementation( () => {
		return { destroy: jest.fn() };
	} );
}

/**
 * Helper: wait one microtask tick for async operations to complete.
 */
function tick(): Promise< void > {
	return new Promise( ( resolve ) => setTimeout( resolve, 0 ) );
}

/**
 * A mock checkPresence function for use in SyncConfig.
 * Required for deferred connection (presence detection) to activate.
 */
const mockCheckPresence = jest.fn( () =>
	Promise.resolve( { otherClientIds: [] as number[] } )
);

describe( 'SyncManager', () => {
	let mockHandlers: jest.MockedObject< RecordHandlers >;
	let mockProviderCreator: jest.Mock< ProviderCreator >;
	let mockProviderResult: ProviderCreatorResult;
	let mockRecord: ObjectData;
	let mockSyncConfig: jest.MockedObject< SyncConfig >;

	beforeEach( () => {
		// Reset all mocks
		jest.clearAllMocks();

		mockRecord = {
			id: '123',
			title: 'Test Post',
			meta: {},
		};

		mockProviderResult = {
			destroy: jest.fn(),
			on: jest.fn(),
		};
		mockProviderCreator = jest.fn( () =>
			Promise.resolve( mockProviderResult )
		);
		mockGetProviderCreators.mockReturnValue( [ mockProviderCreator ] );

		// Default: presence detector triggers immediately (providers connect).
		mockPresenceDetectorImmediate();

		mockSyncConfig = {
			applyChangesToCRDTDoc: jest.fn(),
			checkPresence: mockCheckPresence,
			getChangesFromCRDTDoc: jest.fn(
				( ydoc: CRDTDoc, editedRecord: ObjectData ) => {
					const ymap = ydoc.getMap( CRDT_RECORD_MAP_KEY );

					// Simple deep equality check.
					return Object.fromEntries(
						Object.entries( ymap.toJSON() ).filter(
							( [ key, newValue ] ) =>
								! fun.equalityDeep(
									editedRecord[ key ],
									newValue
								)
						)
					);
				}
			),
			createAwareness: jest.fn(
				( ydoc: Y.Doc ) => new Awareness( ydoc )
			),
			getPersistedCRDTDoc: jest.fn( () => null ),
		};

		mockHandlers = {
			addUndoMeta: jest.fn(),
			editRecord: jest.fn(),
			getEditedRecord: jest.fn( async () =>
				Promise.resolve( mockRecord )
			),
			onStatusChange: jest.fn(),
			persistCRDTDoc: jest.fn(),
			refetchRecord: jest.fn( async () => Promise.resolve() ),
			restoreUndoMeta: jest.fn(),
		};
	} );

	afterEach( () => {
		jest.restoreAllMocks();
	} );

	describe( 'load', () => {
		it( 'creates a sync manager with load method', () => {
			const manager = createSyncManager();

			expect( manager ).toHaveProperty( 'load' );
			expect( typeof manager.load ).toBe( 'function' );
		} );

		it( 'loads an entity and applies changes to CRDT document', async () => {
			const manager = createSyncManager();

			await manager.load(
				mockSyncConfig,
				'post',
				'123',
				mockRecord,
				mockHandlers
			);

			// Verify that applyChangesToCRDTDoc was called with the record data
			expect( mockSyncConfig.applyChangesToCRDTDoc ).toHaveBeenCalledWith(
				expect.any( Y.Doc ),
				mockRecord
			);
		} );

		it( 'creates providers for the entity when collaborator detected', async () => {
			const manager = createSyncManager();

			await manager.load(
				mockSyncConfig,
				'postType/post',
				'123',
				mockRecord,
				mockHandlers
			);

			// Wait for deferred connectProviders to complete.
			await tick();

			expect( mockProviderCreator ).toHaveBeenCalledTimes( 1 );
			expect( mockProviderCreator ).toHaveBeenCalledWith( {
				objectType: 'postType/post',
				objectId: '123',
				ydoc: expect.any( Y.Doc ),
				awareness: expect.any( Awareness ),
			} );
		} );

		it( 'does not load entity when no providers are available', async () => {
			mockGetProviderCreators.mockReturnValue( [] );

			const manager = createSyncManager();

			await manager.load(
				mockSyncConfig,
				'post',
				'123',
				mockRecord,
				mockHandlers
			);

			expect(
				mockSyncConfig.applyChangesToCRDTDoc
			).not.toHaveBeenCalled();
			expect( mockProviderCreator ).not.toHaveBeenCalled();
		} );

		it( 'does not load entity twice if already loaded', async () => {
			const manager = createSyncManager();

			await manager.load(
				mockSyncConfig,
				'post',
				'123',
				mockRecord,
				mockHandlers
			);

			await manager.load(
				mockSyncConfig,
				'post',
				'123',
				mockRecord,
				mockHandlers
			);

			// Wait for deferred connectProviders to complete.
			await tick();

			// Should only be called once despite two load attempts
			expect(
				mockSyncConfig.applyChangesToCRDTDoc
			).toHaveBeenCalledTimes( 1 );
			expect( mockProviderCreator ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'loads multiple entities independently', async () => {
			const manager = createSyncManager();

			const record1 = { id: '123', title: 'Post 1' };
			const record2 = { id: '456', title: 'Post 2' };

			await manager.load(
				mockSyncConfig,
				'post',
				'123',
				record1,
				mockHandlers
			);

			await manager.load(
				mockSyncConfig,
				'post',
				'456',
				record2,
				mockHandlers
			);

			// Wait for deferred connectProviders to complete.
			await tick();

			expect(
				mockSyncConfig.applyChangesToCRDTDoc
			).toHaveBeenCalledTimes( 2 );
			expect( mockProviderCreator ).toHaveBeenCalledTimes( 2 );
		} );

		it( 'connects providers immediately when no awareness support', async () => {
			mockSyncConfig = {
				...mockSyncConfig,
				createAwareness: undefined,
			};

			const manager = createSyncManager();

			await manager.load(
				mockSyncConfig,
				'postType/post',
				'123',
				mockRecord,
				mockHandlers
			);

			// Providers should connect immediately (no presence detector).
			expect( mockCreatePresenceDetector ).not.toHaveBeenCalled();
			expect( mockProviderCreator ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'connects providers immediately when no checkPresence', async () => {
			mockSyncConfig = {
				...mockSyncConfig,
				checkPresence: undefined,
			};

			const manager = createSyncManager();

			await manager.load(
				mockSyncConfig,
				'postType/post',
				'123',
				mockRecord,
				mockHandlers
			);

			// Providers should connect immediately (no presence detection).
			expect( mockCreatePresenceDetector ).not.toHaveBeenCalled();
			expect( mockProviderCreator ).toHaveBeenCalledTimes( 1 );
		} );

		describe( 'persisted CRDT doc behavior', () => {
			function createPersistedCRDTDoc(
				persistedRecord: ObjectData
			): string {
				const persistedDoc = new Y.Doc();
				const persistedRecordMap =
					persistedDoc.getMap( CRDT_RECORD_MAP_KEY );
				Object.entries( persistedRecord ).forEach(
					( [ key, value ] ) => {
						persistedRecordMap.set( key, value );
					}
				);

				return serializeCrdtDoc( persistedDoc );
			}

			it( 'applies the current record when no persisted CRDT doc exists', async () => {
				const manager = createSyncManager();

				await manager.load(
					mockSyncConfig,
					'post',
					'123',
					mockRecord,
					mockHandlers
				);

				expect(
					mockSyncConfig.applyChangesToCRDTDoc
				).toHaveBeenCalledTimes( 1 );
				expect(
					mockSyncConfig.applyChangesToCRDTDoc
				).toHaveBeenCalledWith( expect.any( Y.Doc ), mockRecord );

				expect(
					mockSyncConfig.getChangesFromCRDTDoc
				).not.toHaveBeenCalled();

				expect( mockHandlers.persistCRDTDoc ).toHaveBeenCalledTimes(
					1
				);
			} );

			it( 'accepts a valid persisted CRDT doc without applying changes', async () => {
				mockSyncConfig = {
					...mockSyncConfig,
					getPersistedCRDTDoc: jest.fn( () =>
						createPersistedCRDTDoc( mockRecord )
					),
				};

				const manager = createSyncManager();

				await manager.load(
					mockSyncConfig,
					'post',
					'123',
					mockRecord,
					mockHandlers
				);

				expect(
					mockSyncConfig.applyChangesToCRDTDoc
				).not.toHaveBeenCalled();

				expect(
					mockSyncConfig.getChangesFromCRDTDoc
				).toHaveBeenCalledTimes( 1 );
				expect(
					mockSyncConfig.getChangesFromCRDTDoc
				).toHaveBeenCalledWith( expect.any( Y.Doc ), mockRecord );

				expect( mockHandlers.editRecord ).not.toHaveBeenCalled();
				expect( mockHandlers.persistCRDTDoc ).not.toHaveBeenCalled();
			} );

			it( 'applies a persisted CRDT doc with invalidated fields, then applies changes', async () => {
				mockSyncConfig = {
					...mockSyncConfig,
					getPersistedCRDTDoc: jest.fn( () =>
						createPersistedCRDTDoc( {
							...mockRecord,
							title: 'Invalidated title from persisted CRDT doc',
						} )
					),
				};

				const manager = createSyncManager();

				await manager.load(
					mockSyncConfig,
					'post',
					'123',
					mockRecord,
					mockHandlers
				);

				const expectedChanges = {
					title: mockRecord.title,
				};

				expect(
					mockSyncConfig.applyChangesToCRDTDoc
				).toHaveBeenCalledTimes( 1 );
				expect(
					mockSyncConfig.applyChangesToCRDTDoc
				).toHaveBeenCalledWith( expect.any( Y.Doc ), expectedChanges );

				expect(
					mockSyncConfig.getChangesFromCRDTDoc
				).toHaveBeenCalledTimes( 1 );
				expect(
					mockSyncConfig.getChangesFromCRDTDoc
				).toHaveBeenCalledWith( expect.any( Y.Doc ), mockRecord );

				expect( mockHandlers.persistCRDTDoc ).toHaveBeenCalledTimes(
					1
				);
			} );
		} );
	} );

	describe( 'deferred connection', () => {
		it( 'does not create providers immediately when awareness and checkPresence are available', async () => {
			mockPresenceDetectorDeferred();

			const manager = createSyncManager();

			await manager.load(
				mockSyncConfig,
				'postType/post',
				'123',
				mockRecord,
				mockHandlers
			);

			await tick();

			// Presence detector should be started.
			expect( mockCreatePresenceDetector ).toHaveBeenCalledTimes( 1 );
			expect( mockCreatePresenceDetector ).toHaveBeenCalledWith( {
				room: 'postType/post:123',
				clientId: expect.any( Number ),
				awareness: expect.any( Awareness ),
				checkPresence: mockCheckPresence,
				onCollaboratorDetected: expect.any( Function ),
			} );

			// Providers should NOT be connected yet.
			expect( mockProviderCreator ).not.toHaveBeenCalled();
		} );

		it( 'connects providers when presence detector fires onCollaboratorDetected', async () => {
			let capturedCallback: ( () => void ) | null = null;
			mockCreatePresenceDetector.mockImplementation( ( options ) => {
				capturedCallback = options.onCollaboratorDetected;
				return { destroy: jest.fn() };
			} );

			const manager = createSyncManager();

			await manager.load(
				mockSyncConfig,
				'postType/post',
				'123',
				mockRecord,
				mockHandlers
			);

			// Providers should not be connected yet.
			expect( mockProviderCreator ).not.toHaveBeenCalled();

			// Simulate collaborator detection.
			capturedCallback!();
			await tick();

			// Now providers should be connected.
			expect( mockProviderCreator ).toHaveBeenCalledTimes( 1 );
			expect( mockProviderCreator ).toHaveBeenCalledWith( {
				objectType: 'postType/post',
				objectId: '123',
				ydoc: expect.any( Y.Doc ),
				awareness: expect.any( Awareness ),
			} );
		} );

		it( 'destroys presence detector on unload when providers are not connected', async () => {
			const mockDestroy = jest.fn();
			mockCreatePresenceDetector.mockImplementation( () => {
				return { destroy: mockDestroy };
			} );

			const manager = createSyncManager();

			await manager.load(
				mockSyncConfig,
				'post',
				'123',
				mockRecord,
				mockHandlers
			);

			// Providers are deferred — not connected.
			expect( mockProviderCreator ).not.toHaveBeenCalled();

			manager.unload( 'post', '123' );

			// Presence detector should be destroyed.
			expect( mockDestroy ).toHaveBeenCalledTimes( 1 );

			// Provider destroy should NOT be called (no providers).
			expect( mockProviderResult.destroy ).not.toHaveBeenCalled();
		} );

		it( 'still allows local editing with UndoManager before providers connect', async () => {
			mockPresenceDetectorDeferred();

			const manager = createSyncManager();

			await manager.load(
				mockSyncConfig,
				'post',
				'123',
				mockRecord,
				mockHandlers
			);

			// UndoManager should be available even without providers.
			expect( manager.undoManager ).toBeDefined();

			// Local updates should still work.
			const changes = { title: 'Updated locally' };
			manager.update( 'post', '123', changes, 'gutenberg' );
			await tick();

			expect( mockSyncConfig.applyChangesToCRDTDoc ).toHaveBeenCalledWith(
				expect.any( Y.Doc ),
				changes
			);
		} );
	} );

	describe( 'provider creation failure recovery', () => {
		it( 'restarts presence detection when connectProviders rejects', async () => {
			// First call: presence detector fires immediately → connectProviders.
			// connectProviders will reject because mockProviderCreator rejects.
			const detectorDestroys: Array< jest.Mock > = [];
			const detectorCallbacks: Array< () => void > = [];

			mockCreatePresenceDetector.mockImplementation( ( options ) => {
				const destroyFn = jest.fn();
				detectorCallbacks.push( options.onCollaboratorDetected );
				detectorDestroys.push( destroyFn );
				return { destroy: destroyFn };
			} );

			// Provider creation fails.
			mockProviderCreator.mockRejectedValueOnce(
				new Error( 'connection failed' )
			);

			const manager = createSyncManager();

			await manager.load(
				mockSyncConfig,
				'postType/post',
				'123',
				mockRecord,
				mockHandlers
			);

			// Phase 1: Presence detector created.
			expect( detectorCallbacks ).toHaveLength( 1 );

			// Simulate collaborator detected → triggers connectProviders which rejects.
			detectorCallbacks[ 0 ]();
			await tick();

			// connectProviders failed, so a new presence detector should
			// be started (restartPresenceDetection).
			expect( detectorCallbacks ).toHaveLength( 2 );

			// Now make the provider succeed on the retry.
			mockProviderCreator.mockResolvedValueOnce( mockProviderResult );

			// Simulate another collaborator detection from the new detector.
			detectorCallbacks[ 1 ]();
			await tick();

			// Providers should now be connected.
			expect( mockProviderCreator ).toHaveBeenCalledTimes( 2 );
		} );

		it( 'destroys partially-created providers when one rejects', async () => {
			const successfulProvider: ProviderCreatorResult = {
				destroy: jest.fn(),
				on: jest.fn(),
			};
			const failingCreator: jest.Mock< ProviderCreator > = jest.fn( () =>
				Promise.reject( new Error( 'second provider failed' ) )
			);

			// Two provider creators: first succeeds, second fails.
			mockGetProviderCreators.mockReturnValue( [
				jest.fn( () => Promise.resolve( successfulProvider ) ),
				failingCreator,
			] );

			const detectorCallbacks: Array< () => void > = [];
			mockCreatePresenceDetector.mockImplementation( ( options ) => {
				detectorCallbacks.push( options.onCollaboratorDetected );
				return { destroy: jest.fn() };
			} );

			const manager = createSyncManager();

			await manager.load(
				mockSyncConfig,
				'postType/post',
				'123',
				mockRecord,
				mockHandlers
			);

			// Trigger connection attempt.
			detectorCallbacks[ 0 ]();
			await tick();

			// The successful provider should have been destroyed (cleanup
			// of partial results).
			expect( successfulProvider.destroy ).toHaveBeenCalledTimes( 1 );

			// A new presence detector should be started for retry.
			expect( detectorCallbacks ).toHaveLength( 2 );
		} );
	} );

	describe( 'downgrade lifecycle', () => {
		let capturedAwareness: Awareness | null;

		beforeEach( () => {
			capturedAwareness = null;
			jest.useFakeTimers( { advanceTimers: true } );

			// Capture the awareness instance by watching createAwareness.
			mockSyncConfig = {
				...mockSyncConfig,
				createAwareness: jest.fn( ( ydoc: Y.Doc ) => {
					capturedAwareness = new Awareness( ydoc );
					return capturedAwareness;
				} ),
			};
		} );

		afterEach( () => {
			jest.useRealTimers();
		} );

		it( 'starts downgrade timer when all remote clients leave', async () => {
			const manager = createSyncManager();

			await manager.load(
				mockSyncConfig,
				'post',
				'123',
				mockRecord,
				mockHandlers
			);
			await tick();

			// Providers should be connected.
			expect( mockProviderCreator ).toHaveBeenCalledTimes( 1 );

			// Simulate a remote client joining then leaving.
			const awareness = capturedAwareness!;
			const remoteClientId = 999;

			// Remote client joins.
			awareness.getStates().set( remoteClientId, { name: 'Peer' } );
			awareness.emit( 'change', [
				{
					added: [ remoteClientId ],
					updated: [],
					removed: [],
				},
			] );

			// Remote client leaves.
			awareness.getStates().delete( remoteClientId );
			awareness.emit( 'change', [
				{
					added: [],
					updated: [],
					removed: [ remoteClientId ],
				},
			] );

			// Providers should still be connected (debounce hasn't elapsed).
			expect( mockProviderResult.destroy ).not.toHaveBeenCalled();

			// Advance past the debounce period (30s).
			await jest.advanceTimersByTimeAsync( 31_000 );

			// Now providers should be destroyed (downgraded to presence-only).
			expect( mockProviderResult.destroy ).toHaveBeenCalledTimes( 1 );

			// A new presence detector should be started for re-detection.
			// The first call was from initial load; the second from downgrade.
			expect( mockCreatePresenceDetector ).toHaveBeenCalledTimes( 2 );
		} );

		it( 'cancels downgrade when a collaborator returns within timeout', async () => {
			const manager = createSyncManager();

			await manager.load(
				mockSyncConfig,
				'post',
				'123',
				mockRecord,
				mockHandlers
			);
			await tick();

			const awareness = capturedAwareness!;
			const remoteClientId = 999;

			// Remote client joins.
			awareness.getStates().set( remoteClientId, { name: 'Peer' } );
			awareness.emit( 'change', [
				{
					added: [ remoteClientId ],
					updated: [],
					removed: [],
				},
			] );

			// Remote client leaves.
			awareness.getStates().delete( remoteClientId );
			awareness.emit( 'change', [
				{
					added: [],
					updated: [],
					removed: [ remoteClientId ],
				},
			] );

			// Advance halfway through debounce.
			await jest.advanceTimersByTimeAsync( 15_000 );

			// Remote client returns before debounce expires.
			awareness.getStates().set( remoteClientId, { name: 'Peer' } );
			awareness.emit( 'change', [
				{
					added: [ remoteClientId ],
					updated: [],
					removed: [],
				},
			] );

			// Wait past the original debounce timeout.
			await jest.advanceTimersByTimeAsync( 20_000 );

			// Providers should NOT have been destroyed — downgrade was cancelled.
			expect( mockProviderResult.destroy ).not.toHaveBeenCalled();
		} );

		it( 'completes full lifecycle: presence → sync → presence → sync', async () => {
			// Track all presence detector instances.
			const detectorCallbacks: Array< () => void > = [];
			const detectorDestroys: Array< jest.Mock > = [];

			mockCreatePresenceDetector.mockImplementation( ( options ) => {
				const destroyFn = jest.fn();
				detectorCallbacks.push( options.onCollaboratorDetected );
				detectorDestroys.push( destroyFn );
				return { destroy: destroyFn };
			} );

			const manager = createSyncManager();

			await manager.load(
				mockSyncConfig,
				'post',
				'123',
				mockRecord,
				mockHandlers
			);

			// Phase 1: Presence-only mode.
			expect( detectorCallbacks ).toHaveLength( 1 );
			expect( mockProviderCreator ).not.toHaveBeenCalled();

			// Phase 2: Collaborator detected → upgrade to full sync.
			detectorCallbacks[ 0 ]();
			await tick();
			expect( mockProviderCreator ).toHaveBeenCalledTimes( 1 );

			const awareness = capturedAwareness!;
			const remoteClientId = 999;

			// Remote client joins then leaves.
			awareness.getStates().set( remoteClientId, { name: 'Peer' } );
			awareness.emit( 'change', [
				{
					added: [ remoteClientId ],
					updated: [],
					removed: [],
				},
			] );
			awareness.getStates().delete( remoteClientId );
			awareness.emit( 'change', [
				{
					added: [],
					updated: [],
					removed: [ remoteClientId ],
				},
			] );

			// Phase 3: All collaborators left → downgrade after debounce.
			await jest.advanceTimersByTimeAsync( 31_000 );
			expect( mockProviderResult.destroy ).toHaveBeenCalledTimes( 1 );

			// A new presence detector should be created (second instance).
			expect( detectorCallbacks ).toHaveLength( 2 );

			// Phase 4: Another collaborator detected → upgrade again.
			// Create fresh provider mocks for the second connection.
			const secondProviderResult: ProviderCreatorResult = {
				destroy: jest.fn(),
				on: jest.fn(),
			};
			mockProviderCreator.mockResolvedValueOnce( secondProviderResult );

			detectorCallbacks[ 1 ]();
			await tick();
			expect( mockProviderCreator ).toHaveBeenCalledTimes( 2 );

			// Undo/redo should still work throughout.
			expect( manager.undoManager ).toBeDefined();
		} );

		it( 'cleans up everything on unload during downgrade timer', async () => {
			const manager = createSyncManager();

			await manager.load(
				mockSyncConfig,
				'post',
				'123',
				mockRecord,
				mockHandlers
			);
			await tick();

			const awareness = capturedAwareness!;
			const remoteClientId = 999;

			// Remote client joins then leaves — starts downgrade timer.
			awareness.getStates().set( remoteClientId, { name: 'Peer' } );
			awareness.emit( 'change', [
				{
					added: [ remoteClientId ],
					updated: [],
					removed: [],
				},
			] );
			awareness.getStates().delete( remoteClientId );
			awareness.emit( 'change', [
				{
					added: [],
					updated: [],
					removed: [ remoteClientId ],
				},
			] );

			// Unload while downgrade timer is pending.
			manager.unload( 'post', '123' );

			// Providers should be destroyed.
			expect( mockProviderResult.destroy ).toHaveBeenCalled();

			// Advance past debounce — should NOT cause errors
			// (timer should have been cleared on unload).
			await jest.advanceTimersByTimeAsync( 31_000 );
		} );

		it( 'starts downgrade when collaborator leaves during async provider creation', async () => {
			// Simulate slow provider creation so the collaborator can
			// leave before startAwarenessMonitor runs.
			let resolveProvider: ( value: unknown ) => void;
			const slowProvider = new Promise( ( resolve ) => {
				resolveProvider = resolve;
			} );
			mockProviderCreator.mockImplementationOnce( async () => {
				await slowProvider;
				return mockProviderResult;
			} );

			const manager = createSyncManager();

			await manager.load(
				mockSyncConfig,
				'post',
				'123',
				mockRecord,
				mockHandlers
			);
			await tick();

			const awareness = capturedAwareness!;
			const remoteClientId = 999;

			// Simulate collaborator detected by presence detector.
			awareness.getStates().set( remoteClientId, { name: 'Peer' } );
			mockCheckPresence.mockResolvedValue( {
				otherClientIds: [ remoteClientId ],
			} );
			await jest.advanceTimersByTimeAsync( 10_000 );
			await tick();

			// Collaborator leaves DURING provider creation (before
			// startAwarenessMonitor has subscribed).
			awareness.getStates().delete( remoteClientId );

			// Now resolve the slow provider — connectProviders finishes
			// and startAwarenessMonitor runs its initial check.
			resolveProvider!( undefined );
			await tick();

			// The initial awareness check should detect no remote
			// clients and start the downgrade timer.
			expect( awareness.getStates().size ).toBeLessThanOrEqual( 1 );

			// Advance past the debounce — should downgrade.
			await jest.advanceTimersByTimeAsync( 31_000 );
			await tick();

			// Provider should be destroyed (downgraded).
			expect( mockProviderResult.destroy ).toHaveBeenCalled();
		} );
	} );

	describe( 'unload', () => {
		it( 'unloads an entity and destroys its state', async () => {
			const manager = createSyncManager();

			await manager.load(
				mockSyncConfig,
				'post',
				'123',
				mockRecord,
				mockHandlers
			);

			// Wait for providers to connect (immediate presence detection).
			await tick();

			manager.unload( 'post', '123' );

			expect( mockProviderResult.destroy ).toHaveBeenCalled();
		} );

		it( 'does not throw when unloading non-existent entity', () => {
			const manager = createSyncManager();

			expect( () => {
				manager.unload( 'post', '999' );
			} ).not.toThrow();
		} );

		it( 'allows reloading after unloading', async () => {
			const manager = createSyncManager();

			await manager.load(
				mockSyncConfig,
				'post',
				'123',
				mockRecord,
				mockHandlers
			);
			await tick();

			manager.unload( 'post', '123' );

			jest.clearAllMocks();
			mockPresenceDetectorImmediate();

			await manager.load(
				mockSyncConfig,
				'post',
				'123',
				mockRecord,
				mockHandlers
			);
			await tick();

			expect(
				mockSyncConfig.applyChangesToCRDTDoc
			).toHaveBeenCalledTimes( 1 );
			expect( mockProviderCreator ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'unloads specific entity without affecting others', async () => {
			const manager = createSyncManager();

			await manager.load(
				mockSyncConfig,
				'post',
				'123',
				mockRecord,
				mockHandlers
			);

			await manager.load(
				mockSyncConfig,
				'post',
				'456',
				mockRecord,
				mockHandlers
			);

			// Wait for providers to connect.
			await tick();

			manager.unload( 'post', '123' );

			// Only one provider should be destroyed
			expect( mockProviderResult.destroy ).toHaveBeenCalledTimes( 1 );

			// Should still be able to update the other entity
			jest.clearAllMocks();
			manager.update( 'post', '456', { title: 'Updated' }, 'local' );

			// Wait a tick for yieldToEventLoop.
			await tick();

			expect( mockSyncConfig.applyChangesToCRDTDoc ).toHaveBeenCalled();
		} );
	} );

	describe( 'update', () => {
		it( 'updates CRDT document with local changes', async () => {
			// Capture the Y.Doc from provider creator
			let capturedDoc: Y.Doc | null = null;
			mockProviderCreator.mockImplementation( async ( { ydoc } ) => {
				capturedDoc = ydoc;
				return mockProviderResult;
			} );

			const manager = createSyncManager();

			await manager.load(
				mockSyncConfig,
				'post',
				'123',
				mockRecord,
				mockHandlers
			);
			await tick();

			jest.clearAllMocks();

			const changes = { title: 'Updated Title' };
			manager.update( 'post', '123', changes, 'local-editor' );

			// Wait a tick for yieldToEventLoop.
			await tick();

			expect( mockSyncConfig.applyChangesToCRDTDoc ).toHaveBeenCalledWith(
				expect.any( Y.Doc ),
				changes
			);

			const ydoc = capturedDoc as unknown as Y.Doc;
			const stateMap = ydoc.getMap( CRDT_STATE_MAP_KEY );
			expect( stateMap.get( SAVED_AT_KEY ) ).toBeUndefined();
			expect( stateMap.get( SAVED_BY_KEY ) ).toBeUndefined();
		} );

		it( 'does not update when entity is not loaded', async () => {
			const manager = createSyncManager();

			const changes = { title: 'Updated Title' };
			manager.update( 'post', '999', changes, 'local-editor' );

			await tick();

			expect(
				mockSyncConfig.applyChangesToCRDTDoc
			).not.toHaveBeenCalled();
		} );

		it( 'applies changes with specified origin', async () => {
			let capturedDoc: Y.Doc | null = null;
			mockProviderCreator.mockImplementation( async ( { ydoc } ) => {
				capturedDoc = ydoc;
				return mockProviderResult;
			} );

			const manager = createSyncManager();

			await manager.load(
				mockSyncConfig,
				'post',
				'123',
				mockRecord,
				mockHandlers
			);
			await tick();

			expect( capturedDoc ).not.toBeNull();

			const transactSpy = jest.spyOn(
				capturedDoc as unknown as Y.Doc,
				'transact'
			);

			const changes = { title: 'Updated Title' };
			const customOrigin = 'custom-origin';

			manager.update( 'post', '123', changes, customOrigin );

			await tick();

			expect( transactSpy ).toHaveBeenCalledWith(
				expect.any( Function ),
				customOrigin
			);
		} );

		it( 'updates the record metadata when the update is associated with a save', async () => {
			let capturedDoc: Y.Doc | null = null;
			mockProviderCreator.mockImplementation( async ( { ydoc } ) => {
				capturedDoc = ydoc;
				return mockProviderResult;
			} );

			const manager = createSyncManager();

			await manager.load(
				mockSyncConfig,
				'post',
				'123',
				mockRecord,
				mockHandlers
			);
			await tick();

			jest.clearAllMocks();

			const changes = { title: 'Updated Title' };
			const now = Date.now();

			manager.update( 'post', '123', changes, 'local-editor', {
				isSave: true,
			} );

			await tick();

			expect( mockSyncConfig.applyChangesToCRDTDoc ).toHaveBeenCalledWith(
				expect.any( Y.Doc ),
				changes
			);

			const ydoc = capturedDoc as unknown as Y.Doc;
			const stateMap = ydoc.getMap( CRDT_STATE_MAP_KEY );
			expect( stateMap.get( SAVED_AT_KEY ) ).toBeGreaterThanOrEqual(
				now
			);
			expect( stateMap.get( SAVED_BY_KEY ) ).toBe( ydoc.clientID );
		} );
	} );

	describe( 'CRDT doc observation', () => {
		it( 'edits the local entity record when remote updates arrive', async () => {
			let capturedDoc: Y.Doc | null = null;
			mockProviderCreator.mockImplementation( async ( { ydoc } ) => {
				capturedDoc = ydoc;
				return mockProviderResult;
			} );

			const manager = createSyncManager();

			await manager.load(
				mockSyncConfig,
				'post',
				'123',
				mockRecord,
				mockHandlers
			);
			await tick();

			mockHandlers.editRecord.mockClear();

			expect( capturedDoc ).not.toBeNull();

			const remoteDoc = new Y.Doc();
			remoteDoc
				.getMap( CRDT_RECORD_MAP_KEY )
				.set( 'title', 'Title from remote peer' );
			Y.applyUpdateV2(
				capturedDoc as unknown as Y.Doc,
				Y.encodeStateAsUpdateV2( remoteDoc )
			);
			remoteDoc.destroy();

			await tick();

			expect( mockHandlers.editRecord ).toHaveBeenCalledTimes( 1 );
			expect( mockHandlers.editRecord ).toHaveBeenCalledWith( {
				title: 'Title from remote peer',
			} );
		} );

		it( 'does not edit the local record for local transactions', async () => {
			let capturedDoc: Y.Doc | null = null;
			mockProviderCreator.mockImplementation( async ( { ydoc } ) => {
				capturedDoc = ydoc;
				return mockProviderResult;
			} );

			const manager = createSyncManager();

			await manager.load(
				mockSyncConfig,
				'post',
				'123',
				mockRecord,
				mockHandlers
			);
			await tick();

			mockHandlers.editRecord.mockClear();

			expect( capturedDoc ).not.toBeNull();
			const ydoc = capturedDoc as unknown as Y.Doc;

			const recordMap = ydoc.getMap( CRDT_RECORD_MAP_KEY );

			jest.clearAllMocks();

			ydoc.transact( () => {
				recordMap.set( 'title', 'Local Update' );
			} );

			await tick();

			expect( mockHandlers.editRecord ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'collection deferral', () => {
		let mockCollectionHandlers: {
			onStatusChange: jest.Mock< () => void >;
			refetchRecords: jest.Mock< () => Promise< void > >;
		};

		beforeEach( () => {
			mockCollectionHandlers = {
				onStatusChange: jest.fn< () => void >(),
				refetchRecords: jest.fn< () => Promise< void > >( () =>
					Promise.resolve()
				),
			};
		} );

		it( 'defers collection providers when checkPresence is available', async () => {
			mockPresenceDetectorDeferred();

			const manager = createSyncManager();

			// Load entity first (deferred).
			await manager.load(
				mockSyncConfig,
				'postType/post',
				'123',
				mockRecord,
				mockHandlers
			);

			// Load collection (should also defer).
			await manager.loadCollection(
				mockSyncConfig,
				'taxonomy/category',
				mockCollectionHandlers
			);

			await tick();

			// Entity creates 1 presence detector. Providers not connected.
			expect( mockCreatePresenceDetector ).toHaveBeenCalledTimes( 1 );
			expect( mockProviderCreator ).not.toHaveBeenCalled();
		} );

		it( 'connects collection immediately when no checkPresence', async () => {
			const noPresenceConfig: jest.MockedObject< SyncConfig > = {
				...mockSyncConfig,
				checkPresence: undefined,
			};

			const manager = createSyncManager();

			await manager.loadCollection(
				noPresenceConfig,
				'taxonomy/category',
				mockCollectionHandlers
			);

			// Collection should connect immediately.
			expect( mockProviderCreator ).toHaveBeenCalledTimes( 1 );
			expect( mockProviderCreator ).toHaveBeenCalledWith(
				expect.objectContaining( {
					objectType: 'taxonomy/category',
					objectId: null,
				} )
			);
		} );

		it( 'connects collection when entity detects collaborator', async () => {
			let capturedCallback: ( () => void ) | null = null;
			mockCreatePresenceDetector.mockImplementation( ( options ) => {
				capturedCallback = options.onCollaboratorDetected;
				return { destroy: jest.fn() };
			} );

			const manager = createSyncManager();

			// Load entity (deferred).
			await manager.load(
				mockSyncConfig,
				'postType/post',
				'123',
				mockRecord,
				mockHandlers
			);

			// Load collection (deferred, piggybacking on entity).
			await manager.loadCollection(
				mockSyncConfig,
				'taxonomy/category',
				mockCollectionHandlers
			);

			// Nothing connected yet.
			expect( mockProviderCreator ).not.toHaveBeenCalled();

			// Entity detects collaborator.
			capturedCallback!();
			await tick();

			// Both entity and collection should be connected.
			expect( mockProviderCreator ).toHaveBeenCalledTimes( 2 );

			// Verify collection provider was created with correct args.
			expect( mockProviderCreator ).toHaveBeenCalledWith(
				expect.objectContaining( {
					objectType: 'taxonomy/category',
					objectId: null,
				} )
			);
		} );

		it( 'connects collection immediately if entity is already synced', async () => {
			mockPresenceDetectorImmediate();

			const manager = createSyncManager();

			// Load entity — presence detector fires immediately.
			await manager.load(
				mockSyncConfig,
				'postType/post',
				'123',
				mockRecord,
				mockHandlers
			);
			await tick();

			// Entity provider connected.
			expect( mockProviderCreator ).toHaveBeenCalledTimes( 1 );

			// Now load collection — entity already synced, so connect now.
			await manager.loadCollection(
				mockSyncConfig,
				'taxonomy/category',
				mockCollectionHandlers
			);

			expect( mockProviderCreator ).toHaveBeenCalledTimes( 2 );
			expect( mockProviderCreator ).toHaveBeenCalledWith(
				expect.objectContaining( {
					objectType: 'taxonomy/category',
					objectId: null,
				} )
			);
		} );

		it( 'disconnects collection when all entities downgrade', async () => {
			jest.useFakeTimers( { advanceTimers: true } );

			let entityAwareness: Awareness | null = null;
			let awarenessCallCount = 0;
			const configWithAwareness: jest.MockedObject< SyncConfig > = {
				...mockSyncConfig,
				createAwareness: jest.fn( ( ydoc: Y.Doc ) => {
					const awareness = new Awareness( ydoc );
					awarenessCallCount++;
					// Capture only the entity's awareness (first call).
					// The collection's awareness (second call) is separate.
					if ( awarenessCallCount === 1 ) {
						entityAwareness = awareness;
					}
					return awareness;
				} ),
			};

			// Track provider results individually.
			const providerResults: ProviderCreatorResult[] = [];
			mockProviderCreator.mockImplementation( () => {
				const result: ProviderCreatorResult = {
					destroy: jest.fn(),
					on: jest.fn(),
				};
				providerResults.push( result );
				return Promise.resolve( result );
			} );

			mockPresenceDetectorImmediate();

			const manager = createSyncManager();

			await manager.load(
				configWithAwareness,
				'post',
				'123',
				mockRecord,
				mockHandlers
			);
			await tick();

			// Load collection after entity is synced.
			await manager.loadCollection(
				configWithAwareness,
				'taxonomy/category',
				mockCollectionHandlers
			);

			// Both connected: 1 entity + 1 collection.
			expect( providerResults ).toHaveLength( 2 );

			const awareness = entityAwareness!;
			const remoteClientId = 999;

			// Remote client joins then leaves.
			awareness.getStates().set( remoteClientId, { name: 'Peer' } );
			awareness.emit( 'change', [
				{ added: [ remoteClientId ], updated: [], removed: [] },
			] );
			awareness.getStates().delete( remoteClientId );
			awareness.emit( 'change', [
				{ added: [], updated: [], removed: [ remoteClientId ] },
			] );

			// Advance past downgrade debounce (30s).
			await jest.advanceTimersByTimeAsync( 31_000 );

			// Entity provider destroyed.
			expect( providerResults[ 0 ].destroy ).toHaveBeenCalledTimes( 1 );
			// Collection provider also destroyed.
			expect( providerResults[ 1 ].destroy ).toHaveBeenCalledTimes( 1 );

			jest.useRealTimers();
		} );

		it( 'disconnects collection when last synced entity is unloaded', async () => {
			mockPresenceDetectorImmediate();

			const providerResults: ProviderCreatorResult[] = [];
			mockProviderCreator.mockImplementation( () => {
				const result: ProviderCreatorResult = {
					destroy: jest.fn(),
					on: jest.fn(),
				};
				providerResults.push( result );
				return Promise.resolve( result );
			} );

			const manager = createSyncManager();

			await manager.load(
				mockSyncConfig,
				'post',
				'123',
				mockRecord,
				mockHandlers
			);
			await tick();

			await manager.loadCollection(
				mockSyncConfig,
				'taxonomy/category',
				mockCollectionHandlers
			);

			// Both connected.
			expect( providerResults ).toHaveLength( 2 );

			// Unload entity.
			manager.unload( 'post', '123' );

			// Entity provider destroyed.
			expect( providerResults[ 0 ].destroy ).toHaveBeenCalledTimes( 1 );
			// Collection provider also destroyed (last entity gone).
			expect( providerResults[ 1 ].destroy ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'keeps collection connected if another entity is still synced', async () => {
			mockPresenceDetectorImmediate();

			const providerResults: ProviderCreatorResult[] = [];
			mockProviderCreator.mockImplementation( () => {
				const result: ProviderCreatorResult = {
					destroy: jest.fn(),
					on: jest.fn(),
				};
				providerResults.push( result );
				return Promise.resolve( result );
			} );

			const manager = createSyncManager();

			// Load two entities.
			await manager.load(
				mockSyncConfig,
				'post',
				'123',
				mockRecord,
				mockHandlers
			);
			await tick();

			await manager.load(
				mockSyncConfig,
				'post',
				'456',
				mockRecord,
				mockHandlers
			);
			await tick();

			// Load collection.
			await manager.loadCollection(
				mockSyncConfig,
				'taxonomy/category',
				mockCollectionHandlers
			);

			// 2 entity providers + 1 collection provider.
			expect( providerResults ).toHaveLength( 3 );

			// Unload first entity.
			manager.unload( 'post', '123' );

			// Entity 1 provider destroyed.
			expect( providerResults[ 0 ].destroy ).toHaveBeenCalledTimes( 1 );
			// Collection still connected (entity 2 still synced).
			expect( providerResults[ 2 ].destroy ).not.toHaveBeenCalled();

			// Unload second entity.
			manager.unload( 'post', '456' );

			// Now collection should also disconnect.
			expect( providerResults[ 2 ].destroy ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'collection unload works when providers are deferred', async () => {
			mockPresenceDetectorDeferred();

			const manager = createSyncManager();

			await manager.load(
				mockSyncConfig,
				'post',
				'123',
				mockRecord,
				mockHandlers
			);

			await manager.loadCollection(
				mockSyncConfig,
				'taxonomy/category',
				mockCollectionHandlers
			);

			// Providers are deferred — not connected.
			expect( mockProviderCreator ).not.toHaveBeenCalled();

			// Unload entity should not throw even though collection
			// has no providers to destroy.
			expect( () => {
				manager.unload( 'post', '123' );
			} ).not.toThrow();
		} );
	} );
} );
