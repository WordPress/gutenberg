/**
 * WordPress dependencies
 */
import { createRegistry } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as uploadStore } from '../';
import { unlock } from '../../lock-unlock';
import { persistItem } from '../utils/persistence';
import { buildIndexedDBMock } from '../utils/test/fixtures/build-idb-mock';
import { ItemStatus, OperationType } from '../types';

jest.mock( '@wordpress/blob', () => ( {
	__esModule: true,
	createBlobURL: jest.fn( () => 'blob:foo' ),
	isBlobURL: jest.fn( ( str: string ) => str.startsWith( 'blob:' ) ),
	revokeBlobURL: jest.fn(),
} ) );

function flush() {
	return new Promise( ( resolve ) => setTimeout( resolve, 0 ) );
}

function setup() {
	( globalThis as any ).indexedDB = buildIndexedDBMock();
	const registry = createRegistry();
	// @ts-ignore
	registry.register( uploadStore );
	// Pause so loaded items do not auto-process before we assert.
	unlock( registry.dispatch( uploadStore ) ).pauseQueue();
	return registry;
}

describe( 'resume orchestration', () => {
	it( 'loads persisted records as PendingResume items', async () => {
		const registry = setup();
		const file = new File( [ 'x' ], 'a.jpg', { type: 'image/jpeg' } );
		await persistItem( {
			id: 'p1',
			uploadId: 'u1',
			file,
			sourceFile: file,
			additionalData: {},
			status: ItemStatus.Processing,
			operations: [ OperationType.Upload ],
			persistedAt: Date.now(),
		} );

		await unlock( registry.dispatch( uploadStore ) ).loadPersistedQueue();
		await flush();

		const resumable = unlock(
			registry.select( uploadStore )
		).getResumableItems();
		expect( resumable ).toHaveLength( 1 );
		expect( resumable[ 0 ].uploadId ).toBe( 'u1' );
		expect( resumable[ 0 ].status ).toBe( ItemStatus.PendingResume );
		expect( resumable[ 0 ].abortController ).toBeInstanceOf(
			AbortController
		);
	} );

	it( 'registers callbacks by uploadId', async () => {
		const registry = setup();
		const file = new File( [ 'x' ], 'a.jpg', { type: 'image/jpeg' } );
		await persistItem( {
			id: 'p1',
			uploadId: 'u1',
			file,
			sourceFile: file,
			additionalData: {},
			status: ItemStatus.Processing,
			operations: [ OperationType.Upload ],
			persistedAt: Date.now(),
		} );
		await unlock( registry.dispatch( uploadStore ) ).loadPersistedQueue();
		await flush();

		const onChange = jest.fn();
		await unlock( registry.dispatch( uploadStore ) ).registerItemCallbacks(
			'u1',
			{ onChange }
		);

		const item = unlock( registry.select( uploadStore ) ).getItemByUploadId(
			'u1'
		);
		expect( item.onChange ).toBe( onChange );
	} );

	it( 'discard clears loaded items', async () => {
		const registry = setup();
		const file = new File( [ 'x' ], 'a.jpg', { type: 'image/jpeg' } );
		await persistItem( {
			id: 'p1',
			uploadId: 'u1',
			file,
			sourceFile: file,
			additionalData: {},
			status: ItemStatus.Processing,
			operations: [ OperationType.Upload ],
			persistedAt: Date.now(),
		} );
		await unlock( registry.dispatch( uploadStore ) ).loadPersistedQueue();
		await flush();

		await unlock(
			registry.dispatch( uploadStore )
		).discardPersistedQueue();
		await flush();

		expect(
			unlock( registry.select( uploadStore ) ).getAllItems()
		).toHaveLength( 0 );
	} );

	it( 'resumePersistedQueue flips PendingResume items to Processing', async () => {
		const registry = setup();
		const file = new File( [ 'x' ], 'a.jpg', { type: 'image/jpeg' } );
		await persistItem( {
			id: 'p1',
			uploadId: 'u1',
			file,
			sourceFile: file,
			additionalData: {},
			status: ItemStatus.Processing,
			operations: [ OperationType.Upload ],
			persistedAt: Date.now(),
		} );

		await unlock( registry.dispatch( uploadStore ) ).loadPersistedQueue();
		await flush();

		// Confirm it is PendingResume before resuming.
		const before = unlock(
			registry.select( uploadStore )
		).getItemByUploadId( 'u1' );
		expect( before.status ).toBe( ItemStatus.PendingResume );

		// Queue is still paused so processItem is a no-op;
		// we only assert the status flip.
		await unlock( registry.dispatch( uploadStore ) ).resumePersistedQueue();
		await flush();

		const after = unlock(
			registry.select( uploadStore )
		).getItemByUploadId( 'u1' );
		expect( after.status ).toBe( ItemStatus.Processing );
	} );
} );
