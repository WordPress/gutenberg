import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import apiFetch from '@wordpress/api-fetch';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { createRegistry } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import type { Mock } from 'vitest';
import { store as coreStore } from '..';
import {
	editMediaEntity,
	setCollaborationSupported,
	recordSyncUndoLevel,
} from '../private-actions';
import { getEntitySyncManager } from '../entity-sync';
import { unlock } from '../lock-unlock';
import type { EntitySyncManager } from '../entity-sync';
import type * as ET from '../entity-types';
import type { CoreDataThunkArgs } from '../private-types';

// The request options the tests read.
type FetchOptions = {
	path: string;
	method?: string;
	data?: Record< string, unknown >;
	headers?: Record< string, string >;
};

// The tests stub REST responses and errors in place of typed requests.
const apiFetchMock = apiFetch as unknown as Mock<
	( options: FetchOptions ) => unknown
>;

/**
 * Types the mocks an action runs with, which provide only what it uses.
 *
 * @param args The mocked thunk arguments.
 */
function thunkArgs( args: Record< string, unknown > ): CoreDataThunkArgs {
	return args as unknown as CoreDataThunkArgs;
}

vi.mock( import( '@wordpress/api-fetch' ) );
vi.mock( import( '../entity-sync' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	getEntitySyncManager: vi.fn(),
} ) );

