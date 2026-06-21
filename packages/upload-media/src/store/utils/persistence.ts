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
import type { PersistedQueueItem, QueueItemId } from '../types';

const DB_NAME = 'wp-upload-media';
const DB_VERSION = 1;
const STORE_NAME = 'queue';

const DEFAULT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days.
const DEFAULT_MAX_BYTES = 500 * 1024 * 1024; // 500 MB.

/**
 * Serialized File representation for IndexedDB storage.
 * File objects cannot be structuredClone'd reliably across environments,
 * so we store the binary data as a plain number array alongside metadata.
 * Using a plain Array (rather than ArrayBuffer/Uint8Array) ensures the data
 * survives structuredClone in all test environments (e.g. jsdom with polyfills).
 */
type SerializedFile = {
	_isSerializedFile: true;
	bytes: number[];
	name: string;
	type: string;
	lastModified: number;
};

/**
 * Serialized form of a PersistedQueueItem stored in IndexedDB.
 * File fields are replaced with SerializedFile objects.
 */
type StoredRecord = Omit< PersistedQueueItem, 'file' | 'sourceFile' > & {
	file: SerializedFile;
	sourceFile: SerializedFile;
};

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

/**
 * Converts a File to a plain-object representation safe for structuredClone.
 *
 * @param file The File to serialize.
 * @return A serializable record containing the file's binary data and metadata.
 */
async function serializeFile( file: File ): Promise< SerializedFile > {
	const buffer = await file.arrayBuffer();
	// Store as a plain Array so the data survives structuredClone in all
	// environments (ArrayBuffer and TypedArray cloning is unreliable in some
	// jsdom / polyfill combinations).
	const bytes = Array.from( new Uint8Array( buffer ) );
	return {
		_isSerializedFile: true,
		bytes,
		name: file.name,
		type: file.type,
		lastModified: file.lastModified,
	};
}

/**
 * Reconstructs a File from its serialized form.
 *
 * @param serialized The serialized file record.
 * @return The reconstructed File.
 */
function deserializeFile( serialized: SerializedFile ): File {
	return new File( [ new Uint8Array( serialized.bytes ) ], serialized.name, {
		type: serialized.type,
		lastModified: serialized.lastModified,
	} );
}

/**
 * Converts a PersistedQueueItem to a StoredRecord safe for IndexedDB.
 *
 * @param record The queue item to serialize.
 * @return A StoredRecord with File fields replaced by SerializedFile objects.
 */
async function serializeRecord(
	record: PersistedQueueItem
): Promise< StoredRecord > {
	const [ file, sourceFile ] = await Promise.all( [
		serializeFile( record.file ),
		serializeFile( record.sourceFile ),
	] );
	return { ...record, file, sourceFile };
}

/**
 * Converts a StoredRecord back to a PersistedQueueItem.
 *
 * @param stored The stored record from IndexedDB.
 * @return The reconstructed PersistedQueueItem.
 */
function deserializeRecord( stored: StoredRecord ): PersistedQueueItem {
	return {
		...stored,
		file: deserializeFile( stored.file ),
		sourceFile: deserializeFile( stored.sourceFile ),
	};
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
 * @param record Serializable queue item.
 */
export async function persistItem(
	record: PersistedQueueItem
): Promise< void > {
	if ( ! isPersistenceAvailable() ) {
		return;
	}
	try {
		const stored = await serializeRecord( record );
		await withStore(
			'readwrite',
			( store ) => store.put( stored ),
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
		let stored: StoredRecord[] = [];
		await withStore(
			'readonly',
			( store ) => {
				const request = store.getAll();
				request.onsuccess = () => {
					stored = request.result as StoredRecord[];
				};
			},
			() => stored
		);
		return stored.map( deserializeRecord );
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
