/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { getSyncManager } from '../../sync';
import { saveCRDTDoc } from '../save-crdt-doc';

jest.mock( '@wordpress/api-fetch' );
jest.mock( '../../sync', () => ( {
	getSyncManager: jest.fn(),
} ) );

function createDeferred() {
	let resolve;
	let reject;
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
	let syncManager;

	beforeEach( () => {
		apiFetch.mockReset();
		syncManager = {
			createPersistedCRDTDoc: jest.fn(),
		};
		getSyncManager.mockReturnValue( syncManager );
	} );

	it( 'saves the serialized CRDT document through the sync endpoint', async () => {
		const fetch = createDeferred();
		syncManager.createPersistedCRDTDoc.mockResolvedValue( 'doc' );
		apiFetch.mockImplementation( () => fetch.promise );

		const save = saveCRDTDoc( 'postType/post', 1 );

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

		await saveCRDTDoc( 'postType/post', 1 );

		expect( apiFetch ).not.toHaveBeenCalled();
	} );

	it( 'serializes save requests for the same room', async () => {
		const firstFetch = createDeferred();
		syncManager.createPersistedCRDTDoc
			.mockResolvedValueOnce( 'doc-1' )
			.mockResolvedValueOnce( 'doc-2' );
		apiFetch
			.mockImplementationOnce( () => firstFetch.promise )
			.mockResolvedValueOnce( {} );

		const firstSave = saveCRDTDoc( 'postType/post', 1 );
		const secondSave = saveCRDTDoc( 'postType/post', 1 );

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
			( objectType, objectId ) => Promise.resolve( `doc-${ objectId }` )
		);
		apiFetch
			.mockImplementationOnce( () => firstFetch.promise )
			.mockResolvedValueOnce( {} );

		const firstSave = saveCRDTDoc( 'postType/post', 1 );
		const secondSave = saveCRDTDoc( 'postType/post', 2 );

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
		apiFetch
			.mockImplementationOnce( () => firstFetch.promise )
			.mockResolvedValueOnce( {} );

		const firstSave = saveCRDTDoc( 'postType/post', 1 );
		const secondSave = saveCRDTDoc( 'postType/post', 1 );

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