describe( 'editMediaEntity', () => {
	let dispatch: Mock & {
		receiveEntityRecords: Mock;
		__unstableAcquireStoreLock: Mock;
		__unstableReleaseStoreLock: Mock;
	};
	let resolveSelect: { getEntitiesConfig: Mock };

	beforeEach( () => {
		apiFetchMock.mockReset();
		dispatch = Object.assign( vi.fn(), {
			receiveEntityRecords: vi.fn(),
			__unstableAcquireStoreLock: vi.fn( () => 'test-lock' ),
			__unstableReleaseStoreLock: vi.fn(),
		} );
		resolveSelect = {
			getEntitiesConfig: vi.fn( () => [
				{
					kind: 'postType',
					name: 'attachment',
					baseURL: '/wp/v2/media',
				},
			] ),
		};
	} );

	it( 'should return early when recordId is not provided', async () => {
		const result = await editMediaEntity(
			// @ts-expect-error Tests the guard against a missing record ID.
			null
		)(
			thunkArgs( {
				dispatch,
				resolveSelect,
			} )
		);

		expect( result ).toBeUndefined();
		expect( dispatch.__unstableAcquireStoreLock ).not.toHaveBeenCalled();
		expect( apiFetch ).not.toHaveBeenCalled();
	} );

	it( 'should return early when entity config is not found', async () => {
		resolveSelect.getEntitiesConfig.mockReturnValue( [] );

		const result = await editMediaEntity( 123 )(
			thunkArgs( {
				dispatch,
				resolveSelect,
			} )
		);

		expect( result ).toBeUndefined();
		expect( dispatch.__unstableAcquireStoreLock ).not.toHaveBeenCalled();
		expect( apiFetch ).not.toHaveBeenCalled();
	} );

	it( 'should successfully edit a media entity', async () => {
		const recordId = 123;
		const edits = {
			src: 'https://example.com/image.jpg',
			modifiers: [
				{ type: 'resize', args: { width: 300, height: 200 } },
			],
		};
		const updatedRecord = {
			id: recordId,
			src: 'https://example.com/image.jpg',
			modified: true,
		};

		apiFetchMock.mockResolvedValue( updatedRecord );

		const result = await editMediaEntity(
			recordId,
			edits
		)(
			thunkArgs( {
				dispatch,
				resolveSelect,
			} )
		);

		expect( dispatch.__unstableAcquireStoreLock ).toHaveBeenCalledWith(
			'core',
			[ 'entities', 'records', 'postType', 'attachment', recordId ],
			{ exclusive: true }
		);

		expect( dispatch ).toHaveBeenCalledWith( {
			type: 'SAVE_ENTITY_RECORD_START',
			kind: 'postType',
			name: 'attachment',
			recordId,
		} );

		expect( apiFetch ).toHaveBeenCalledWith( {
			path: '/wp/v2/media/123/edit',
			method: 'POST',
			data: edits,
		} );

		expect( dispatch.receiveEntityRecords ).toHaveBeenCalledWith(
			'postType',
			'attachment',
			updatedRecord,
			undefined,
			true,
			undefined,
			undefined
		);

		expect( dispatch ).toHaveBeenCalledWith( {
			type: 'SAVE_ENTITY_RECORD_FINISH',
			kind: 'postType',
			name: 'attachment',
			recordId,
			error: undefined,
		} );

		expect( dispatch.__unstableReleaseStoreLock ).toHaveBeenCalledWith(
			'test-lock'
		);

		expect( result ).toBe( updatedRecord );
	} );

	it( 'should handle API errors when throwOnError is false', async () => {
		const recordId = 123;
		const edits = { src: 'https://example.com/image.jpg' };
		const apiError = new Error( 'API error' );

		apiFetchMock.mockRejectedValue( apiError );

		const result = await editMediaEntity( recordId, edits, {
			throwOnError: false,
		} )( thunkArgs( { dispatch, resolveSelect } ) );

		expect( dispatch ).toHaveBeenCalledWith( {
			type: 'SAVE_ENTITY_RECORD_START',
			kind: 'postType',
			name: 'attachment',
			recordId,
		} );

		expect( dispatch ).toHaveBeenCalledWith( {
			type: 'SAVE_ENTITY_RECORD_FINISH',
			kind: 'postType',
			name: 'attachment',
			recordId,
			error: apiError,
		} );

		expect( dispatch.__unstableReleaseStoreLock ).toHaveBeenCalledWith(
			'test-lock'
		);

		expect( result ).toBeUndefined();
	} );

	it( 'should throw errors when throwOnError is true', async () => {
		const recordId = 123;
		const edits = { src: 'https://example.com/image.jpg' };
		const apiError = new Error( 'API error' );

		apiFetchMock.mockRejectedValue( apiError );

		await expect(
			editMediaEntity( recordId, edits, { throwOnError: true } )(
				thunkArgs( {
					dispatch,
					resolveSelect,
				} )
			)
		).rejects.toEqual( apiError );

		expect( dispatch.__unstableReleaseStoreLock ).toHaveBeenCalledWith(
			'test-lock'
		);
	} );

	it( 'should use custom fetch function when provided', async () => {
		const recordId = 123;
		const edits = { src: 'https://example.com/image.jpg' };
		const customFetch = vi.fn().mockResolvedValue( { id: recordId } );

		await editMediaEntity( recordId, edits, {
			__unstableFetch: customFetch,
		} )( thunkArgs( { dispatch, resolveSelect } ) );

		expect( customFetch ).toHaveBeenCalledWith( {
			path: '/wp/v2/media/123/edit',
			method: 'POST',
			data: edits,
		} );
		expect( apiFetch ).not.toHaveBeenCalled();
	} );

	it( 'should handle null response from API', async () => {
		const recordId = 123;
		const edits = { src: 'https://example.com/image.jpg' };

		apiFetchMock.mockResolvedValue( null );

		const result = await editMediaEntity(
			recordId,
			edits
		)(
			thunkArgs( {
				dispatch,
				resolveSelect,
			} )
		);

		expect( dispatch.receiveEntityRecords ).not.toHaveBeenCalled();
		expect( result ).toBeUndefined();
	} );
} );

describe( 'setCollaborationSupported', () => {
	afterEach( () => {
		vi.mocked( getEntitySyncManager ).mockReset();
	} );

	it( 'unloads sync and resets sync undo state when disabling collaboration', () => {
		const syncManager = {
			unloadAll: vi.fn(),
		};
		const dispatch = vi.fn();
		vi.mocked( getEntitySyncManager ).mockReturnValue(
			// The stub provides only what the actions use.
			syncManager as unknown as EntitySyncManager
		);

		setCollaborationSupported( false )( thunkArgs( { dispatch } ) );

		expect( dispatch ).toHaveBeenCalledWith( {
			type: 'SET_COLLABORATION_SUPPORTED',
			supported: false,
		} );
		expect( syncManager.unloadAll ).toHaveBeenCalledTimes( 1 );
	} );
} );

