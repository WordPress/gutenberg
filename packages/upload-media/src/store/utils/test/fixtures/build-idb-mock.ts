/**
 * Minimal reference-preserving in-memory IndexedDB test double.
 *
 * fake-indexeddb cannot structured-clone jsdom File/Blob/ArrayBuffer values in
 * this environment, so it silently drops the binary payload the persistence
 * layer stores. This stub returns exactly the objects that were put — with no
 * cloning — which is faithful to how a real browser round-trips a Blob and lets
 * File objects survive intact through put/getAll.
 *
 * Assign the result to `globalThis.indexedDB` in a test's beforeEach; pass a
 * fresh instance each time to isolate tests.
 */

class FakeRequest {
	onsuccess: ( ( event: { target: FakeRequest } ) => void ) | null = null;
	onerror: ( () => void ) | null = null;
	onupgradeneeded: ( () => void ) | null = null;
	result: unknown;

	_succeed( result: unknown, onDone?: () => void ): void {
		this.result = result;
		queueMicrotask( () => {
			this.onsuccess?.( { target: this } );
			if ( onDone ) {
				queueMicrotask( onDone );
			}
		} );
	}
}

function request( result: unknown, onDone?: () => void ): FakeRequest {
	const r = new FakeRequest();
	r._succeed( result, onDone );
	return r;
}

class FakeObjectStore {
	constructor(
		private readonly map: Map< string, any >,
		private readonly tx: FakeTransaction
	) {}

	put( value: any ): FakeRequest {
		this.map.set( value.id, value );
		return request( value.id, () => this.tx._complete() );
	}

	delete( id: string ): FakeRequest {
		this.map.delete( id );
		return request( undefined, () => this.tx._complete() );
	}

	getAll(): FakeRequest {
		return request( [ ...this.map.values() ], () => this.tx._complete() );
	}

	clear(): FakeRequest {
		this.map.clear();
		return request( undefined, () => this.tx._complete() );
	}
}

class FakeTransaction {
	oncomplete: ( () => void ) | null = null;
	onerror: ( () => void ) | null = null;
	error: unknown = null;

	constructor( private readonly map: Map< string, any > ) {}

	objectStore(): FakeObjectStore {
		return new FakeObjectStore( this.map, this );
	}

	_complete(): void {
		this.oncomplete?.();
	}
}

class FakeDB {
	objectStoreNames = { contains: () => true };

	constructor( private readonly map: Map< string, any > ) {}

	transaction(): FakeTransaction {
		return new FakeTransaction( this.map );
	}

	createObjectStore(): FakeObjectStore {
		return new FakeObjectStore( this.map, new FakeTransaction( this.map ) );
	}

	close(): void {}
}

export function buildIndexedDBMock(): { open: () => FakeRequest } {
	const map = new Map< string, any >();
	return {
		open(): FakeRequest {
			const r = new FakeRequest();
			r._succeed( new FakeDB( map ) );
			return r;
		},
	};
}
