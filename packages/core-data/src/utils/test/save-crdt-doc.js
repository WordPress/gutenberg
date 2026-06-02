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
	LOCAL_UNDO_IGNORED_ORIGIN: 'local-undo-ignored',
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
	for ( let index = 0; index < 5; index++ ) {
		await Promise.resolve();
	}
}

describe( 'saveCRDTDoc', () => {
	let syncManager;

	beforeEach( () => {
		apiFetch.mockReset();
		syncManager = {
			createPersistedCRDTDoc: jest.fn(),
			update: jest.fn(),
		};
		getSyncManager.mockReturnValue( syncManager );
	} );

	it( 'notifies the sync manager of a background CRDT snapshot after the sync save endpoint succeeds', async () => {
		const fetch = createDeferred();
		syncManager.createPersistedCRDTDoc.mockResolvedValue( 'doc' );
		apiFetch.mockImplementation( () => fetch.promise );

		const save = saveCRDTDoc( 'postType/post', 1 );

		await flushPromises();

		expect( syncManager.update ).not.toHaveBeenCalled();

		fetch.resolve( {} );
		await save;

		expect( syncManager.update ).toHaveBeenCalledWith(
			'postType/post',
			1,
			{},
			'local-undo-ignored',
			{ persistenceEvent: 'backgroundCRDTSnapshot' }
		);
	} );

	it( 'does not mark the entity as saved when there is no serialized CRDT document', async () => {
		syncManager.createPersistedCRDTDoc.mockResolvedValue( null );

		await saveCRDTDoc( 'postType/post', 1 );

		expect( apiFetch ).not.toHaveBeenCalled();
		expect( syncManager.update ).not.toHaveBeenCalled();
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
