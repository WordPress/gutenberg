import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import apiFetch from '@wordpress/api-fetch';
import type { SyncManager } from '@wordpress/sync';
import { getSyncManager } from '../../sync';
import { saveCRDTDoc } from '../save-crdt-doc';

vi.mock( import( '@wordpress/api-fetch' ) );
vi.mock( import( '../../sync' ), () => ( {
	getSyncManager: vi.fn(),
} ) );

function createDeferred() {
	// The promise executor below assigns both synchronously.
	let resolve!: ( value: unknown ) => void;
	let reject!: ( reason: unknown ) => void;
	const promise = new Promise( ( _resolve, _reject ) => {
		resolve = _resolve;
		reject = _reject;
	} );

	return { promise, resolve, reject };
}

async function flushPromises() {
	await new Promise( ( resolve ) => setTimeout( resolve, 0 ) );
}

describe( 'saveCRDTDoc', () => {
	let syncManager: { createPersistedCRDTDoc: Mock };

	beforeEach( () => {
		vi.mocked( apiFetch ).mockReset();
		syncManager = {
			createPersistedCRDTDoc: vi.fn(),
		};
		vi.mocked( getSyncManager ).mockReturnValue(
			// The stub provides only what `saveCRDTDoc` needs.
			syncManager as unknown as SyncManager
		);
	} );

	it( 'saves the serialized CRDT document through the sync endpoint', async () => {
		const fetch = createDeferred();
		syncManager.createPersistedCRDTDoc.mockResolvedValue( 'doc' );
		vi.mocked( apiFetch ).mockImplementation( () => fetch.promise );

		const save = saveCRDTDoc( 'postType/post', '1' );

		await flushPromises();

		fetch.resolve( {} );
		await save;

		expect( apiFetch ).toHaveBeenCalledWith( {
			path: '/wp-sync/v1/save',
			method: 'POST',
			data: {
				room: 'postType/post:1',
				doc: 'doc',
			},
		} );
	} );

	it( 'does not call the sync endpoint when there is no serialized CRDT document', async () => {
		syncManager.createPersistedCRDTDoc.mockResolvedValue( null );

		await saveCRDTDoc( 'postType/post', '1' );

		expect( apiFetch ).not.toHaveBeenCalled();
	} );

	it( 'serializes save requests for the same room', async () => {
		const firstFetch = createDeferred();
		syncManager.createPersistedCRDTDoc
			.mockResolvedValueOnce( 'doc-1' )
			.mockResolvedValueOnce( 'doc-2' );
		vi.mocked( apiFetch )
			.mockImplementationOnce( () => firstFetch.promise )
			.mockResolvedValueOnce( {} );

		const firstSave = saveCRDTDoc( 'postType/post', '1' );
		const secondSave = saveCRDTDoc( 'postType/post', '1' );

		await flushPromises();

		expect( syncManager.createPersistedCRDTDoc ).toHaveBeenCalledTimes( 1 );
		expect( apiFetch ).toHaveBeenCalledTimes( 1 );
		expect( apiFetch ).toHaveBeenLastCalledWith( {
			path: '/wp-sync/v1/save',
			method: 'POST',
			data: {
				room: 'postType/post:1',
				doc: 'doc-1',
			},
		} );

		firstFetch.resolve( {} );
		await firstSave;
		await flushPromises();

		expect( syncManager.createPersistedCRDTDoc ).toHaveBeenCalledTimes( 2 );
		expect( apiFetch ).toHaveBeenCalledTimes( 2 );
		expect( apiFetch ).toHaveBeenLastCalledWith( {
			path: '/wp-sync/v1/save',
			method: 'POST',
			data: {
				room: 'postType/post:1',
				doc: 'doc-2',
			},
		} );

		await secondSave;
	} );

	it( 'does not serialize save requests for different rooms', async () => {
		const firstFetch = createDeferred();
		syncManager.createPersistedCRDTDoc.mockImplementation(
			( objectType: string, objectId: string ) =>
				Promise.resolve( `doc-${ objectId }` )
		);
		vi.mocked( apiFetch )
			.mockImplementationOnce( () => firstFetch.promise )
			.mockResolvedValueOnce( {} );

		const firstSave = saveCRDTDoc( 'postType/post', '1' );
		const secondSave = saveCRDTDoc( 'postType/post', '2' );

		await flushPromises();

		expect( syncManager.createPersistedCRDTDoc ).toHaveBeenCalledTimes( 2 );
		expect( apiFetch ).toHaveBeenCalledTimes( 2 );
		expect( apiFetch ).toHaveBeenNthCalledWith( 1, {
			path: '/wp-sync/v1/save',
			method: 'POST',
			data: {
				room: 'postType/post:1',
				doc: 'doc-1',
			},
		} );
		expect( apiFetch ).toHaveBeenNthCalledWith( 2, {
			path: '/wp-sync/v1/save',
			method: 'POST',
			data: {
				room: 'postType/post:2',
				doc: 'doc-2',
			},
		} );

		await secondSave;
		firstFetch.resolve( {} );
		await firstSave;
	} );

	it( 'continues a same-room queue after a failed save', async () => {
		const firstFetch = createDeferred();
		syncManager.createPersistedCRDTDoc
			.mockResolvedValueOnce( 'doc-1' )
			.mockResolvedValueOnce( 'doc-2' );
		vi.mocked( apiFetch )
			.mockImplementationOnce( () => firstFetch.promise )
			.mockResolvedValueOnce( {} );

		const firstSave = saveCRDTDoc( 'postType/post', '1' );
		const secondSave = saveCRDTDoc( 'postType/post', '1' );

		await flushPromises();

		firstFetch.reject( new Error( 'save failed' ) );
		await expect( firstSave ).rejects.toThrow( 'save failed' );
		await flushPromises();

		expect( syncManager.createPersistedCRDTDoc ).toHaveBeenCalledTimes( 2 );
		expect( apiFetch ).toHaveBeenCalledTimes( 2 );
		expect( apiFetch ).toHaveBeenLastCalledWith( {
			path: '/wp-sync/v1/save',
			method: 'POST',
			data: {
				room: 'postType/post:1',
				doc: 'doc-2',
			},
		} );

		await secondSave;
	} );
} );