describe( 'recordSyncUndoLevel', () => {
	it( 'adds a level to the undo manager and changes state', () => {
		const undoManager = { addRecord: vi.fn() };
		const select = { getUndoManager: () => undoManager };
		const dispatch = vi.fn();

		recordSyncUndoLevel(
			'postType',
			'post',
			1
		)( thunkArgs( { select, dispatch } ) );

		expect( undoManager.addRecord ).toHaveBeenCalledTimes( 1 );
		const [ record ] = undoManager.addRecord.mock.calls[ 0 ];
		expect( record ).toHaveLength( 1 );
		// The level names the record that opened it.
		expect( record[ 0 ].id ).toEqual( {
			kind: 'postType',
			name: 'post',
			recordId: 1,
			isSyncUndoLevel: true,
		} );
		expect( dispatch ).toHaveBeenCalledWith( {
			type: 'RECORD_SYNC_UNDO_LEVEL',
		} );
	} );
} );

describe( 'saveDirtyEntities', () => {
	beforeEach( () => {
		apiFetchMock.mockReset();
	} );

	const postTypeConfig = {
		kind: 'postType',
		name: 'post',
		baseURL: '/wp/v2/posts',
		transientEdits: { blocks: true, selection: true },
		mergedEdits: { meta: true },
	};

	const postId = 44;

	const post = {
		id: postId,
		type: 'post',
		title: 'bar',
		content: 'bar',
		excerpt: 'crackers',
		status: 'draft',
	};

	const postEntityRecord = {
		key: postId,
		kind: 'postType',
		name: 'post',
		title: 'bar',
	};

	function createRegistryWithStoresAndEditedPost() {
		const registry = createRegistry();

		registry.register( blockEditorStore );
		registry.register( coreStore );
		registry.register( noticesStore );

		registry.dispatch( coreStore ).addEntities( [ postTypeConfig ] );

		registry
			.dispatch( coreStore )
			.receiveEntityRecords( 'postType', 'post', post );

		registry
			.dispatch( coreStore )
			.editEntityRecord( 'postType', 'post', postId, {
				content: 'new bar',
			} );

		return registry;
	}

	const hasEdits = ( registry: ReturnType< typeof createRegistry > ) =>
		registry
			.select( coreStore )
			.hasEditsForEntityRecord( 'postType', 'post', postId );

	const getContent = ( registry: ReturnType< typeof createRegistry > ) =>
		// The test post is loaded, with its content.
		(
			registry
				.select( coreStore )
				.getEditedEntityRecord(
					'postType',
					'post',
					postId
				) as unknown as ET.Post
		 ).content;

	const getMethod = ( options: FetchOptions ) =>
		options.headers?.[ 'X-HTTP-Method-Override' ] ||
		options.method ||
		'GET';

	it( 'saves modified entities', async () => {
		apiFetchMock.mockImplementation( async ( options: FetchOptions ) => {
			const method = getMethod( options );
			const { path, data } = options;

			if (
				method === 'PUT' &&
				path.startsWith( `/wp/v2/posts/${ postId }` )
			) {
				return { ...post, ...data };
			}

			throw {
				code: 'unknown_path',
				message: `Unknown path: ${ method } ${ path }`,
			};
		} );

		const registry = createRegistryWithStoresAndEditedPost();

		expect( hasEdits( registry ) ).toBe( true );

		await unlock( registry.dispatch( coreStore ) ).saveDirtyEntities( {
			dirtyEntityRecords: [ postEntityRecord ],
		} );

		expect( getContent( registry ) ).toBe( 'new bar' );
		expect( hasEdits( registry ) ).toBe( false );

		const notices = registry.select( noticesStore ).getNotices();
		expect( notices ).toMatchObject( [
			{
				status: 'success',
				content: 'Site updated.',
			},
		] );
	} );

	it( 'shows a notice to convey errors', async () => {
		apiFetchMock.mockImplementation( async ( options: FetchOptions ) => {
			const method = getMethod( options );
			const { path } = options;

			throw {
				code: 'unknown_path',
				message: `Unknown path: ${ method } ${ path }`,
			};
		} );

		const registry = createRegistryWithStoresAndEditedPost();

		expect( hasEdits( registry ) ).toBe( true );

		await unlock( registry.dispatch( coreStore ) ).saveDirtyEntities( {
			dirtyEntityRecords: [ postEntityRecord ],
		} );

		expect( getContent( registry ) ).toBe( 'new bar' );
		expect( hasEdits( registry ) ).toBe( true );

		const notices = registry.select( noticesStore ).getNotices();
		expect( notices[ 0 ].status ).toBe( 'error' );
		expect( notices[ 0 ].content ).toMatch( /^Unknown path/ );
	} );

	it( 'derives error messages depending on failure scenario', async () => {
		const registry = createRegistryWithStoresAndEditedPost();

		// Throw an object with a `message` property
		apiFetchMock.mockImplementation( async () => {
			throw {
				message: 'Lorem ipsum',
			};
		} );

		await unlock( registry.dispatch( coreStore ) ).saveDirtyEntities( {
			dirtyEntityRecords: [ postEntityRecord ],
		} );

		expect(
			registry.select( noticesStore ).getNotices().at( -1 )
		).toMatchObject( {
			status: 'error',
			content: 'Lorem ipsum',
		} );

		// Throw an object with an empty `message` property
		apiFetchMock.mockImplementation( async () => {
			throw {
				message: '',
			};
		} );

		await unlock( registry.dispatch( coreStore ) ).saveDirtyEntities( {
			dirtyEntityRecords: [ postEntityRecord ],
		} );

		expect(
			registry.select( noticesStore ).getNotices().at( -1 )
		).toMatchObject( {
			status: 'error',
			content: 'Saving failed.',
		} );

		// Throw an actual error
		apiFetchMock.mockImplementation( async () => {
			throw new Error( 'Dolor sit amet' );
		} );

		await unlock( registry.dispatch( coreStore ) ).saveDirtyEntities( {
			dirtyEntityRecords: [ postEntityRecord ],
		} );

		expect(
			registry.select( noticesStore ).getNotices().at( -1 )
		).toMatchObject( {
			status: 'error',
			content: 'Dolor sit amet',
		} );

		// Throw a string
		apiFetchMock.mockImplementation( async () => {
			throw 'Consectetur adipiscing elit';
		} );

		await unlock( registry.dispatch( coreStore ) ).saveDirtyEntities( {
			dirtyEntityRecords: [ postEntityRecord ],
		} );

		expect(
			registry.select( noticesStore ).getNotices().at( -1 )
		).toMatchObject( {
			status: 'error',
			content: 'Consectetur adipiscing elit',
		} );

		// Throw an object implementing `toString`
		apiFetchMock.mockImplementation( async () => {
			throw {
				toString() {
					return 'Sed do eiusmod tempor incididunt';
				},
			};
		} );

		await unlock( registry.dispatch( coreStore ) ).saveDirtyEntities( {
			dirtyEntityRecords: [ postEntityRecord ],
		} );

		expect(
			registry.select( noticesStore ).getNotices().at( -1 )
		).toMatchObject( {
			status: 'error',
			content: 'Sed do eiusmod tempor incididunt',
		} );

		// Throw something with no clear message
		apiFetchMock.mockImplementation( async () => {
			throw {};
		} );

		await unlock( registry.dispatch( coreStore ) ).saveDirtyEntities( {
			dirtyEntityRecords: [ postEntityRecord ],
		} );

		expect(
			registry.select( noticesStore ).getNotices().at( -1 )
		).toMatchObject( {
			status: 'error',
			content: 'Saving failed.',
		} );
	} );

	it( 'aborts if `onSave` fails', async () => {
		apiFetchMock.mockImplementation( async () => {
			throw {
				code: 'unknown_path',
				message: 'Unknown path',
			};
		} );

		const registry = createRegistryWithStoresAndEditedPost();

		await unlock( registry.dispatch( coreStore ) ).saveDirtyEntities( {
			dirtyEntityRecords: [ postEntityRecord ],
			async onSave() {
				throw new Error( 'oh no' );
			},
		} );

		expect( hasEdits( registry ) ).toBe( true );

		const notices = registry.select( noticesStore ).getNotices();
		expect( notices ).toMatchObject( [
			{
				status: 'error',
				content: 'oh no',
			},
		] );
	} );

	it( 'honors the `successNoticeContent` prop', async () => {
		apiFetchMock.mockImplementation( async ( options: FetchOptions ) => {
			const { data } = options;
			return { ...post, ...data };
		} );

		const registry = createRegistryWithStoresAndEditedPost();

		await unlock( registry.dispatch( coreStore ) ).saveDirtyEntities( {
			dirtyEntityRecords: [ postEntityRecord ],
			successNoticeContent: 'eureka',
		} );

		const notices = registry.select( noticesStore ).getNotices();
		expect( notices ).toMatchObject( [
			{
				status: 'success',
				content: 'eureka',
			},
		] );
	} );
} );
