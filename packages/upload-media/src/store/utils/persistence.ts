/**
 * Durable persistence for the upload queue.
 *
 * Mirrors a serializable subset of in-flight queue items into IndexedDB so an
 * interrupted upload can be detected and resumed after a reload or crash. All
 * functions degrade to no-ops when IndexedDB is unavailable (private mode,
 * older environments) so the in-memory pipeline keeps working.
 */

/**
 * Internal dependencies
 */
import type { PersistedQueueItem, QueueItem, QueueItemId } from '../types';
import { ItemStatus } from '../types';

/**
 * Statuses worth persisting - anything still in flight. Completed/errored
 * items are removed from the queue (and from storage) by removeItem.
 */
const PERSISTABLE_STATUSES = [
	ItemStatus.Queued,
	ItemStatus.Processing,
	ItemStatus.Paused,
	ItemStatus.PendingRetry,
];

const DB_NAME = 'wp-upload-media';
const DB_VERSION = 1;
const STORE_NAME = 'queue';

const DEFAULT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days.
const DEFAULT_MAX_BYTES = 500 * 1024 * 1024; // 500 MB.

/**
 * Whether durable storage is usable in this environment.
 *
 * @return True when IndexedDB can be accessed.
 */
export function isPersistenceAvailable(): boolean {
	try {
		return typeof window !== 'undefined' && Boolean( window.indexedDB );
	} catch {
		return false;
	}
}

function openDb(): Promise< IDBDatabase > {
	return new Promise( ( resolve, reject ) => {
		const request = window.indexedDB.open( DB_NAME, DB_VERSION );
		request.onupgradeneeded = () => {
			const db = request.result;
			if ( ! db.objectStoreNames.contains( STORE_NAME ) ) {
				db.createObjectStore( STORE_NAME, { keyPath: 'id' } );
			}
		};
		request.onsuccess = () => resolve( request.result );
		request.onerror = () => reject( request.error );
	} );
}

function withStore< T >(
	mode: IDBTransactionMode,
	run: ( store: IDBObjectStore ) => IDBRequest | void,
	getResult: () => T
): Promise< T > {
	return openDb().then(
		( db ) =>
			new Promise< T >( ( resolve, reject ) => {
				const tx = db.transaction( STORE_NAME, mode );
				run( tx.objectStore( STORE_NAME ) );
				tx.oncomplete = () => {
					db.close();
					resolve( getResult() );
				};
				tx.onerror = () => {
					db.close();
					reject( tx.error );
				};
			} )
	);
}

/**
 * Writes (or replaces) a persisted queue item.
 *
 * Real browsers structured-clone File/Blob into IndexedDB natively and
 * efficiently, so the record is stored as-is without any serialization step.
 *
 * @param record Serializable queue item.
 */
export async function persistItem(
	record: PersistedQueueItem
): Promise< void > {
	if ( ! isPersistenceAvailable() ) {
		return;
	}
	try {
		await withStore(
			'readwrite',
			( store ) => store.put( record ),
			() => undefined
		);
	} catch {
		// Quota or transient IndexedDB failure: keep the in-memory pipeline going.
	}
}

/**
 * Removes a persisted queue item by id.
 *
 * @param id Item id.
 */
export async function deleteItem( id: QueueItemId ): Promise< void > {
	if ( ! isPersistenceAvailable() ) {
		return;
	}
	try {
		await withStore(
			'readwrite',
			( store ) => store.delete( id ),
			() => undefined
		);
	} catch {
		// Ignore - best-effort cleanup.
	}
}

/**
 * Reads all persisted queue items.
 *
 * @return The stored records, or an empty array when storage is unavailable.
 */
export async function getAllItems(): Promise< PersistedQueueItem[] > {
	if ( ! isPersistenceAvailable() ) {
		return [];
	}
	try {
		let stored: PersistedQueueItem[] = [];
		await withStore(
			'readonly',
			( store ) => {
				const request = store.getAll();
				request.onsuccess = () => {
					stored = request.result as PersistedQueueItem[];
				};
			},
			() => stored
		);
		return stored;
	} catch {
		return [];
	}
}

/**
 * Removes every persisted queue item.
 */
export async function clearAll(): Promise< void > {
	if ( ! isPersistenceAvailable() ) {
		return;
	}
	try {
		await withStore(
			'readwrite',
			( store ) => store.clear(),
			() => undefined
		);
	} catch {
		// Ignore.
	}
}

/**
 * Drops stale and over-budget records.
 *
 * Removes records older than `maxAgeMs`, then, if the surviving records' total
 * `file.size` exceeds `maxBytes`, drops oldest-first until under budget.
 *
 * @param opts          Bounds.
 * @param opts.maxAgeMs Maximum age in ms (default 7 days).
 * @param opts.maxBytes Maximum total bytes (default 500 MB).
 * @param now           Current time in ms; injectable for tests.
 * @return The surviving records.
 */
export async function pruneStale(
	{
		maxAgeMs = DEFAULT_MAX_AGE_MS,
		maxBytes = DEFAULT_MAX_BYTES,
	}: { maxAgeMs?: number; maxBytes?: number } = {},
	now: number = Date.now()
): Promise< PersistedQueueItem[] > {
	const all = await getAllItems();
	if ( all.length === 0 ) {
		return [];
	}

	const fresh = all.filter( ( r ) => now - r.persistedAt <= maxAgeMs );
	const stale = all.filter( ( r ) => now - r.persistedAt > maxAgeMs );

	// Oldest first, so over-budget pruning drops the oldest survivors.
	fresh.sort( ( a, b ) => a.persistedAt - b.persistedAt );

	const survivors: PersistedQueueItem[] = [];
	const overBudget: PersistedQueueItem[] = [];
	let total = fresh.reduce( ( sum, r ) => sum + ( r.file?.size ?? 0 ), 0 );

	for ( const record of fresh ) {
		if ( total > maxBytes ) {
			overBudget.push( record );
			total -= record.file?.size ?? 0;
		} else {
			survivors.push( record );
		}
	}

	await Promise.all(
		[ ...stale, ...overBudget ].map( ( r ) => deleteItem( r.id ) )
	);

	return survivors;
}

/**
 * Maps an in-memory queue item to its serializable persisted form.
 *
 * Returns null when the item should not be persisted (wrong status, or durable
 * storage is unavailable), so callers can simply bail on null.
 *
 * @param item In-memory queue item.
 * @param now  Timestamp to stamp the record with.
 * @return The persisted record, or null.
 */
export function toPersistedRecord(
	item: QueueItem,
	now: number
): PersistedQueueItem | null {
	if ( ! isPersistenceAvailable() ) {
		return null;
	}
	if ( ! PERSISTABLE_STATUSES.includes( item.status ) ) {
		return null;
	}
	return {
		id: item.id,
		uploadId: item.uploadId,
		postId: item.postId,
		batchId: item.batchId,
		parentId: item.parentId,
		file: item.file,
		sourceFile: item.sourceFile,
		originalHeicFile: item.originalHeicFile,
		poster: item.poster,
		operations: item.operations,
		currentOperation: item.currentOperation,
		status: item.status,
		attachment: item.attachment,
		subSizes: item.subSizes,
		additionalData: item.additionalData,
		retryCount: item.retryCount,
		nextRetryTimestamp: item.nextRetryTimestamp,
		progress: item.progress,
		sourceUrl: item.sourceUrl,
		sourceAttachmentId: item.sourceAttachmentId,
		persistedAt: now,
	};
}
